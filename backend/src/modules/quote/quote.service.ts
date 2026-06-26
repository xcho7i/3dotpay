import {
  QuoteResponseSchema,
  type CreateQuoteRequest,
  type QuoteResponse,
} from '@3dotpay/shared';

import { getSettlementPartner } from '../settlement/index.js';
import { computeExpiresAt, expirySeconds } from './quote.expiry.js';
import * as repo from './quote.repository.js';

/**
 * Create a quote for the authenticated user: ask the settlement partner for
 * conversion figures, persist the quote (60s TTL), and return the API
 * projection. MVP enforces THB + USDC-on-Base via the adapter.
 */
export async function createQuote(
  userId: string,
  input: CreateQuoteRequest,
): Promise<QuoteResponse> {
  const settlement = getSettlementPartner();

  const quote = await settlement.requestQuote({
    merchantId: input.merchantId,
    merchantAmount: input.merchantAmount,
    fiatCurrency: 'THB',
    assetCurrency: 'USDC',
    chain: 'base',
  });

  const now = new Date();
  const expiresAt = computeExpiresAt(now);

  const record = await repo.createQuote({
    userId,
    merchantId: input.merchantId,
    merchantName: input.merchantName,
    merchantAmount: input.merchantAmount,
    fiatCurrency: 'THB',
    assetCurrency: 'USDC',
    chain: 'base',
    amountUsdc: quote.amountAsset,
    fxRate: quote.fxRate,
    networkFeeEstimate: quote.networkFeeEstimate,
    settlementAddress: quote.settlementAddress,
    rawQrPayload: input.rawQrPayload,
    expiresAt,
    status: 'ACTIVE',
  });

  return QuoteResponseSchema.parse({
    quoteId: String(record._id),
    amountTHB: record.merchantAmount,
    fxRate: record.fxRate,
    amountUSDC: record.amountUsdc,
    networkFeeEstimate: record.networkFeeEstimate,
    settlementAddress: record.settlementAddress,
    expiresAt: record.expiresAt.toISOString(),
    expirySeconds: expirySeconds(record.expiresAt, now),
    status: record.status,
  });
}
