import { Router } from 'express';
import { TransactionParamsSchema, TransactionsQuerySchema } from '@3dotpay/shared';

import { requireAuth } from '../../middleware/auth.js';
import { statusRateLimit } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import {
  getTransactionById,
  getTransactionStatusController,
  getTransactions,
} from './transaction.controller.js';

export const transactionRouter: Router = Router();

// GET /transactions?limit=&cursor= -> TransactionsListResponse
transactionRouter.get(
  '/transactions',
  requireAuth,
  validate(TransactionsQuerySchema, 'query'),
  getTransactions,
);

// GET /transactions/:id/status -> TransactionStatusResponse (polled by mobile)
transactionRouter.get(
  '/transactions/:id/status',
  requireAuth,
  statusRateLimit,
  validate(TransactionParamsSchema, 'params'),
  getTransactionStatusController,
);

// GET /transactions/:id -> TransactionResponse
transactionRouter.get(
  '/transactions/:id',
  requireAuth,
  validate(TransactionParamsSchema, 'params'),
  getTransactionById,
);
