import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/chain/chain-monitor.service.js', () => ({
  chainMonitor: { checkTransaction: vi.fn() },
}));
vi.mock('../src/modules/transaction/transaction.repository.js', () => ({
  updateTransactionStatus: vi.fn(),
}));
const getSettlementStatus = vi.fn();
vi.mock('../src/modules/settlement/index.js', () => ({
  getSettlementPartner: () => ({ getSettlementStatus }),
}));

import { chainMonitor } from '../src/modules/chain/chain-monitor.service.js';
import { advanceTransaction } from '../src/modules/transaction/monitor.service.js';
import { updateTransactionStatus } from '../src/modules/transaction/transaction.repository.js';

const checkTransaction = vi.mocked(chainMonitor.checkTransaction);
const updateStatus = vi.mocked(updateTransactionStatus);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const baseTx: any = {
  _id: 'tx-1',
  userId: 'u1',
  quoteId: 'q1',
  txHash: `0x${'a'.repeat(64)}`,
  walletAddress: `0x${'1'.repeat(40)}`,
  settlementAddress: `0x${'2'.repeat(40)}`,
  amountUsdc: '2.000000',
  status: 'SUBMITTED',
};

beforeEach(() => {
  vi.clearAllMocks();
  // Reflect the new status back so the chain can continue advancing.
  updateStatus.mockImplementation(async (_id, status, extra) => ({ ...baseTx, status, ...extra }));
});

describe('advanceTransaction', () => {
  it('keeps a pending tx as SUBMITTED (no writes)', async () => {
    checkTransaction.mockResolvedValueOnce({ state: 'pending' });
    const out = await advanceTransaction(baseTx);
    expect(out.status).toBe('SUBMITTED');
    expect(updateStatus).not.toHaveBeenCalled();
  });

  it('marks FAILED when the chain check fails (wrong txHash)', async () => {
    checkTransaction.mockResolvedValueOnce({ state: 'failed', reason: 'No matching USDC transfer' });
    const out = await advanceTransaction(baseTx);
    expect(out.status).toBe('FAILED');
    expect(updateStatus).toHaveBeenCalledWith('tx-1', 'FAILED', { failureReason: 'No matching USDC transfer' });
  });

  it('confirms then settles to SUCCESS', async () => {
    checkTransaction.mockResolvedValueOnce({ state: 'confirmed' });
    getSettlementStatus.mockResolvedValueOnce({ status: 'SUCCESS' });
    const out = await advanceTransaction(baseTx);
    expect(out.status).toBe('SUCCESS');
    // CONFIRMED -> SETTLEMENT_PENDING -> SUCCESS
    expect(updateStatus).toHaveBeenCalledWith('tx-1', 'CONFIRMED');
    expect(updateStatus).toHaveBeenCalledWith('tx-1', 'SETTLEMENT_PENDING');
    expect(updateStatus).toHaveBeenCalledWith('tx-1', 'SUCCESS');
  });

  it('stays SETTLEMENT_PENDING when settlement is still pending', async () => {
    checkTransaction.mockResolvedValueOnce({ state: 'confirmed' });
    getSettlementStatus.mockResolvedValueOnce({ status: 'PENDING' });
    const out = await advanceTransaction(baseTx);
    expect(out.status).toBe('SETTLEMENT_PENDING');
  });

  it('marks FAILED when settlement fails', async () => {
    checkTransaction.mockResolvedValueOnce({ state: 'confirmed' });
    getSettlementStatus.mockResolvedValueOnce({ status: 'FAILED', reason: 'rejected' });
    const out = await advanceTransaction(baseTx);
    expect(out.status).toBe('FAILED');
  });
});
