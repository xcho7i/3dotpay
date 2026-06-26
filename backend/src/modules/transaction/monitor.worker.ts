import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { advanceTransaction, NON_TERMINAL_STATUSES } from './monitor.service.js';
import { findTransactionsByStatuses } from './transaction.repository.js';

let timer: NodeJS.Timeout | undefined;
let running = false;

async function tick(): Promise<void> {
  if (running) return; // avoid overlapping runs
  running = true;
  try {
    const pending = await findTransactionsByStatuses(NON_TERMINAL_STATUSES);
    for (const tx of pending) {
      try {
        await advanceTransaction(tx);
      } catch (err) {
        logger.error({ err, id: String(tx._id) }, 'Failed to advance transaction');
      }
    }
  } catch (err) {
    logger.error({ err }, 'Chain monitor tick failed');
  } finally {
    running = false;
  }
}

/** Start the simple interval-based confirmation monitor (MVP). */
export function startChainMonitor(): void {
  if (!env.MONGODB_URI) {
    logger.warn('Chain monitor not started — no database configured.');
    return;
  }
  if (timer) return;
  timer = setInterval(() => void tick(), env.CHAIN_POLL_INTERVAL_MS);
  logger.info(`Chain monitor started (every ${env.CHAIN_POLL_INTERVAL_MS}ms)`);
}

export function stopChainMonitor(): void {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}
