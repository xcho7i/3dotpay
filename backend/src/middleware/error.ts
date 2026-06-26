import { type ErrorRequestHandler, type RequestHandler } from 'express';
import { ZodError } from 'zod';
import { makeApiError, zodErrorToApiError } from '@3dotpay/shared';

import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

/** 404 handler — returns the standard ApiError envelope. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(makeApiError('NOT_FOUND', `Route not found: ${req.method} ${req.path}`));
};

/**
 * Centralized error handler. Maps known error types to the consistent ApiError
 * envelope. Express 5 forwards rejected async handlers here automatically.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json(zodErrorToApiError(err));
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json(makeApiError(err.code, err.message, err.details));
    return;
  }
  logger.error({ err }, 'Unhandled request error');
  res.status(500).json(makeApiError('INTERNAL_ERROR', 'An unexpected error occurred.'));
};
