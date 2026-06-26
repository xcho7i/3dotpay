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
 * Real AEON settlement adapter — BOUNDARY ONLY.
 *
 * Intentionally NOT implemented: we do not yet have AEON's API contract, so no
 * request/response fields are invented here. The integration questions are
 * tracked in docs/settlement-partner-contract.md. Methods throw a clear,
 * typed error until the real contract is wired.
 *
 * Fails fast at construction if credentials are missing.
 */
export class AeonSettlementAdapter implements SettlementPartner {
  readonly name = 'aeon';

  constructor() {
    if (!env.AEON_API_BASE_URL || !env.AEON_API_KEY) {
      throw new AppError(
        500,
        'SETTLEMENT_NOT_CONFIGURED',
        'AEON adapter requires AEON_API_BASE_URL and AEON_API_KEY',
      );
    }
  }

  private notImplemented(method: string): never {
    throw new AppError(
      501,
      'SETTLEMENT_NOT_IMPLEMENTED',
      `AEON ${method} is not implemented yet — see docs/settlement-partner-contract.md`,
    );
  }

  async requestQuote(_input: QuoteRequestInput): Promise<QuoteResult> {
    // TODO(AEON): POST {AEON_API_BASE_URL}/<quote endpoint> with Authorization
    //   from AEON_API_KEY. Map AEON's fx rate / asset amount / fee / settlement
    //   address into QuoteResult. Confirm field names + decimal handling first.
    return this.notImplemented('requestQuote');
  }

  async notifyPayment(_input: NotifyPaymentInput): Promise<NotifyPaymentResult> {
    // TODO(AEON): notify AEON of the on-chain txHash for a quote so they begin
    //   fiat settlement. Confirm the notify endpoint + idempotency semantics.
    return this.notImplemented('notifyPayment');
  }

  async getSettlementStatus(_input: SettlementStatusInput): Promise<SettlementStatusResult> {
    // TODO(AEON): poll AEON (or rely on webhook) for settlement status and map
    //   it to PENDING | SUCCESS | FAILED. Confirm status lifecycle + failure codes.
    return this.notImplemented('getSettlementStatus');
  }
}
