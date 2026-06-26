import { env } from '../../config/env.js';
import { AppError } from '../../lib/errors.js';
import {
  type NotifyPaymentInput,
  type NotifyPaymentResult,
  type QuoteRequestInput,
  type QuoteResult,
  type SettlementPartner,
  type SettlementStatusInput,
  type SettlementStatusResult,
} from './settlement.types.js';

/**
 * Real KSHER settlement adapter — BOUNDARY ONLY. Same status as the AEON
 * adapter: typed methods + TODOs, no invented API fields. See
 * docs/settlement-partner-contract.md.
 */
export class KsherSettlementAdapter implements SettlementPartner {
  readonly name = 'ksher';

  constructor() {
    if (!env.KSHER_API_BASE_URL || !env.KSHER_API_KEY) {
      throw new AppError(
        500,
        'SETTLEMENT_NOT_CONFIGURED',
        'KSHER adapter requires KSHER_API_BASE_URL and KSHER_API_KEY',
      );
    }
  }

  private notImplemented(method: string): never {
    throw new AppError(
      501,
      'SETTLEMENT_NOT_IMPLEMENTED',
      `KSHER ${method} is not implemented yet — see docs/settlement-partner-contract.md`,
    );
  }

  async requestQuote(_input: QuoteRequestInput): Promise<QuoteResult> {
    return this.notImplemented('requestQuote');
  }

  async notifyPayment(_input: NotifyPaymentInput): Promise<NotifyPaymentResult> {
    return this.notImplemented('notifyPayment');
  }

  async getSettlementStatus(_input: SettlementStatusInput): Promise<SettlementStatusResult> {
    return this.notImplemented('getSettlementStatus');
  }
}
