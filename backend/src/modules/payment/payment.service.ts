import { type CreatePaymentRequest } from '@3dotpay/shared';

import { AppError, ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors.js';
import * as quoteRepo from '../quote/quote.repository.js';
import { getSettlementPartner } from '../settlement/index.js';
import { createTransaction } from '../transaction/transaction.repository.js';
import { findByPrivyUserId } from '../user/user.repository.js';

export interface PaymentResult {
  transactionId: string;
  status: 'SUBMITTED';
}

/**
 * Record a broadcast USDC payment against a quote. 3DotPay never signs or holds
 * funds — the mobile wallet already sent USDC directly to the settlement
 * address; we only receive quoteId + txHash.
 *
 * Validates ownership, expiry, and single-use (atomic claim), persists a
 * transaction, and notifies the settlement partner.
 */
export async function recordPayment(
  userId: string,
  input: CreatePaymentRequest,
): Promise<PaymentResult> {
  const quote = await quoteRepo.findQuoteById(input.quoteId);
  if (!quote) throw new NotFoundError('Quote not found');
  if (quote.userId !== userId) throw new ForbiddenError('You do not own this quote');
  if (quote.status !== 'ACTIVE') {
    throw new ConflictError('QUOTE_NOT_ACTIVE', `Quote is ${quote.status.toLowerCase()}`);
  }
  if (Date.now() > quote.expiresAt.getTime()) {
    await quoteRepo.markQuoteExpired(input.quoteId);
    throw new ConflictError('QUOTE_EXPIRED', 'Quote has expired; request a new one');
  }

  // Atomically claim the quote (ACTIVE -> USED). If null, it was already taken.
  const claimed = await quoteRepo.claimQuoteForPayment(input.quoteId, userId);
  if (!claimed) throw new ConflictError('QUOTE_NOT_ACTIVE', 'Quote has already been used');

  // Sender wallet: prefer the request, else the user's synced wallet.
  const walletAddress = input.walletAddress ?? (await findByPrivyUserId(userId))?.walletAddress;
  if (!walletAddress) {
    throw new AppError(400, 'NO_WALLET', 'No wallet address available for this payment');
  }

  let tx;
  try {
    tx = await createTransaction({
      userId,
      quoteId: input.quoteId,
      merchantId: claimed.merchantId,
      amountFiat: claimed.merchantAmount,
      fiatCurrency: claimed.fiatCurrency,
      amountUsdc: claimed.amountUsdc,
      assetCurrency: claimed.assetCurrency,
      chain: claimed.chain,
      walletAddress,
      settlementAddress: claimed.settlementAddress,
      txHash: input.txHash,
      status: 'SUBMITTED',
    });
  } catch (err) {
    // Unique index on txHash/quoteId (E11000) → this tx was already recorded.
    if (err && typeof err === 'object' && (err as { code?: number }).code === 11000) {
      throw new ConflictError('TX_ALREADY_RECORDED', 'This transaction has already been recorded');
    }
    throw err;
  }

  // Notify the settlement partner (mock AEON for MVP). Non-fatal if it throws?
  // For MVP we surface adapter errors; the quote is already claimed + tx stored.
  await getSettlementPartner().notifyPayment({ quoteId: input.quoteId, txHash: input.txHash });

  return { transactionId: String(tx._id), status: 'SUBMITTED' };
}
