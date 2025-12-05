# Logger Utility - Code Explanation

## Overview
This logger utility is built using Winston (a popular Node.js logging library) with Loki integration for centralized log management. It provides structured logging with multiple output destinations.

## Key Components Breakdown

### 1. **Imports and Dependencies**
```javascript
import winston from 'winston';
import LokiTransport from 'winston-loki';
```
- `winston`: Core logging library that handles log formatting, levels, and transports
- `winston-loki`: Transport plugin that sends logs to Grafana Loki

### 2. **Log Levels Configuration**
```javascript
const logLevels = {
  error: 0,    // Critical errors
  warn: 1,     // Warnings
  info: 2,     // General info
  http: 3,     // HTTP logs
  verbose: 4,  // Detailed info
  debug: 5,    // Debug info
  silly: 6     // Very detailed
};
```
- Lower numbers = higher priority
- Only logs at or above the configured level will be output
- Allows filtering of log verbosity based on environment

### 3. **Color Configuration**
```javascript
const logColors = { ... };
winston.addColors(logColors);
```
- Makes console logs easier to read by color-coding different log levels
- Red for errors, yellow for warnings, green for info, etc.

### 4. **Format Configurations**

#### Console Format
```javascript
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    // Custom formatting logic
  })
);
```
- **timestamp**: Adds readable timestamp to each log
- **colorize**: Applies colors to console output
- **errors**: Captures error stack traces
- **printf**: Custom formatter for human-readable output

#### Loki Format
```javascript
const lokiFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);
```
- Structured JSON format that Loki can parse and index
- Includes timestamps and error stack traces

### 5. **Environment-Based Configuration**
```javascript
const getLogLevel = () => {
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};
```
- Production: Only logs `info` level and above (reduces noise)
- Development: Logs `debug` level and above (more verbose for debugging)

### 6. **Loki Configuration**
```javascript
const lokiOptions = {
  host: process.env.LOKI_HOST || 'http://localhost:3100',
  labels: {
    app: process.env.APP_NAME || 'login-app',
    environment: process.env.NODE_ENV || 'development',
    service: 'authentication-service'
  },
  // ... other options
};
```
- **host**: Loki server endpoint
- **labels**: Metadata attached to all logs (used for filtering in Grafana)
- **batching**: Groups multiple logs before sending (more efficient)
- **interval**: How often to send batched logs

### 7. **Transport Configuration**
Transports define where logs are sent:

#### Console Transport
```javascript
new winston.transports.Console({
  level: getLogLevel(),
  format: consoleFormat,
  handleExceptions: true,
  handleRejections: true
});
```
- Outputs to terminal/console
- Handles uncaught exceptions and unhandled promise rejections

#### File Transports
```javascript
new winston.transports.File({
  filename: 'logs/error.log',
  level: 'error',
  maxsize: 5242880, // 5MB
  maxFiles: 5
});
```
- Saves logs to local files
- **maxsize**: Rotates files when they reach size limit
- **maxFiles**: Keeps only the most recent files
- Separate files for errors and combined logs

#### Loki Transport
```javascript
new LokiTransport({
  ...lokiOptions,
  level: getLogLevel(),
  format: lokiFormat
});
```
- Sends logs to Loki server for centralized storage
- Only added if Loki is configured

### 8. **Enhanced Logger Methods**

#### Error Logging
```javascript
error: (message, error = null, metadata = {}) => {
  const logData = {
    ...metadata,
    ...(error && {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    })
  };
  logger.error(message, logData);
}
```
- Extracts useful information from Error objects
- Includes stack traces for debugging
- Accepts additional metadata

#### HTTP Logging
```javascript
http: (req, res, responseTime = null) => {
  const logData = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode: res.statusCode,
    ...(responseTime && { responseTime: `${responseTime}ms` })
  };
  logger.http(`${req.method} ${req.url} - ${res.statusCode}`, logData);
}
```
- Captures HTTP request details
- Includes method, URL, IP, user agent, status code
- Optional response time tracking

#### Specialized Logging Methods
- **auth()**: Authentication events (login, logout, registration)
- **database()**: Database operations with timing
- **security()**: Security-related events (failed logins, suspicious activity)

### 9. **Error Handling**
```javascript
process.on('uncaughtException', (error) => {
  enhancedLogger.error('Uncaught Exception', error, { fatal: true });
  process.exit(1);
});
```
- Captures and logs unhandled errors
- Ensures critical errors are recorded before application crashes

## Benefits of This Logger

1. **Centralized Logging**: All logs go to Loki for easy searching and analysis
2. **Structured Data**: JSON format makes logs queryable and filterable
3. **Multiple Outputs**: Console for development, files for backup, Loki for production
4. **Performance**: Batching reduces network overhead
5. **Security**: Captures authentication and security events
6. **Debugging**: Detailed error information with stack traces
7. **Monitoring**: HTTP request tracking for performance analysis

## Usage Tips

1. Use appropriate log levels (don't log sensitive data at debug level in production)
2. Include relevant metadata to make logs searchable
3. Use structured logging for consistent data format
4. Monitor log volume to avoid overwhelming Loki
5. Set up alerts in Grafana based on error logs

## Environment Variables Required

- `LOKI_HOST`: URL of your Loki server
- `APP_NAME`: Name of your application
- `NODE_ENV`: Environment (development/production)