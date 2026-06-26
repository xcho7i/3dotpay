import { env } from '../../config/env.js';
import { AeonSettlementAdapter } from './aeon.adapter.js';
import { KsherSettlementAdapter } from './ksher.adapter.js';
import { MockAeonSettlementAdapter } from './mock-aeon.adapter.js';
import { type SettlementPartner } from './settlement.types.js';

export * from './settlement.types.js';

let instance: SettlementPartner | undefined;

/**
 * Returns the configured settlement partner, selected by SETTLEMENT_PARTNER.
 * Mock is the default for local dev. Real adapters (aeon/ksher) fail fast at
 * construction when their credentials are missing.
 */
export function getSettlementPartner(): SettlementPartner {
  if (!instance) {
    switch (env.SETTLEMENT_PARTNER) {
      case 'aeon':
        instance = new AeonSettlementAdapter();
        break;
      case 'ksher':
        instance = new KsherSettlementAdapter();
        break;
      case 'mock':
      default:
        instance = new MockAeonSettlementAdapter();
        break;
    }
  }
  return instance;
}
