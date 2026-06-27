import { type RequestHandler } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { makeApiError } from '@3dotpay/shared';

import { isTest } from '../config/env.js';

/**
 * Per-user rate limiter (mounted AFTER requireAuth, so `req.auth` is set).
 * Disabled under test to keep the suite deterministic.
 */
function perUser(windowMs: number, limit: number): RequestHandler {
  if (isTest) return (_req, _res, next) => next();
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Key by authenticated user; fall back to a normalized IP (the helper
    // collapses IPv6 addresses to a /64 so they can't bypass the limit).
    keyGenerator: (req) => req.auth?.userId ?? (req.ip ? ipKeyGenerator(req.ip) : 'anon'),
    handler: (_req, res) =>
      res.status(429).json(makeApiError('RATE_LIMITED', 'Too many requests — please slow down')),
  });
}

export const quoteRateLimit = perUser(60_000, 20); // 20 quotes / min
export const paymentRateLimit = perUser(60_000, 15); // 15 payments / min
export const statusRateLimit = perUser(60_000, 120); // 120 status polls / min
