import { type AssetCurrency, type Chain, type FiatCurrency } from '@3dotpay/shared';

/** Input for a fiat→asset quote request. */
export interface QuoteRequestInput {
  merchantId: string;
  /** Fiat amount as a decimal string (e.g. "100.00"). */
  merchantAmount: string;
  fiatCurrency: FiatCurrency;
  assetCurrency: AssetCurrency;
  chain: Chain;
}

/** Quote figures returned by the settlement partner. All amounts decimal strings. */
export interface QuoteResult {
  /** Fiat per 1 unit of asset (e.g. THB per USDC). */
  fxRate: string;
  /** Asset amount the user must send. */
  amountAsset: string;
  /** Estimated on-chain network fee, in the asset. */
  networkFeeEstimate: string;
  /** Address the user sends the asset to (funds never touch 3DotPay). */
  settlementAddress: `0x${string}`;
}

export interface NotifyPaymentInput {
  quoteId: string;
  txHash: string;
}

export interface NotifyPaymentResult {
  accepted: boolean;
  reference?: string;
}

export interface SettlementStatusInput {
  quoteId: string;
  txHash?: string;
}

export type SettlementStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface SettlementStatusResult {
  status: SettlementStatus;
  reason?: string;
}

/**
 * Settlement partner abstraction (AEON/KSHER/local PSP). 3DotPay only requests
 * quotes, notifies the partner of a payment, and polls settlement status — it
 * never holds funds.
 */
export interface SettlementPartner {
  readonly name: string;
  requestQuote(input: QuoteRequestInput): Promise<QuoteResult>;
  notifyPayment(input: NotifyPaymentInput): Promise<NotifyPaymentResult>;
  getSettlementStatus(input: SettlementStatusInput): Promise<SettlementStatusResult>;
}
