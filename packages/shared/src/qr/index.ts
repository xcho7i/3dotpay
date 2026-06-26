import { type PromptPayQRParseResult } from '../domain/promptpay.js';
import { type QRDecoderAdapter } from './adapter.js';
import { QrDecodeError, type QrDecodeErrorCode } from './errors.js';
import { promptPayAdapter } from './promptpay.js';

export * from './adapter.js';
export * from './crc.js';
export * from './errors.js';
export * from './tlv.js';
export { promptPayAdapter } from './promptpay.js';

/** Discriminated result of a decode attempt. */
export type QrDecodeResult =
  | { ok: true; system: 'promptpay'; data: PromptPayQRParseResult; requiresAmount: boolean }
  | { ok: false; code: QrDecodeErrorCode; message: string };

/** Registered adapters, tried in order. MVP: PromptPay only. */
const adapters: QRDecoderAdapter[] = [promptPayAdapter];

/**
 * Decode a raw QR payload. Pure function: returns a result object (never throws)
 * so callers can branch on `ok`/`code` and show clear errors.
 */
export function decodeQR(payload: string): QrDecodeResult {
  const trimmed = (payload ?? '').trim();
  if (!trimmed) {
    return { ok: false, code: 'INVALID_FORMAT', message: 'Empty QR payload' };
  }

  const adapter = adapters.find((a) => a.canDecode(trimmed));
  if (!adapter) {
    return { ok: false, code: 'UNSUPPORTED', message: 'Unsupported QR code (PromptPay only for MVP)' };
  }

  try {
    const data = adapter.decode(trimmed);
    return { ok: true, system: adapter.system, data, requiresAmount: data.amount == null };
  } catch (err) {
    if (err instanceof QrDecodeError) {
      return { ok: false, code: err.code, message: err.message };
    }
    return { ok: false, code: 'INVALID_FORMAT', message: err instanceof Error ? err.message : 'Invalid QR' };
  }
}
