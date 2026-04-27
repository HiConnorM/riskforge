import pino from 'pino';

/**
 * Structured JSON logger powered by Pino.
 *
 * Security: sensitive fields (passwords, secrets, tokens, API keys,
 * authorization headers) are redacted before they can reach log sinks.
 * Never log raw financial data or PII.
 */
export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
    bindings(bindings) {
      return { pid: bindings['pid'], host: bindings['hostname'] };
    },
  },
  redact: {
    paths: [
      '*.password',
      '*.secret',
      '*.apiKey',
      '*.api_key',
      '*.token',
      '*.authorization',
      '*.Authorization',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
});

export type Logger = typeof logger;
