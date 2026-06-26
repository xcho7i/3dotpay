// Privy/crypto polyfills. MUST be imported as early as possible (first import in
// the root layout) — before any Privy or crypto code runs.
import { Buffer } from 'buffer';
import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';

// Some deps (jose, viem) expect a global Buffer.
const g = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
if (!g.Buffer) g.Buffer = Buffer;
