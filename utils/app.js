import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import logger from './logger.js';

// Import routes
import rolesRoutes from '../routes/roles.route.js';

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

// ===== ROUTES =====

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/roles', rolesRoutes);

// Root endpoint
app.get('/', (req, res) => {
  logger.info('Root endpoint accessed');
  res.status(200).json({
    success: true,
    message: 'Welcome to Login API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
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
    error: `Cannot ${req.method} ${req.originalUrl}`
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