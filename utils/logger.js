import winston from 'winston';
import Transport from 'winston-transport';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const NODE_ENV = process.env.NODE_ENV || 'production';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const LEVEL_TO_SEVERITY = {
  error:   SeverityNumber.ERROR,
  warn:    SeverityNumber.WARN,
  info:    SeverityNumber.INFO,
  http:    SeverityNumber.DEBUG4,
  verbose: SeverityNumber.DEBUG2,
  debug:   SeverityNumber.DEBUG,
  silly:   SeverityNumber.TRACE,
};

class OtelTransport extends Transport {
  log(info, callback) {
    setImmediate(() => this.emit('logged', info));

    const { level, message, timestamp, ...attrs } = info;

    const flatAttrs = {};
    for (const [k, v] of Object.entries(attrs)) {
      if (v != null) {
        flatAttrs[k] = typeof v === 'object' ? JSON.stringify(v) : v;
      }
    }

    try {
      logs.getLogger('placement-backend').emit({
        severityNumber: LEVEL_TO_SEVERITY[level] ?? SeverityNumber.INFO,
        severityText: level.toUpperCase(),
        body: message,
        attributes: flatAttrs,
      });
    } catch {
      // Silently ignore — OTel collector may be unreachable
    }

    callback();
  }
}

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) =>
    `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
  )
);

const transports = [new OtelTransport()];

if (NODE_ENV !== 'production') {
  transports.push(new winston.transports.Console({ level: LOG_LEVEL, format: consoleFormat }));
}

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: jsonFormat,
  defaultMeta: { service: 'placement-backend', environment: NODE_ENV },
  transports,
  exitOnError: false,
});

export default logger;
