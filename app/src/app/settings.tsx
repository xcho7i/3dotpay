import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { env } from '../lib/env';
import { shortenAddress } from '../lib/format';
import { useAuth, useEmbeddedWallet } from '../lib/privy/hooks';
import { colors, spacing } from '../lib/theme';

const NETWORK = env.baseChainId === 8453 ? 'Base mainnet' : `Base (chain ${env.baseChainId})`;

export default function SettingsScreen() {
  const { email, logout } = useAuth();
  const { address } = useEmbeddedWallet();

  return (
    <Screen scroll>
      <Header title="Settings" />

      <Card>
        <Row label="Account" value={email ?? '—'} />
        <Divider />
        <Row label="Wallet" value={shortenAddress(address)} />
        <Divider />
        <Row label="Network" value={NETWORK} />
        <Divider />
        <Row label="Asset" value="USDC" />
      </Card>

      <Card>
        <Row label="Version" value="0.1.0 · MVP" />
      </Card>

      <View style={styles.spacer} />
      <Button title="Log out" variant="danger" onPress={() => void logout()} />
      <Text style={styles.note}>
        3DotPay never stores your keys. Your wallet is secured by Privy.
      </Text>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 8 },
  label: { color: colors.subtext, fontSize: 14 },
  value: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border },
  spacer: { flex: 1, minHeight: spacing.lg },
  note: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: spacing.sm },
});
