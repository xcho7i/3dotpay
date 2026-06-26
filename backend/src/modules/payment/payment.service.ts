import { type CreatePaymentRequest, type PaymentResponse } from '@3dotpay/shared';

import { NotImplementedError } from '../../lib/errors.js';

/**
 * Record a broadcast USDC payment against a quote and notify the settlement
 * adapter. TODO: validate the quote, persist the transaction (metadata only),
 * notify settlement with quoteId + txHash, and start chain monitoring.
 */
export async function recordPayment(
  _userId: string,
  _input: CreatePaymentRequest,
): Promise<PaymentResponse> {
  throw new NotImplementedError('POST /payment');
}
