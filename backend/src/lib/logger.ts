import pino from 'pino';

import { env } from '../config/env.js';

/**
 * Application logger. Uses pretty output in development, structured JSON in
 * production. `pino-http` reuses this instance for request logging.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  // Never log credentials/tokens. Redact auth headers + known secret fields.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-dev-user-id"]',
      '*.authorization',
      '*.accessToken',
      '*.token',
      '*.privyAppSecret',
      '*.PRIVY_APP_SECRET',
    ],
    censor: '[REDACTED]',
  },
  ...(env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
});
