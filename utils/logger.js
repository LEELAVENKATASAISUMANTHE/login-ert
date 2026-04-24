import winston from 'winston';
import LokiTransport from 'winston-loki';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('info'),
  LOKI_HOST: z.string().url().default('http://loki:3100'),
  APP_NAME: z.string().default('placement-backend'),
  SERVICE_NAME: z.string().default('placement-backend'),
  ENVIRONMENT: z.string().optional(),
});

const env = envSchema.parse(process.env);

const defaultLabels = {
  app: env.APP_NAME,
  environment: env.ENVIRONMENT ?? env.NODE_ENV,
  service: env.SERVICE_NAME,
};

const lokiTransport = new LokiTransport({
  host: env.LOKI_HOST,
  labels: defaultLabels,
  json: true,
  format: winston.format.json(),
   batching: false,
  replaceTimestamp: false,
  onConnectionError: (err) =>
    process.stderr.write(`[logger] Loki connection error: ${err.message}\n`),
});

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(
    ({ timestamp, level, message, ...meta }) =>
      `${timestamp} [${level}]: ${message}${
        Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''
      }`
  )
);

const transports = [lokiTransport];

if (env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({ level: env.LOG_LEVEL, format: consoleFormat })
  );
}

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: defaultLabels,
  transports,
  exitOnError: false,
});

function shutdownLogger() {
  return new Promise((resolve) => {
    logger.on('finish', resolve);
    logger.end();
  });
}

['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, async () => {
    await shutdownLogger();
    process.exit(0);
  });
});

export default logger;
export { shutdownLogger };