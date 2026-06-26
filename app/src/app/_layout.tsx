import '../lib/polyfills'; // MUST be the first import.

import { StatusBar } from 'expo-status-bar';

import { RootNavigator } from '../features/auth/RootNavigator';
import { PrivyProvider } from '../lib/privy/PrivyProvider';

export default function RootLayout() {
  return (
    <PrivyProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </PrivyProvider>
  );
}
