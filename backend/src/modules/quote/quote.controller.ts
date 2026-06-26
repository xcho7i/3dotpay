import { type RequestHandler } from 'express';
import { type CreateQuoteRequest } from '@3dotpay/shared';

import { createQuote } from './quote.service.js';

export const postQuote: RequestHandler = async (req, res) => {
  // Body validated by validate(CreateQuoteRequestSchema).
  const quote = await createQuote(req.auth!.userId, req.body as CreateQuoteRequest);
  res.status(201).json(quote);
};
