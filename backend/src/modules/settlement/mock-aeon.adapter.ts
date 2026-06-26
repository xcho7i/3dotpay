import Decimal from 'decimal.js';
import { USDC_DECIMALS } from '@3dotpay/shared';

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

/** Mock FX rate: THB per 1 USDC. TODO: replace with live AEON quote. */
const MOCK_THB_PER_USDC = '36.50';
/** Mock flat network fee estimate, in USDC. */
const MOCK_NETWORK_FEE_USDC = '0.01';
/** Fallback settlement address when SETTLEMENT_WALLET_ADDRESS is unset (dev only). */
const MOCK_SETTLEMENT_ADDRESS = '0x000000000000000000000000000000000000dEaD';

/**
 * Local/dev settlement adapter standing in for AEON. All money math is
 * Decimal-safe (decimal.js) — never floating point.
 */
export class MockAeonSettlementAdapter implements SettlementPartner {
  readonly name = 'mock-aeon';

  async requestQuote(input: QuoteRequestInput): Promise<QuoteResult> {
    if (input.fiatCurrency !== 'THB') {
      throw new AppError(400, 'UNSUPPORTED_CURRENCY', 'Only THB is supported');
    }
    if (input.assetCurrency !== 'USDC' || input.chain !== 'base') {
      throw new AppError(400, 'UNSUPPORTED_ASSET', 'Only USDC on Base is supported');
    }

    const thb = new Decimal(input.merchantAmount);
    const fxRate = new Decimal(MOCK_THB_PER_USDC);

    // amountUSDC = THB / (THB per USDC). Round UP so the user always sends enough.
    const amountAsset = thb.dividedBy(fxRate).toDecimalPlaces(USDC_DECIMALS, Decimal.ROUND_UP);

    const settlementAddress = (env.SETTLEMENT_WALLET_ADDRESS ?? MOCK_SETTLEMENT_ADDRESS) as `0x${string}`;

    return {
      fxRate: fxRate.toFixed(2),
      amountAsset: amountAsset.toFixed(USDC_DECIMALS),
      networkFeeEstimate: new Decimal(MOCK_NETWORK_FEE_USDC).toFixed(USDC_DECIMALS),
      settlementAddress,
    };
  }

  async notifyPayment(input: NotifyPaymentInput): Promise<NotifyPaymentResult> {
    // TODO: POST to AEON with quoteId + txHash.
    return { accepted: true, reference: `mock-${input.quoteId}` };
  }

  async getSettlementStatus(_input: SettlementStatusInput): Promise<SettlementStatusResult> {
    // TODO: poll AEON. Mock optimistically succeeds.
    return { status: 'SUCCESS' };
  }
}
