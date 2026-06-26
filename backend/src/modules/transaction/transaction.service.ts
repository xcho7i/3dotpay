import {
  type TransactionResponse,
  type TransactionsListResponse,
} from '@3dotpay/shared';

import { NotImplementedError } from '../../lib/errors.js';

/** List the authenticated user's transactions. TODO: query MongoDB. */
export async function listTransactions(_userId: string): Promise<TransactionsListResponse> {
  throw new NotImplementedError('GET /transactions');
}

/** Get one transaction owned by the authenticated user. TODO: query MongoDB. */
export async function getTransaction(
  _userId: string,
  _id: string,
): Promise<TransactionResponse> {
  throw new NotImplementedError('GET /transactions/:id');
}
