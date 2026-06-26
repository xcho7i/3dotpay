import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { EmptyState, ErrorState } from '../components/StateView';
import { TransactionRow } from '../components/TransactionRow';
import { useTransactions } from '../features/transactions/useTransactions';
import { colors, spacing } from '../lib/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const { state, reload } = useTransactions();

  return (
    <Screen>
      <Header title="History" />

      {state.status === 'loading' ? (
        <View style={styles.fill}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : state.status === 'error' ? (
        <View style={styles.fill}>
          <ErrorState message={state.message} onRetry={reload} />
        </View>
      ) : state.transactions.length === 0 ? (
        <View style={styles.fill}>
          <EmptyState
            icon="↺"
            title="No transactions yet"
            subtitle="Payments you make will show up here."
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {state.transactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} onPress={() => router.push(`/transaction/${tx.id}`)} />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center' },
  list: { gap: spacing.sm, paddingBottom: spacing.lg },
});
