import { logger } from '../../lib/logger.js';
import { type TransactionRecord } from '../../models/transaction.model.js';
import { chainMonitor } from '../chain/chain-monitor.service.js';
import { getSettlementPartner } from '../settlement/index.js';
import { updateTransactionStatus } from './transaction.repository.js';

/** Statuses the monitor still needs to advance. */
export const NON_TERMINAL_STATUSES = ['SUBMITTED', 'CONFIRMED', 'SETTLEMENT_PENDING'];

/**
 * Advance a single transaction toward a terminal state:
 *   SUBMITTED -> (chain) CONFIRMED | FAILED
 *   CONFIRMED -> SETTLEMENT_PENDING
 *   SETTLEMENT_PENDING -> (settlement partner) SUCCESS | FAILED
 *
 * Idempotent and safe to call repeatedly (on-demand from the status endpoint and
 * from the background worker).
 */
export async function advanceTransaction(tx: TransactionRecord): Promise<TransactionRecord> {
  const id = String(tx._id);
  let current = tx;

  if (current.status === 'SUBMITTED') {
    const check = await chainMonitor.checkTransaction(current);
    if (check.state === 'pending') return current;
    if (check.state === 'failed') {
      logger.warn({ id, reason: check.reason }, 'Payment failed validation/chain check');
      return (await updateTransactionStatus(id, 'FAILED', { failureReason: check.reason })) ?? current;
    }
    current = (await updateTransactionStatus(id, 'CONFIRMED')) ?? current;
  }

  if (current.status === 'CONFIRMED') {
    current = (await updateTransactionStatus(id, 'SETTLEMENT_PENDING')) ?? current;
  }

  if (current.status === 'SETTLEMENT_PENDING') {
    const result = await getSettlementPartner().getSettlementStatus({
      quoteId: current.quoteId,
      txHash: current.txHash,
    });
    if (result.status === 'SUCCESS') {
      current = (await updateTransactionStatus(id, 'SUCCESS')) ?? current;
    } else if (result.status === 'FAILED') {
      current =
        (await updateTransactionStatus(id, 'FAILED', { failureReason: result.reason })) ?? current;
    }
    // PENDING: leave as SETTLEMENT_PENDING for the next tick.
  }

  return current;
}
