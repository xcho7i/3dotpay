import mongoose, { Schema } from 'mongoose';

/** Persisted quote. Amounts are decimal STRINGS to preserve precision. */
const quoteSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    merchantId: { type: String, required: true },
    merchantName: { type: String },
    merchantAmount: { type: String, required: true },
    fiatCurrency: { type: String, required: true },
    assetCurrency: { type: String, required: true },
    chain: { type: String, required: true },
    amountUsdc: { type: String, required: true },
    fxRate: { type: String, required: true },
    networkFeeEstimate: { type: String, required: true },
    settlementAddress: { type: String, required: true },
    rawQrPayload: { type: String },
    expiresAt: { type: Date, required: true },
    status: { type: String, required: true, default: 'ACTIVE' },
  },
  { timestamps: true },
);

export interface QuoteRecord {
  _id: mongoose.Types.ObjectId | string;
  userId: string;
  merchantId: string;
  merchantName?: string;
  merchantAmount: string;
  fiatCurrency: string;
  assetCurrency: string;
  chain: string;
  amountUsdc: string;
  fxRate: string;
  networkFeeEstimate: string;
  settlementAddress: string;
  rawQrPayload?: string;
  expiresAt: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const QuoteModel =
  (mongoose.models.Quote as mongoose.Model<QuoteRecord>) ??
  mongoose.model<QuoteRecord>('Quote', quoteSchema);
