import { describe, expect, it } from 'vitest';

import { crc16ccitt, crc16Hex, decodeQR } from '@3dotpay/shared';

// --- helpers to build valid PromptPay payloads -----------------------------
const tlv = (id: string, value: string) => id + String(value.length).padStart(2, '0') + value;

const merchantInfo = (proxy = '0066812345678') =>
  tlv('00', 'A000000677010111') + tlv('01', proxy);

function buildPayload(opts: { amount?: string; currency?: string; name?: string } = {}): string {
  const { amount, currency = '764', name } = opts;
  let body =
    tlv('00', '01') + // payload format indicator
    tlv('01', '11') + // static
    tlv('29', merchantInfo()) +
    (name ? tlv('59', name) : '') +
    tlv('53', currency) +
    tlv('58', 'TH');
  if (amount) body += tlv('54', amount);
  const crcInput = `${body}6304`;
  return crcInput + crc16Hex(crcInput);
}

describe('CRC-16/CCITT-FALSE', () => {
  it('matches the standard check value for "123456789"', () => {
    expect(crc16ccitt('123456789')).toBe(0x29b1);
  });
});

describe('decodeQR — PromptPay', () => {
  it('decodes a static QR with no amount (requires manual amount)', () => {
    const result = decodeQR(buildPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.system).toBe('promptpay');
    expect(result.data.merchantId).toBe('0066812345678');
    expect(result.data.currency).toBe('THB');
    expect(result.data.amount).toBeUndefined();
    expect(result.requiresAmount).toBe(true);
    expect(result.data.rawPayload).toContain('A000000677010111');
  });

  it('decodes a QR with an amount (no manual input needed)', () => {
    const result = decodeQR(buildPayload({ amount: '100.00', name: 'TEST SHOP' }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.amount).toBe('100.00');
    expect(result.data.merchantName).toBe('TEST SHOP');
    expect(result.requiresAmount).toBe(false);
  });

  it('rejects a tampered CRC (BAD_CRC)', () => {
    const valid = buildPayload();
    const tampered = valid.slice(0, -1) + (valid.slice(-1) === '0' ? '1' : '0');
    const result = decodeQR(tampered);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('BAD_CRC');
  });

  it('rejects a non-PromptPay QR (UNSUPPORTED)', () => {
    const result = decodeQR('this is not a promptpay code');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('UNSUPPORTED');
  });

  it('rejects a non-THB currency (UNSUPPORTED)', () => {
    const result = decodeQR(buildPayload({ currency: '840' })); // USD
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('UNSUPPORTED');
  });

  it('rejects malformed TLV that still contains the AID (INVALID_FORMAT)', () => {
    const result = decodeQR('2999A00000067701'); // len 99 but value too short
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_FORMAT');
  });

  it('rejects an empty payload', () => {
    const result = decodeQR('   ');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_FORMAT');
  });
});
