import { Router } from 'express';
import { TransactionParamsSchema } from '@3dotpay/shared';

import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { getTransactionById, getTransactions } from './transaction.controller.js';

export const transactionRouter: Router = Router();

// GET /transactions -> TransactionsListResponse
transactionRouter.get('/transactions', requireAuth, getTransactions);

// GET /transactions/:id (params: TransactionParams) -> TransactionResponse
transactionRouter.get(
  '/transactions/:id',
  requireAuth,
  validate(TransactionParamsSchema, 'params'),
  getTransactionById,
);
