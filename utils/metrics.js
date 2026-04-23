import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';
import { z } from 'zod';

const envSchema = z.object({
  APP_NAME: z.string().default('placement-backend'),
  NODE_ENV: z.string().default('development'),
  // Validated here for documentation / future separate-server use; the app
  // exposes /metrics on the main Express port by default.
  PROMETHEUS_PORT: z.coerce.number().int().min(1).max(65535).optional(),
});

const env = envSchema.parse(process.env);

const registry = new Registry();

registry.setDefaultLabels({
  app: env.APP_NAME,
  environment: env.NODE_ENV,
});

collectDefaultMetrics({ register: registry });

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

function metricsMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path ?? req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };
    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });
  next();
}

async function metricsHandler(_req, res) {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
}

export { registry, metricsMiddleware, metricsHandler, httpRequestDuration, httpRequestTotal };
