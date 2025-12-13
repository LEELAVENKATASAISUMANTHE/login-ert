import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import logger from './logger.js';
import pool from '../db/connection.js'; // Import database connection

// Import routes
import rolesRoutes from '../routes/roles.route.js';
import permissionsRoutes from '../routes/permissions.route.js';

const app = express();

// ===== MIDDLEWARE =====

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: '*', // Configure this for production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// ===== PERFORMANCE MONITORING MIDDLEWARE =====
app.use((req, res, next) => {
  const startTime = Date.now();
  const startUsage = process.cpuUsage();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const cpuUsage = process.cpuUsage(startUsage);
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000;

    // Log slow requests (over 1 second)
    if (duration > 1000) {
      logger.warn('⚠️ SLOW REQUEST DETECTED', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        cpuTime: `${cpuPercent.toFixed(2)}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    } else {
      logger.debug('Request completed', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      });
    }
  });

  next();
});

// ===== ROUTES =====

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    status: 'OK'
  });
});

// ===== DATABASE HEALTH CHECK ROUTE =====
app.get('/health/database', async (req, res) => {
  logger.info('Database health check requested');
  
  try {
    // Test database connection
    const startTime = Date.now();
    const client = await pool.connect();
    
    // Run a simple query to test connectivity
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Release the client back to the pool
    client.release();
    
    logger.info('Database health check successful', {
      responseTime: `${responseTime}ms`,
      timestamp: result.rows[0].current_time
    });
    
    res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
      database: {
        status: 'CONNECTED',
        responseTime: `${responseTime}ms`,
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version.split(' ').slice(0, 2).join(' '), // PostgreSQL version
        poolInfo: {
          totalConnections: pool.totalCount,
          idleConnections: pool.idleCount,
          waitingClients: pool.waitingCount
        }
      }
    });
    
  } catch (error) {
    logger.error('Database health check failed', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      database: {
        status: 'DISCONNECTED',
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// ===== COMPREHENSIVE HEALTH CHECK =====
app.get('/health/complete', async (req, res) => {
  logger.info('Complete health check requested');
  
  const healthStatus = {
    server: {
      status: 'OK',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    },
    database: {
      status: 'UNKNOWN',
      responseTime: null,
      error: null
    }
  };
  
  let overallStatus = 200;
  
  // Test database connectivity
  try {
    const startTime = Date.now();
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    const endTime = Date.now();
    
    client.release();
    
    healthStatus.database = {
      status: 'CONNECTED',
      responseTime: `${endTime - startTime}ms`,
      timestamp: result.rows[0].current_time,
      poolInfo: {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount
      }
    };
    
  } catch (error) {
    logger.error('Database check failed in complete health check', {
      error: error.message
    });
    
    healthStatus.database = {
      status: 'DISCONNECTED',
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
    
    overallStatus = 503; // Service Unavailable
  }
  
  // Determine overall health
  const isHealthy = healthStatus.database.status === 'CONNECTED';
  
  res.status(overallStatus).json({
    success: isHealthy,
    message: isHealthy ? 'All systems operational' : 'Some systems are down',
    overall_status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    checks: healthStatus,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/roles', rolesRoutes);
app.use('/api/permissions', permissionsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  logger.info('Root endpoint accessed');
  res.status(200).json({
    success: true,
    message: 'Welcome to Login API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      database_health: '/health/database',
      complete_health: '/health/complete',
      roles: '/api/roles'
    }
  });
});

// ===== ERROR HANDLING =====

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      health: 'GET /health',
      database_health: 'GET /health/database',
      complete_health: 'GET /health/complete',
      roles: 'GET /api/roles'
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Global error handler', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: 'Something went wrong'
  });
});

export default app;