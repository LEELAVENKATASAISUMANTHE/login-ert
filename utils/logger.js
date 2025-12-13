import winston from 'winston';
import LokiTransport from 'winston-loki';

const NODE_ENV = process.env.NODE_ENV || 'production';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const LOKI_HOST = process.env.LOKI_HOST || 'http://loki:3100';

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    }`;
  })
);

const transports = [
  new LokiTransport({
    host: LOKI_HOST,
    labels: {
      app: 'login-app',
      service: 'backend',
      environment: NODE_ENV
    },
    json: true,
    
    // CRITICAL OPTIMIZATIONS
    batching: true,              // Enable batching
    interval: 5,                 // Send logs every 5 seconds
    timeout: 3000,               // Timeout after 3 seconds
    onConnectionError: (err) => {
      console.error('Loki connection error:', err.message);
    },
    
    // Reduce network overhead
    format: winston.format.json(),
    replaceTimestamp: true,
    gracefulShutdown: true,
  })
];

if (NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: LOG_LEVEL,
      format: consoleFormat
    })
  );
}

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: jsonFormat,
  defaultMeta: {
    service: 'login-app',
    environment: NODE_ENV
  },
  transports,
  exitOnError: false
});

export default logger;
