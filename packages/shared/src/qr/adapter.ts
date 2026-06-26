import { type PromptPayQRParseResult } from '../domain/promptpay.js';

/**
 * A QR decoder adapter. New rails (e.g. DuitNow, GrabPay) can be added later by
 * implementing this interface and registering the adapter — no caller changes.
 */
export interface QRDecoderAdapter {
  readonly system: 'promptpay';
  /** Cheap check: can this adapter handle the payload? */
  canDecode(payload: string): boolean;
  /** Decode the payload. Throws QrDecodeError on failure. */
  decode(payload: string): PromptPayQRParseResult;
}
