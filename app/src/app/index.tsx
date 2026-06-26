import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Logo } from '../components/Logo';
import { Screen } from '../components/Screen';
import { EmptyState, ErrorState } from '../components/StateView';
import { TransactionRow } from '../components/TransactionRow';
import { useTransactions } from '../features/transactions/useTransactions';
import { useUsdcBalance } from '../features/wallet/useUsdcBalance';
import { formatUsdc, shortenAddress } from '../lib/format';
import { useEmbeddedWallet } from '../lib/privy/hooks';
import { useWalletSync } from '../lib/privy/useWalletSync';
import { colors, spacing } from '../lib/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { address } = useEmbeddedWallet();
  const sync = useWalletSync();
  const walletAddress = address ?? sync.address;

  const balance = useUsdcBalance(walletAddress);
  const { state: txState, reload } = useTransactions();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([balance.refresh(), reload()]);
    setRefreshing(false);
  }, [balance, reload]);

  const creatingWallet = sync.status === 'creating' || (!walletAddress && sync.status !== 'error');

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Logo size="md" />
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
          <Text style={styles.gear}>⚙︎</Text>
        </Pressable>
      </View>

      {/* Balance card */}
      <Card style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.cardLabel}>USDC balance · Base</Text>
          <Pressable onPress={() => void balance.refresh()} hitSlop={10} disabled={balance.state.status === 'loading'}>
            <Text style={styles.refresh}>{balance.state.status === 'loading' ? '…' : '↻'}</Text>
          </Pressable>
        </View>

        {balance.state.status === 'loading' ? (
          <ActivityIndicator color={colors.primary} style={styles.balanceLoader} />
        ) : balance.state.status === 'error' ? (
          <View>
            <Text style={styles.balance}>
              —
            </Text>
            <Pressable onPress={() => void balance.refresh()}>
              <Text style={styles.balanceError}>Couldn't load balance · tap to retry</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.balance}>
            {formatUsdc(balance.state.usdc)} <Text style={styles.balanceUnit}>USDC</Text>
          </Text>
        )}

        <View style={styles.walletRow}>
          {creatingWallet ? (
            <>
              <ActivityIndicator color={colors.muted} size="small" />
              <Text style={styles.walletText}>Setting up your wallet…</Text>
            </>
          ) : (
            <Text style={styles.walletText} selectable>
              {shortenAddress(walletAddress)}
            </Text>
          )}
          {sync.status === 'synced' ? <Text style={styles.synced}>· saved</Text> : null}
        </View>
      </Card>

      {/* Primary actions */}
      <View style={styles.actions}>
        <Button title="Scan QR to pay" onPress={() => router.push('/scan')} />
        <View style={styles.actionRow}>
          <Button title="Deposit" variant="secondary" style={styles.flex} onPress={() => router.push('/deposit')} />
          <Button title="History" variant="secondary" style={styles.flex} onPress={() => router.push('/history')} />
        </View>
      </View>

      {/* Recent transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent</Text>

        {txState.status === 'loading' ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
        ) : txState.status === 'error' ? (
          <ErrorState message={txState.message} onRetry={reload} />
        ) : txState.transactions.length === 0 ? (
          <EmptyState icon="↺" title="No payments yet" subtitle="Scan a PromptPay QR to make your first payment." />
        ) : (
          <View style={styles.txList}>
            {txState.transactions.slice(0, 3).map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onPress={() => router.push(`/transaction/${tx.id}`)} />
            ))}
            {txState.transactions.length > 3 ? (
              <Pressable onPress={() => router.push('/history')} style={styles.seeAll}>
                <Text style={styles.seeAllText}>See all</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gear: { color: colors.subtext, fontSize: 22 },
  balanceCard: { gap: spacing.sm },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  refresh: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  balance: { color: colors.text, fontSize: 36, fontWeight: '800' },
  balanceUnit: { color: colors.subtext, fontSize: 18, fontWeight: '600' },
  balanceLoader: { alignSelf: 'flex-start', marginVertical: spacing.sm },
  balanceError: { color: colors.danger, fontSize: 13, marginTop: 2 },
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  walletText: { color: colors.subtext, fontSize: 14, fontVariant: ['tabular-nums'] },
  synced: { color: colors.success, fontSize: 12 },
  actions: { gap: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  txList: { gap: spacing.sm },
  seeAll: { alignItems: 'center', paddingVertical: spacing.sm },
  seeAllText: { color: colors.primary, fontWeight: '600' },
});
