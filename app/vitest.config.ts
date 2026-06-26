import { defineConfig } from 'vitest/config';

// Unit tests for PURE modules only (no React Native imports), e.g. the USDC
// transfer encoder. RN/Expo components are validated via typecheck + metro bundle.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
