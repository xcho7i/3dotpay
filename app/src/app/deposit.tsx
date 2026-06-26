import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { LoadingState } from '../components/StateView';
import { useEmbeddedWallet } from '../lib/privy/hooks';
import { colors, spacing } from '../lib/theme';

export default function DepositScreen() {
  const { address } = useEmbeddedWallet();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Screen scroll>
      <Header title="Deposit" />

      {!address ? (
        <LoadingState label="Preparing your wallet…" />
      ) : (
        <>
          <Card style={styles.qrCard}>
            <View style={styles.qrWrap}>
              <QRCode value={address} size={200} backgroundColor="#FFFFFF" color="#000000" />
            </View>
            <Text style={styles.network}>USDC · Base network</Text>
          </Card>

          <Card>
            <Text style={styles.label}>Your wallet address</Text>
            <Text style={styles.address} selectable>
              {address}
            </Text>
            <Button title={copied ? 'Copied ✓' : 'Copy address'} variant="secondary" onPress={onCopy} />
          </Card>

          <View style={styles.warning}>
            <Text style={styles.warningTitle}>⚠︎ Send only USDC on Base</Text>
            <Text style={styles.warningText}>
              Sending any other asset or network for the MVP may result in permanent loss of funds.
            </Text>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  qrCard: { alignItems: 'center', gap: spacing.md },
  qrWrap: { padding: spacing.md, backgroundColor: '#FFFFFF', borderRadius: 16 },
  network: { color: colors.subtext, fontSize: 14, fontWeight: '600' },
  label: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  address: { color: colors.text, fontSize: 15, fontFamily: undefined, fontVariant: ['tabular-nums'], lineHeight: 22 },
  warning: {
    backgroundColor: 'rgba(245,166,35,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.4)',
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
  },
  warningTitle: { color: colors.warning, fontWeight: '700', fontSize: 14 },
  warningText: { color: colors.subtext, fontSize: 13, lineHeight: 19 },
});
