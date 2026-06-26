/**
 * CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — the checksum used by EMVCo /
 * PromptPay QR codes. Standard check value: crc16ccitt("123456789") === 0x29B1.
 * Inputs are ASCII (PromptPay payloads contain no multibyte chars).
 */
export function crc16ccitt(input: string): number {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
    }
  }
  return crc & 0xffff;
}

/** CRC as a 4-char uppercase hex string (zero-padded), as it appears in the QR. */
export function crc16Hex(input: string): string {
  return crc16ccitt(input).toString(16).toUpperCase().padStart(4, '0');
}
