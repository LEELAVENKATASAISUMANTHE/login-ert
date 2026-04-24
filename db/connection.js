import pkg from 'pg';
import logger from '../utils/logger.js';

const { Pool } = pkg;

// Database configuration
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),

  // OPTIMIZED POOL SETTINGS
  max: 15,                          // ✅ Increased from 20 to handle more concurrent requests
  min: 2,                           // ✅ Keep minimum connections alive
  idleTimeoutMillis: 10000,         // ✅ Reduced from 30s to 10s - release idle connections faster
  connectionTimeoutMillis:  10000,   // ✅ Increased from 2s to 10s - prevent premature timeouts
  
  // ADDITIONAL OPTIMIZATIONS
  allowExitOnIdle: false,           // ✅ Keep pool alive
  statement_timeout: 30000,         // ✅ Kill queries running longer than 30s
  query_timeout: 30000,             // ✅ Client-side query timeout
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on('connect', () => {
  logger.info('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error({
    error: err.message,
    stack: err.stack
  }, '❌ Database connection error:');
});

// Test connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version()');
    logger.info({
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    }, '✅ Database connection test successful');
    client.release();
    return true;
  } catch (error) {
    logger.error({
      error: error.message,
      code: error.code,
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user
      }
    }, '❌ Database connection test failed:');
    
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
