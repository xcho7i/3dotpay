import { QrDecodeError } from './errors.js';

export interface TlvField {
  id: string;
  length: number;
  value: string;
  /** Offset of this field's id within the source string. */
  start: number;
}

/**
 * Parse an EMVCo TLV string: each field is `II LL V…` where II is a 2-digit id,
 * LL a 2-digit length, and V the value of that length. Throws INVALID_FORMAT on
 * malformed input.
 */
export function parseTlv(s: string): TlvField[] {
  const fields: TlvField[] = [];
  let i = 0;

  while (i < s.length) {
    if (i + 4 > s.length) {
      throw new QrDecodeError('INVALID_FORMAT', 'Truncated TLV header');
    }
    const id = s.slice(i, i + 2);
    const lenStr = s.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(lenStr)) {
      throw new QrDecodeError('INVALID_FORMAT', 'Invalid TLV id/length');
    }
    const length = Number(lenStr);
    const valueStart = i + 4;
    const value = s.slice(valueStart, valueStart + length);
    if (value.length < length) {
      throw new QrDecodeError('INVALID_FORMAT', 'TLV value shorter than declared length');
    }
    fields.push({ id, length, value, start: i });
    i = valueStart + length;
  }

  return fields;
}
