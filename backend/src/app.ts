import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { healthRouter } from './modules/health/health.routes.js';
import { v1Router } from './routes/v1.js';

/**
 * Builds the Express application. Pure factory (no listen, no DB) so tests can
 * mount it with supertest without opening a socket.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    }),
  );
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Unversioned liveness probe (for infra/load balancers).
  app.use(healthRouter);

  // Versioned API surface.
  app.use('/api/v1', v1Router);

  // Fallbacks
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
