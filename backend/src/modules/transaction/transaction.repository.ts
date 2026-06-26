import mongoose from 'mongoose';

import { TransactionModel, type TransactionRecord } from '../../models/transaction.model.js';

export async function createTransaction(
  data: Omit<TransactionRecord, '_id' | 'createdAt' | 'updatedAt'>,
): Promise<TransactionRecord> {
  const doc = await TransactionModel.create(data);
  return doc.toObject() as TransactionRecord;
}

/**
 * Cursor-paginated list (newest first). `cursor` is the last seen transaction id;
 * returns up to `limit` items plus whether more exist.
 */
export async function findTransactionsByUser(
  userId: string,
  opts: { limit: number; cursor?: string } = { limit: 20 },
): Promise<{ items: TransactionRecord[]; nextCursor?: string }> {
  const filter: Record<string, unknown> = { userId };
  if (opts.cursor && mongoose.isValidObjectId(opts.cursor)) {
    // Older than the cursor (ObjectIds are monotonic by creation time).
    filter._id = { $lt: new mongoose.Types.ObjectId(opts.cursor) };
  }
  const items = await TransactionModel.find(filter)
    .sort({ _id: -1 })
    .limit(opts.limit + 1)
    .lean<TransactionRecord[]>()
    .exec();

  const hasMore = items.length > opts.limit;
  const page = hasMore ? items.slice(0, opts.limit) : items;
  const last = page[page.length - 1];
  return { items: page, nextCursor: hasMore && last ? String(last._id) : undefined };
}

export async function findTransactionByIdForUser(
  id: string,
  userId: string,
): Promise<TransactionRecord | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  return TransactionModel.findOne({ _id: id, userId }).lean<TransactionRecord>().exec();
}

/** Find transactions in any of the given (non-terminal) statuses, for the poller. */
export async function findTransactionsByStatuses(
  statuses: string[],
): Promise<TransactionRecord[]> {
  return TransactionModel.find({ status: { $in: statuses } })
    .lean<TransactionRecord[]>()
    .exec();
}

export async function updateTransactionStatus(
  id: string,
  status: string,
  extra: { failureReason?: string; settlementReference?: string } = {},
): Promise<TransactionRecord | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  return TransactionModel.findByIdAndUpdate(id, { $set: { status, ...extra } }, { new: true })
    .lean<TransactionRecord>()
    .exec();
}
