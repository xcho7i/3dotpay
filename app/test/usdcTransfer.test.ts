import { describe, expect, it } from 'vitest';

import { buildUsdcTransfer, encodeErc20Transfer, toBaseUnits } from '../src/features/payment/usdcTransfer';

describe('toBaseUnits (decimal-safe, no float)', () => {
  it.each([
    ['1', 6, 1_000_000n],
    ['1.5', 6, 1_500_000n],
    ['0.000001', 6, 1n],
    ['167.30148', 6, 167_301_480n],
    ['100.00', 6, 100_000_000n],
    ['0', 6, 0n],
  ])('converts %s (%i dp) -> %s', (amount, decimals, expected) => {
    expect(toBaseUnits(amount as string, decimals as number)).toBe(expected);
  });

  it('rejects more fractional digits than decimals', () => {
    expect(() => toBaseUnits('1.1234567', 6)).toThrow(/decimal places/);
  });

  it('rejects malformed input', () => {
    expect(() => toBaseUnits('abc', 6)).toThrow();
    expect(() => toBaseUnits('1.2.3', 6)).toThrow();
    expect(() => toBaseUnits('-1', 6)).toThrow();
  });
});

describe('encodeErc20Transfer', () => {
  it('encodes selector + padded address + padded amount', () => {
    const to = `0x${'1'.repeat(40)}`;
    const data = encodeErc20Transfer(to, 1n);
    expect(data).toBe(
      '0xa9059cbb' +
        '0'.repeat(24) + '1'.repeat(40) + // 32-byte address (12 zero bytes + 20-byte addr)
        '0'.repeat(63) + '1', // 32-byte amount = 1
    );
    expect(data.length).toBe(2 + 8 + 64 + 64); // 0x + selector + 2x 32-byte words
  });

  it('rejects an invalid recipient address', () => {
    expect(() => encodeErc20Transfer('0xnope', 1n)).toThrow(/Invalid EVM address/);
  });
});

describe('buildUsdcTransfer', () => {
  const base = {
    from: `0x${'a'.repeat(40)}`,
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    to: `0x${'2'.repeat(40)}`,
    decimals: 6,
    chainId: 8453,
  };

  it('builds an eth_sendTransaction to the token contract with 0 value', () => {
    const tx = buildUsdcTransfer({ ...base, amountUsdc: '2.50' });
    expect(tx.to).toBe(base.tokenAddress); // recipient is in calldata, not `to`
    expect(tx.from).toBe(base.from);
    expect(tx.value).toBe('0x0');
    expect(tx.chainId).toBe(8453);
    expect(tx.data.startsWith('0xa9059cbb')).toBe(true);
    // 2.50 USDC -> 2_500_000 base units -> 0x2625a0
    expect(tx.data.endsWith((2_500_000).toString(16))).toBe(true);
  });

  it('rejects a zero amount', () => {
    expect(() => buildUsdcTransfer({ ...base, amountUsdc: '0' })).toThrow(/greater than 0/);
  });
});
