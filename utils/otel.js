import { resourceFromAttributes } from '@opentelemetry/resources';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { logs } from '@opentelemetry/api-logs';

export function initOtel() {
  const resource = resourceFromAttributes({
    'service.name': 'placement-backend',
    'deployment.environment': process.env.NODE_ENV || 'development',
  });

 const exporter = new OTLPLogExporter({
  url: 'http://172.17.0.1:4318/v1/logs',  // Docker host IP
});

  const provider = new LoggerProvider({
    resource,
    processors: [new BatchLogRecordProcessor(exporter)],
  });

  logs.setGlobalLoggerProvider(provider);

  process.on('exit', () => {
    provider.shutdown().catch(() => {});
  });
}
