import mongoose from 'mongoose';

import { QuoteModel, type QuoteRecord } from '../../models/quote.model.js';

export async function createQuote(data: Omit<QuoteRecord, '_id' | 'createdAt' | 'updatedAt'>): Promise<QuoteRecord> {
  const doc = await QuoteModel.create(data);
  return doc.toObject() as QuoteRecord;
}

export async function findQuoteById(id: string): Promise<QuoteRecord | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  return QuoteModel.findById(id).lean<QuoteRecord>().exec();
}

/**
 * Atomically transition an ACTIVE quote owned by `userId` to USED. Returns the
 * updated quote, or null if it was not ACTIVE (already used/expired) or not
 * owned by the user — preventing reuse under concurrency.
 */
export async function claimQuoteForPayment(
  id: string,
  userId: string,
): Promise<QuoteRecord | null> {
  return QuoteModel.findOneAndUpdate(
    { _id: id, userId, status: 'ACTIVE' },
    { $set: { status: 'USED' } },
    { new: true },
  )
    .lean<QuoteRecord>()
    .exec();
}

/** Best-effort: flip an ACTIVE quote to EXPIRED. */
export async function markQuoteExpired(id: string): Promise<void> {
  await QuoteModel.updateOne({ _id: id, status: 'ACTIVE' }, { $set: { status: 'EXPIRED' } }).exec();
}
