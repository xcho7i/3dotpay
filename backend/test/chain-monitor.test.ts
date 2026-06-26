import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/chain.js', () => ({
  publicClient: { getTransactionReceipt: vi.fn() },
}));

import { publicClient } from '../src/lib/chain.js';
import { chainMonitor } from '../src/modules/chain/chain-monitor.service.js';

const getReceipt = vi.mocked(publicClient.getTransactionReceipt);

const TOKEN = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // env default USDC
const WALLET = `0x${'1'.repeat(40)}`;
const SETTLE = `0x${'2'.repeat(40)}`;
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const topicAddr = (a: string) => `0x${'0'.repeat(24)}${a.slice(2)}`;
const transferLog = (to: string, value: bigint, token = TOKEN) => ({
  address: token,
  topics: [TRANSFER, topicAddr(WALLET), topicAddr(to)],
  data: `0x${value.toString(16)}`,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const receipt = (over: Record<string, any> = {}): any => ({
  status: 'success',
  from: WALLET,
  to: TOKEN,
  logs: [transferLog(SETTLE, 2_000_000n)],
  ...over,
});

const tx = { txHash: `0x${'a'.repeat(64)}`, walletAddress: WALLET, settlementAddress: SETTLE, amountUsdc: '2.000000' };

beforeEach(() => vi.clearAllMocks());

describe('ChainMonitorService.checkTransaction', () => {
  it('pending when there is no txHash', async () => {
    expect(await chainMonitor.checkTransaction({ ...tx, txHash: undefined })).toEqual({ state: 'pending' });
  });

  it('pending when the receipt is not found (not mined yet)', async () => {
    getReceipt.mockRejectedValueOnce(new Error('not found'));
    expect(await chainMonitor.checkTransaction(tx)).toEqual({ state: 'pending' });
  });

  it('failed when the tx reverted', async () => {
    getReceipt.mockResolvedValueOnce(receipt({ status: 'reverted' }));
    expect((await chainMonitor.checkTransaction(tx)).state).toBe('failed');
  });

  it('confirmed when a valid USDC transfer to settlement is present', async () => {
    getReceipt.mockResolvedValueOnce(receipt());
    expect(await chainMonitor.checkTransaction(tx)).toEqual({ state: 'confirmed' });
  });

  it('confirmed when the user overpays (>= expected)', async () => {
    getReceipt.mockResolvedValueOnce(receipt({ logs: [transferLog(SETTLE, 3_000_000n)] }));
    expect((await chainMonitor.checkTransaction(tx)).state).toBe('confirmed');
  });

  it('failed when the call target is not the USDC contract', async () => {
    getReceipt.mockResolvedValueOnce(receipt({ to: `0x${'9'.repeat(40)}` }));
    expect((await chainMonitor.checkTransaction(tx)).state).toBe('failed');
  });

  it('failed when the sender is not the user wallet', async () => {
    getReceipt.mockResolvedValueOnce(receipt({ from: `0x${'8'.repeat(40)}` }));
    expect((await chainMonitor.checkTransaction(tx)).state).toBe('failed');
  });

  it('failed when the recipient is not the settlement address', async () => {
    getReceipt.mockResolvedValueOnce(receipt({ logs: [transferLog(`0x${'3'.repeat(40)}`, 2_000_000n)] }));
    expect((await chainMonitor.checkTransaction(tx)).state).toBe('failed');
  });

  it('failed when the transferred amount is less than the quote', async () => {
    getReceipt.mockResolvedValueOnce(receipt({ logs: [transferLog(SETTLE, 1_000_000n)] }));
    expect((await chainMonitor.checkTransaction(tx)).state).toBe('failed');
  });
});
