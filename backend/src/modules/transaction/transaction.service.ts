import {
  TransactionResponseSchema,
  TransactionsListResponseSchema,
  type TransactionResponse,
  type TransactionStatusResponse,
  type TransactionsListResponse,
} from '@3dotpay/shared';

import { NotFoundError } from '../../lib/errors.js';
import { type TransactionRecord } from '../../models/transaction.model.js';
import { advanceTransaction, NON_TERMINAL_STATUSES } from './monitor.service.js';
import {
  findTransactionByIdForUser,
  findTransactionsByUser,
} from './transaction.repository.js';

const toIso = (v: Date | string): string => (v instanceof Date ? v.toISOString() : String(v));

/** Map a stored record to the shared Transaction shape, validating the contract. */
function toTransaction(r: TransactionRecord): TransactionResponse {
  return TransactionResponseSchema.parse({
    id: String(r._id),
    userId: r.userId,
    quoteId: r.quoteId,
    merchantId: r.merchantId,
    amountFiat: r.amountFiat,
    fiatCurrency: r.fiatCurrency,
    amountUsdc: r.amountUsdc,
    assetCurrency: r.assetCurrency,
    chain: r.chain,
    walletAddress: r.walletAddress,
    settlementAddress: r.settlementAddress,
    txHash: r.txHash ?? undefined,
    status: r.status,
    failureReason: r.failureReason ?? undefined,
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
  });
}

/** List the authenticated user's transactions (newest first, cursor-paginated). */
export async function listTransactions(
  userId: string,
  opts: { limit?: number; cursor?: string } = {},
): Promise<TransactionsListResponse> {
  const { items, nextCursor } = await findTransactionsByUser(userId, {
    limit: opts.limit ?? 20,
    cursor: opts.cursor,
  });
  return TransactionsListResponseSchema.parse({
    transactions: items.map(toTransaction),
    nextCursor,
  });
}

/** Get one transaction owned by the authenticated user, or 404. */
export async function getTransaction(userId: string, id: string): Promise<TransactionResponse> {
  const record = await findTransactionByIdForUser(id, userId);
  if (!record) throw new NotFoundError('Transaction not found');
  return toTransaction(record);
}

/**
 * Get the live status, advancing it on-demand (chain + settlement) when still
 * non-terminal so the mobile poller drives progress even without the worker.
 */
export async function getTransactionStatus(
  userId: string,
  id: string,
): Promise<TransactionStatusResponse> {
  const record = await findTransactionByIdForUser(id, userId);
  if (!record) throw new NotFoundError('Transaction not found');

  const fresh = NON_TERMINAL_STATUSES.includes(record.status)
    ? await advanceTransaction(record)
    : record;

  return {
    id: String(fresh._id),
    status: fresh.status as TransactionStatusResponse['status'],
    txHash: fresh.txHash ?? undefined,
    failureReason: fresh.failureReason ?? undefined,
  };
}
