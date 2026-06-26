import mongoose, { Schema } from 'mongoose';

/**
 * Payment record (metadata only — 3DotPay never holds funds). Amounts are
 * decimal STRINGS. `txHash` is the user's on-chain USDC transfer.
 */
const transactionSchema = new Schema(
  {
    userId: { type: String, required: true },
    quoteId: { type: String, required: true },
    merchantId: { type: String, required: true },
    amountFiat: { type: String, required: true },
    fiatCurrency: { type: String, required: true },
    amountUsdc: { type: String, required: true },
    assetCurrency: { type: String, required: true },
    chain: { type: String, required: true },
    walletAddress: { type: String, required: true },
    settlementAddress: { type: String, required: true },
    txHash: { type: String },
    status: { type: String, required: true, default: 'SUBMITTED' },
    settlementReference: { type: String },
    failureReason: { type: String },
  },
  { timestamps: true },
);

// Indexes: history queries (newest-first per user), single-use quote, and
// at-most-once txHash (sparse so multiple null/absent hashes are allowed).
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ quoteId: 1 }, { unique: true });
transactionSchema.index({ txHash: 1 }, { unique: true, sparse: true });
transactionSchema.index({ status: 1 });

export interface TransactionRecord {
  _id: mongoose.Types.ObjectId | string;
  userId: string;
  quoteId: string;
  merchantId: string;
  amountFiat: string;
  fiatCurrency: string;
  amountUsdc: string;
  assetCurrency: string;
  chain: string;
  walletAddress: string;
  settlementAddress: string;
  txHash?: string;
  status: string;
  settlementReference?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const TransactionModel =
  (mongoose.models.Transaction as mongoose.Model<TransactionRecord>) ??
  mongoose.model<TransactionRecord>('Transaction', transactionSchema);
