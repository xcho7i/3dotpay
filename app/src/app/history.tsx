import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { EmptyState, ErrorState } from '../components/StateView';
import { TransactionRow } from '../components/TransactionRow';
import { useTransactions } from '../features/transactions/useTransactions';
import { colors, spacing } from '../lib/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const { state, reload, loadMore, loadingMore } = useTransactions();

  return (
    <Screen padded={false}>
      <View style={styles.headerWrap}>
        <Header title="History" />
      </View>

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
          <EmptyState icon="↺" title="No transactions yet" subtitle="Payments you make will show up here." />
        </View>
      ) : (
        <FlatList
          data={state.transactions}
          keyExtractor={(tx) => tx.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TransactionRow tx={item} onPress={() => router.push(`/transaction/${item.id}`)} />
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => void loadMore()}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  fill: { flex: 1, justifyContent: 'center' },
  list: { gap: spacing.sm, padding: spacing.lg },
  footer: { paddingVertical: spacing.md },
});
