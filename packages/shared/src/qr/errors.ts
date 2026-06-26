export type QrDecodeErrorCode = 'UNSUPPORTED' | 'INVALID_FORMAT' | 'BAD_CRC';

/** Thrown by QR adapters; carries a stable code for the API/UI to branch on. */
export class QrDecodeError extends Error {
  constructor(
    public readonly code: QrDecodeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'QrDecodeError';
  }
}
