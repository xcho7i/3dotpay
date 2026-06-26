import pino from 'pino';

import { env } from '../config/env.js';

/**
 * Application logger. Uses pretty output in development, structured JSON in
 * production. `pino-http` reuses this instance for request logging.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
});
