import { type RequestHandler } from 'express';

import { getTransaction, getTransactionStatus, listTransactions } from './transaction.service.js';

export const getTransactions: RequestHandler = async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
  const result = await listTransactions(req.auth!.userId, { limit, cursor });
  res.json(result);
};

export const getTransactionById: RequestHandler = async (req, res) => {
  const id = req.params.id as string;
  const result = await getTransaction(req.auth!.userId, id);
  res.json(result);
};

export const getTransactionStatusController: RequestHandler = async (req, res) => {
  const id = req.params.id as string;
  const result = await getTransactionStatus(req.auth!.userId, id);
  res.json(result);
};
