import { type Hex, parseUnits } from 'viem';
import { USDC_DECIMALS } from '@3dotpay/shared';

import { env } from '../../config/env.js';
import { publicClient } from '../../lib/chain.js';
import { logger } from '../../lib/logger.js';

/** keccak256("Transfer(address,address,uint256)") */
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export type ChainCheckResult =
  | { state: 'pending' }
  | { state: 'confirmed' }
  | { state: 'failed'; reason: string };

/** The fields a ChainMonitor needs to validate a payment transaction. */
export interface MonitoredTx {
  txHash?: string;
  walletAddress: string;
  settlementAddress: string;
  /** Expected USDC amount as a decimal string (from the quote). */
  amountUsdc: string;
}

const eq = (a?: string, b?: string) => (a ?? '').toLowerCase() === (b ?? '').toLowerCase();

/**
 * Reads Base for a payment's on-chain state and validates it really is the USDC
 * transfer the quote expected. Validation prevents a wrong/spoofed txHash from
 * being accepted as a successful payment.
 */
export class ChainMonitorService {
  async checkTransaction(tx: MonitoredTx): Promise<ChainCheckResult> {
    if (!tx.txHash) return { state: 'pending' };

    let receipt;
    try {
      receipt = await publicClient.getTransactionReceipt({ hash: tx.txHash as Hex });
    } catch {
      // Not mined yet (TransactionReceiptNotFoundError) — keep waiting.
      return { state: 'pending' };
    }
    if (!receipt) return { state: 'pending' };

    if (receipt.status !== 'success') {
      return { state: 'failed', reason: 'Transaction reverted on-chain' };
    }

    const token = env.USDC_CONTRACT_ADDRESS;

    // to == USDC contract
    if (!eq(receipt.to ?? undefined, token)) {
      return { state: 'failed', reason: 'Transaction is not a call to the USDC contract' };
    }
    // sender == user wallet
    if (!eq(receipt.from, tx.walletAddress)) {
      return { state: 'failed', reason: 'Transaction sender does not match the user wallet' };
    }

    // A matching Transfer(token) log to settlementAddress for >= the quoted amount.
    let expected: bigint;
    try {
      expected = parseUnits(tx.amountUsdc, USDC_DECIMALS);
    } catch {
      return { state: 'failed', reason: 'Invalid expected amount' };
    }

    const match = receipt.logs.find((log) => {
      if (!eq(log.address, token)) return false;
      if (!eq(log.topics[0], TRANSFER_TOPIC)) return false;
      const recipient = `0x${(log.topics[2] ?? '').slice(-40)}`;
      if (!eq(recipient, tx.settlementAddress)) return false;
      try {
        return BigInt(log.data) >= expected;
      } catch {
        return false;
      }
    });

    if (!match) {
      return { state: 'failed', reason: 'No matching USDC transfer to the settlement address' };
    }

    logger.debug({ txHash: tx.txHash }, 'Payment transaction confirmed + validated');
    return { state: 'confirmed' };
  }
}

export const chainMonitor = new ChainMonitorService();
