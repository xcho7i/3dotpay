import { type Server } from 'node:http';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './lib/db.js';
import { logger } from './lib/logger.js';
import { startChainMonitor, stopChainMonitor } from './modules/transaction/monitor.worker.js';

/**
 * Process entry point. Connects to MongoDB (fail fast on error), then starts
 * the HTTP server with graceful shutdown.
 */
async function main(): Promise<void> {
  try {
    await connectDatabase();
  } catch {
    // connectDatabase already logged the cause.
    process.exit(1);
  }

  const app = createApp();

  const server: Server = app.listen(env.PORT, () => {
    logger.info(`3DotPay API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    logger.info('Health: GET /health and GET /api/v1/health');
  });

  // Background confirmation monitor (advances SUBMITTED transactions).
  startChainMonitor();

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
    stopChainMonitor();
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

void main();
