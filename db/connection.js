import pkg from 'pg';
import logger from '../utils/logger.js';

const { Pool } = pkg;

// Database configuration
const dbConfig = {
  user: 'admin',           // Replace with your PostgreSQL username
  host: 'host.docker.internal',          // Replace with your database host
  database: 'placement',      // Replace with your database name  
  password: 'sumanth123',       // Replace with your PostgreSQL password
  port: 5432,                 // PostgreSQL default port
  
  // Connection pool settings
  max: 20,                    // Maximum number of connections in pool
  idleTimeoutMillis: 30000,   // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait when connecting
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on('connect', () => {
  logger.info('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('❌ Database connection error:', {
    error: err.message,
    stack: err.stack
  });
});

// Test connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version()');
    logger.info('✅ Database connection test successful', {
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    });
    client.release();
    return true;
  } catch (error) {
    logger.error('❌ Database connection test failed:', {
      error: error.message,
      code: error.code,
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user
      }
    });
    
    // Don't throw error - let app start anyway for testing
    logger.warn('⚠️  Application starting without database connection');
    return false;
  }
}

// Initialize connection test (but don't block startup)
testConnection().catch(() => {
  logger.warn('⚠️  Database connection failed, but application will continue');
});

export default pool;
