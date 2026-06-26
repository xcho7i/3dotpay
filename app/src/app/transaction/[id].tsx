import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../components/Card';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateView';
import { ApiError, getTransaction, type Transaction } from '../../lib/api';
import { formatDate, formatUsdc } from '../../lib/format';
import { useAuth } from '../../lib/privy/hooks';
import { colors, spacing } from '../../lib/theme';

type State =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string }
  | { status: 'ready'; tx: Transaction };

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAccessToken } = useAuth();
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const tx = await getTransaction(token, String(id));
      setState({ status: 'ready', tx });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NOT_IMPLEMENTED') {
        setState({ status: 'unavailable' });
        return;
      }
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [getAccessToken, id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen scroll>
      <Header title="Transaction" />

      {state.status === 'loading' ? (
        <LoadingState />
      ) : state.status === 'error' ? (
        <ErrorState message={state.message} onRetry={load} />
      ) : state.status === 'unavailable' ? (
        <EmptyState
          icon="↺"
          title="Details coming soon"
          subtitle={`Transaction ${String(id).slice(0, 10)}… will show full details once payments are live.`}
        />
      ) : (
        <Card>
          <Row label="Status" value={state.tx.status} />
          <Row label="Amount" value={`${formatUsdc(state.tx.amountUsdc)} USDC`} />
          <Row label="Fiat" value={`${state.tx.amountFiat} ${state.tx.fiatCurrency}`} />
          <Row label="Merchant" value={state.tx.merchantId} />
          <Row label="Tx hash" value={state.tx.txHash ?? '—'} />
          <Row label="Date" value={formatDate(state.tx.createdAt)} />
        </Card>
      )}
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 8 },
  label: { color: colors.subtext, fontSize: 14 },
  value: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
