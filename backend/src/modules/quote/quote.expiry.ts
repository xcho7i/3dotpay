/** Quotes are valid for 60 seconds. */
export const QUOTE_TTL_SECONDS = 60;

/** Absolute expiry time for a quote created at `now`. */
export function computeExpiresAt(now: Date): Date {
  return new Date(now.getTime() + QUOTE_TTL_SECONDS * 1000);
}

/** Whole seconds remaining until expiry (0 once expired). */
export function expirySeconds(expiresAt: Date, now: Date): number {
  const ms = expiresAt.getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 1000);
}

/** Whether the quote is expired as of `now`. */
export function isExpired(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() <= now.getTime();
}
