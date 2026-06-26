import { Router } from 'express';
import { CreateQuoteRequestSchema } from '@3dotpay/shared';

import { requireAuth } from '../../middleware/auth.js';
import { quoteRateLimit } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { postQuote } from './quote.controller.js';

export const quoteRouter: Router = Router();

// POST /quote (body: CreateQuoteRequest) -> QuoteResponse
quoteRouter.post(
  '/quote',
  requireAuth,
  quoteRateLimit,
  validate(CreateQuoteRequestSchema),
  postQuote,
);
