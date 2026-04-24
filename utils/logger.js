import { once } from 'node:events';
import pino from 'pino';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent', 'http', 'verbose', 'silly'])
    .transform((level) => {
      if (level === 'http') return 'info';
      if (level === 'verbose') return 'debug';
      if (level === 'silly') return 'trace';
      return level;
    })
    .default('info'),
  LOKI_HOST: z.string().url().default('http://loki:3100'),
  APP_NAME: z.string().min(1).default('placement-backend'),
  SERVICE_NAME: z.string().min(1).default('placement-backend'),
});

const env = envSchema.parse(process.env);

const labels = {
  app: env.APP_NAME,
  service: env.SERVICE_NAME,
  environment: env.NODE_ENV,
};

const transport = pino.transport({
  worker: {
    autoEnd: false,
  },
  targets: [
    {
      target: 'pino-loki',
      level: env.LOG_LEVEL,
      options: {
        host: env.LOKI_HOST,
        labels,
        batching: true,
        interval: 1,
        silenceErrors: false,
      },
    },
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          level: env.LOG_LEVEL,
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
          },
        }
      : {
          target: 'pino/file',
          level: env.LOG_LEVEL,
          options: {
            destination: 1,
          },
        },
  ],
});

transport.on('error', (err) => {
  process.stderr.write(`[logger] transport error: ${err.message}\n`);
});

const logger = pino(
  {
    base: labels,
    level: env.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
);

let shutdownPromise;

async function shutdownLogger() {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  shutdownPromise = (async () => {
    try {
      logger.flush?.();
    } catch {
      // Ignore flush errors while shutting down.
    }

    try {
      transport.end();
      await Promise.race([
        once(transport, 'close'),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch {
      // Ignore transport shutdown errors to avoid blocking process exit.
    }
  })();

  return shutdownPromise;
}

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, async () => {
    await shutdownLogger();
    process.exit(0);
  });
}

export default logger;
export { shutdownLogger };
