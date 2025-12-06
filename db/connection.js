import pkg from 'pg';
import logger from '../utils/logger.js';

const { Pool } = pkg;

// Database configuration
const dbConfig = {
  user: 'admin',
  host: '172.17.0.1',     // <--- replace this
  database: 'placement',
  password: 'sumanth123',
  port: 5432,

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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
