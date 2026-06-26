import { PromptPayQRParseResultSchema, type PromptPayQRParseResult } from '../domain/promptpay.js';
import { type QRDecoderAdapter } from './adapter.js';
import { crc16Hex } from './crc.js';
import { QrDecodeError } from './errors.js';
import { parseTlv } from './tlv.js';

/** EMVCo Application Identifier prefix for PromptPay (covers ...0111 and ...0112). */
const PROMPTPAY_AID_PREFIX = 'A00000067701';

const TAG = {
  MERCHANT_ACCOUNT_INDIVIDUAL: '29',
  MERCHANT_ACCOUNT_MERCHANT: '30',
  CURRENCY: '53',
  AMOUNT: '54',
  MERCHANT_NAME: '59',
  CRC: '63',
} as const;

/** EMVCo currency code 764 = THB. */
const CURRENCY_THB = '764';

/**
 * PromptPay (Thailand) EMVCo QR decoder. Extracts the merchant proxy id, the
 * optional amount, and validates the CRC. Pure function — no side effects.
 */
export const promptPayAdapter: QRDecoderAdapter = {
  system: 'promptpay',

  canDecode(payload: string): boolean {
    return payload.includes(PROMPTPAY_AID_PREFIX);
  },

  decode(payload: string): PromptPayQRParseResult {
    const fields = parseTlv(payload);

    // 1. CRC — computed over everything up to and including the "6304" header.
    const crcField = fields.find((f) => f.id === TAG.CRC);
    if (!crcField) throw new QrDecodeError('BAD_CRC', 'Missing CRC field');
    const crcInput = payload.slice(0, crcField.start + 4);
    if (crc16Hex(crcInput) !== crcField.value.toUpperCase()) {
      throw new QrDecodeError('BAD_CRC', 'CRC check failed');
    }

    // 2. Merchant account info (tag 29 individual, or 30 merchant).
    const merchantField =
      fields.find((f) => f.id === TAG.MERCHANT_ACCOUNT_INDIVIDUAL) ??
      fields.find((f) => f.id === TAG.MERCHANT_ACCOUNT_MERCHANT);
    if (!merchantField) {
      throw new QrDecodeError('UNSUPPORTED', 'No PromptPay merchant account information');
    }
    const sub = parseTlv(merchantField.value);
    const aid = sub.find((f) => f.id === '00')?.value ?? '';
    if (!aid.startsWith(PROMPTPAY_AID_PREFIX)) {
      throw new QrDecodeError('UNSUPPORTED', 'Not a PromptPay QR code');
    }
    // The proxy id is the first non-AID sub-field (mobile / national id / ewallet / biller).
    const merchantId = sub.find((f) => f.id !== '00' && f.value.length > 0)?.value;
    if (!merchantId) {
      throw new QrDecodeError('INVALID_FORMAT', 'Missing PromptPay merchant identifier');
    }

    // 3. Currency — MVP supports THB only.
    const currencyCode = fields.find((f) => f.id === TAG.CURRENCY)?.value;
    if (currencyCode && currencyCode !== CURRENCY_THB) {
      throw new QrDecodeError('UNSUPPORTED', `Unsupported currency (${currencyCode}); MVP is THB only`);
    }

    // 4. Optional amount + merchant name.
    const amount = fields.find((f) => f.id === TAG.AMOUNT)?.value;
    const merchantName = fields.find((f) => f.id === TAG.MERCHANT_NAME)?.value;

    const result: PromptPayQRParseResult = {
      merchantId,
      merchantName: merchantName || undefined,
      amount: amount || undefined,
      currency: 'THB',
      rawPayload: payload,
    };

    // Validate against the shared contract (e.g. amount must be a decimal string).
    const parsed = PromptPayQRParseResultSchema.safeParse(result);
    if (!parsed.success) {
      throw new QrDecodeError('INVALID_FORMAT', 'Decoded QR failed validation');
    }
    return parsed.data;
  },
};
