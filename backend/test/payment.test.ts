import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentResponseSchema } from '@3dotpay/shared';

// Mock all data + settlement deps so no Mongo/network is needed.
vi.mock('../src/modules/quote/quote.repository.js', () => ({
  findQuoteById: vi.fn(),
  claimQuoteForPayment: vi.fn(),
  markQuoteExpired: vi.fn(),
}));
vi.mock('../src/modules/transaction/transaction.repository.js', () => ({
  createTransaction: vi.fn(),
}));
vi.mock('../src/modules/user/user.repository.js', () => ({
  findByPrivyUserId: vi.fn(),
}));
const notifyPayment = vi.fn().mockResolvedValue({ accepted: true });
vi.mock('../src/modules/settlement/index.js', () => ({
  getSettlementPartner: () => ({ notifyPayment }),
}));

import { createApp } from '../src/app.js';
import { DEV_AUTH_HEADER } from '../src/middleware/auth.js';
import * as quoteRepo from '../src/modules/quote/quote.repository.js';
import * as txRepo from '../src/modules/transaction/transaction.repository.js';

const app = createApp();
const findQuoteById = vi.mocked(quoteRepo.findQuoteById);
const claimQuoteForPayment = vi.mocked(quoteRepo.claimQuoteForPayment);
const markQuoteExpired = vi.mocked(quoteRepo.markQuoteExpired);
const createTransaction = vi.mocked(txRepo.createTransaction);

const USER = 'dev-user-1'; // matches the dev auth header below
const WALLET = `0x${'1'.repeat(40)}`;
const SETTLE = `0x${'2'.repeat(40)}`;
const TXHASH = `0x${'a'.repeat(64)}`;

const activeQuote = (over: Record<string, unknown> = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  userId: USER,
  merchantId: 'M-1',
  merchantName: 'Shop',
  merchantAmount: '100.00',
  fiatCurrency: 'THB',
  assetCurrency: 'USDC',
  chain: 'base',
  amountUsdc: '2.739726',
  fxRate: '36.50',
  networkFeeEstimate: '0.010000',
  settlementAddress: SETTLE,
  expiresAt: new Date(Date.now() + 60_000),
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

const pay = (body: Record<string, unknown>) =>
  request(app).post('/api/v1/payment').set(DEV_AUTH_HEADER, USER).send(body);

beforeEach(() => vi.clearAllMocks());

describe('POST /api/v1/payment', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/payment').send({ quoteId: 'q', txHash: TXHASH });
    expect(res.status).toBe(401);
  });

  it('creates the transaction, marks the quote USED, and notifies settlement', async () => {
    findQuoteById.mockResolvedValueOnce(activeQuote());
    claimQuoteForPayment.mockResolvedValueOnce(activeQuote({ status: 'USED' }));
    createTransaction.mockResolvedValueOnce({
      _id: 'tx-1',
      userId: USER,
      quoteId: '507f1f77bcf86cd799439011',
      merchantId: 'M-1',
      amountFiat: '100.00',
      fiatCurrency: 'THB',
      amountUsdc: '2.739726',
      assetCurrency: 'USDC',
      chain: 'base',
      walletAddress: WALLET,
      settlementAddress: SETTLE,
      txHash: TXHASH,
      status: 'SUBMITTED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await pay({ quoteId: '507f1f77bcf86cd799439011', txHash: TXHASH, walletAddress: WALLET });

    expect(res.status).toBe(201);
    expect(PaymentResponseSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.status).toBe('SUBMITTED');
    expect(res.body.transactionId).toBe('tx-1');
    expect(claimQuoteForPayment).toHaveBeenCalledWith('507f1f77bcf86cd799439011', USER);
    expect(notifyPayment).toHaveBeenCalledWith({ quoteId: '507f1f77bcf86cd799439011', txHash: TXHASH });
  });

  it('returns 404 when the quote does not exist', async () => {
    findQuoteById.mockResolvedValueOnce(null);
    const res = await pay({ quoteId: '507f1f77bcf86cd799439011', txHash: TXHASH, walletAddress: WALLET });
    expect(res.status).toBe(404);
    expect(claimQuoteForPayment).not.toHaveBeenCalled();
  });

  it('returns 403 when the user does not own the quote', async () => {
    findQuoteById.mockResolvedValueOnce(activeQuote({ userId: 'someone-else' }));
    const res = await pay({ quoteId: '507f1f77bcf86cd799439011', txHash: TXHASH, walletAddress: WALLET });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(claimQuoteForPayment).not.toHaveBeenCalled();
  });

  it('rejects an expired quote (409 QUOTE_EXPIRED) and cannot be paid', async () => {
    findQuoteById.mockResolvedValueOnce(activeQuote({ expiresAt: new Date(Date.now() - 1000) }));
    const res = await pay({ quoteId: '507f1f77bcf86cd799439011', txHash: TXHASH, walletAddress: WALLET });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('QUOTE_EXPIRED');
    expect(markQuoteExpired).toHaveBeenCalled();
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('rejects a quote that is not ACTIVE (already used) — no reuse', async () => {
    findQuoteById.mockResolvedValueOnce(activeQuote({ status: 'USED' }));
    const res = await pay({ quoteId: '507f1f77bcf86cd799439011', txHash: TXHASH, walletAddress: WALLET });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('QUOTE_NOT_ACTIVE');
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('rejects when the quote is claimed concurrently (atomic claim returns null)', async () => {
    findQuoteById.mockResolvedValueOnce(activeQuote());
    claimQuoteForPayment.mockResolvedValueOnce(null); // lost the race
    const res = await pay({ quoteId: '507f1f77bcf86cd799439011', txHash: TXHASH, walletAddress: WALLET });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('QUOTE_NOT_ACTIVE');
    expect(createTransaction).not.toHaveBeenCalled();
  });
});
