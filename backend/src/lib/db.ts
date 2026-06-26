import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { logger } from './logger.js';

/**
 * Connect to MongoDB via Mongoose. Optional: if MONGODB_URI is unset the API
 * runs in health-only mode. Success and failure are both logged; a failed
 * connection rejects so the caller can fail fast.
 */
export async function connectDatabase(): Promise<void> {
  if (!env.MONGODB_URI) {
    logger.warn('MONGODB_URI is not set — starting without a database (health-only).');
    return;
  }

  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    logger.info(`MongoDB connected (${mongoose.connection.name})`);
  } catch (err) {
    logger.error({ err }, 'MongoDB connection failed');
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
