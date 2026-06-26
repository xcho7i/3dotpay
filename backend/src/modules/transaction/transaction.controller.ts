import { type RequestHandler } from 'express';

import { getTransaction, listTransactions } from './transaction.service.js';

export const getTransactions: RequestHandler = async (req, res) => {
  const result = await listTransactions(req.auth!.userId);
  res.json(result);
};

export const getTransactionById: RequestHandler = async (req, res) => {
  // `:id` is a required route param (also validated by TransactionParamsSchema).
  const id = req.params.id as string;
  const result = await getTransaction(req.auth!.userId, id);
  res.json(result);
};
