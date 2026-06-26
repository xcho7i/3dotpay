import { type HealthResponse } from '@3dotpay/shared';

import { version } from '../../config/version.js';

/** Build the health payload. No dependencies (no DB, no chain). */
export function getHealth(): HealthResponse {
  return {
    status: 'ok',
    service: '3dotpay-api',
    version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}
