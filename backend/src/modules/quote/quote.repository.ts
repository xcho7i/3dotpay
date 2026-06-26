import { QuoteModel, type QuoteRecord } from '../../models/quote.model.js';

export async function createQuote(data: Omit<QuoteRecord, '_id' | 'createdAt' | 'updatedAt'>): Promise<QuoteRecord> {
  const doc = await QuoteModel.create(data);
  return doc.toObject() as QuoteRecord;
}

export async function findQuoteById(id: string): Promise<QuoteRecord | null> {
  return QuoteModel.findById(id).lean<QuoteRecord>().exec();
}
