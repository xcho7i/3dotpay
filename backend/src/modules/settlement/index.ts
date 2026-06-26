import { env } from '../../config/env.js';
import { MockAeonSettlementAdapter } from './mock-aeon.adapter.js';
import { type SettlementPartner } from './settlement.types.js';

export * from './settlement.types.js';

let instance: SettlementPartner | undefined;

/**
 * Returns the configured settlement partner. AEON/KSHER fall back to the mock
 * until real adapters + credentials exist (TODO).
 */
export function getSettlementPartner(): SettlementPartner {
  if (!instance) {
    switch (env.SETTLEMENT_ADAPTER) {
      case 'mock':
      case 'aeon':
      case 'ksher':
      default:
        instance = new MockAeonSettlementAdapter();
        break;
    }
  }
  return instance;
}
