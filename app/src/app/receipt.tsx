import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Share, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ErrorState, LoadingState } from '../components/StateView';
import { getTransaction, type Transaction } from '../lib/api';
import { env } from '../lib/env';
import { formatUsdc, shortenAddress } from '../lib/format';
import { useAuth } from '../lib/privy/hooks';
import { colors, spacing } from '../lib/theme';

const explorerBase = env.baseChainId === 84532 ? 'https://sepolia.basescan.org' : 'https://basescan.org';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; tx: Transaction };

export default function ReceiptScreen() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const { transactionId } = useLocalSearchParams<{ transactionId?: string }>();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const token = await getAccessToken();
      if (!token || !transactionId) throw new Error('Missing receipt reference');
      const tx = await getTransaction(token, transactionId);
      setState({ status: 'ready', tx });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [getAccessToken, transactionId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'loading') {
    return (
      <Screen>
        <LoadingState label="Loading receipt…" />
      </Screen>
    );
  }
  if (state.status === 'error') {
    return (
      <Screen>
        <ErrorState message={state.message} onRetry={load} />
      </Screen>
    );
  }

  const { tx } = state;
  const success = tx.status === 'SUCCESS';
  const pending = tx.status === 'SUBMITTED' || tx.status === 'CONFIRMED' || tx.status === 'SETTLEMENT_PENDING';
  const explorerUrl = tx.txHash ? `${explorerBase}/tx/${tx.txHash}` : undefined;

  const copyHash = async () => {
    if (!tx.txHash) return;
    await Clipboard.setStringAsync(tx.txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareReceipt = async () => {
    // Placeholder share — a richer shareable receipt comes later.
    await Share.share({
      message: `3DotPay payment of ฿${tx.amountFiat} (${formatUsdc(tx.amountUsdc)} USDC) — ${tx.status}${tx.txHash ? `\n${explorerUrl}` : ''}`,
    });
  };

  return (
    <Screen scroll>
      <View style={styles.head}>
        <View style={[styles.badge, success ? styles.badgeOk : pending ? styles.badgePending : styles.badgeFail]}>
          <Text style={[styles.check, success ? styles.checkOk : pending ? styles.checkPending : styles.checkFail]}>
            {success ? '✓' : pending ? '…' : '✕'}
          </Text>
        </View>
        <Text style={styles.title}>
          {success ? 'Payment complete' : pending ? 'Payment processing' : 'Payment failed'}
        </Text>
        <Text style={styles.amount}>฿ {tx.amountFiat}</Text>
        <Text style={styles.amountUsdc}>{formatUsdc(tx.amountUsdc)} USDC</Text>
      </View>

      <Card>
        <Row label="Merchant" value={tx.merchantId} />
        <Row label="Status" value={tx.status} valueColor={success ? colors.success : pending ? colors.warning : colors.danger} />
        <Row label="Network" value="Base" />
        <Row label="Transaction" value={tx.txHash ? shortenAddress(tx.txHash) : '—'} />
        {tx.failureReason ? <Row label="Reason" value={tx.failureReason} valueColor={colors.danger} /> : null}
      </Card>

      {tx.txHash ? (
        <View style={styles.txActions}>
          <Button title={copied ? 'Copied ✓' : 'Copy tx hash'} variant="secondary" style={styles.flex} onPress={copyHash} />
          <Button
            title="View on BaseScan"
            variant="secondary"
            style={styles.flex}
            onPress={() => explorerUrl && void Linking.openURL(explorerUrl)}
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button title="Share receipt" variant="ghost" onPress={() => void shareReceipt()} />
        <Button title="Done" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  badge: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: spacing.sm },
  badgeOk: { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: colors.success },
  badgePending: { backgroundColor: 'rgba(245,166,35,0.12)', borderColor: colors.warning },
  badgeFail: { backgroundColor: 'rgba(248,113,113,0.12)', borderColor: colors.danger },
  check: { fontSize: 44, fontWeight: '800' },
  checkOk: { color: colors.success },
  checkPending: { color: colors.warning },
  checkFail: { color: colors.danger },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  amount: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: spacing.sm },
  amountUsdc: { color: colors.subtext, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 7 },
  rowLabel: { color: colors.subtext, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  txActions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
