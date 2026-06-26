import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Transaction, type TransactionStatus } from '../lib/api';
import { formatDate, formatUsdc } from '../lib/format';
import { colors, radius, spacing } from '../lib/theme';

const STATUS_COLOR: Record<TransactionStatus, string> = {
  CREATED: colors.muted,
  SUBMITTED: colors.warning,
  CONFIRMED: colors.warning,
  SETTLEMENT_PENDING: colors.warning,
  SUCCESS: colors.success,
  FAILED: colors.danger,
  EXPIRED: colors.danger,
};

export function TransactionRow({ tx, onPress }: { tx: Transaction; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <Text style={styles.merchant} numberOfLines={1}>
          {tx.merchantId || 'Merchant'}
        </Text>
        <Text style={styles.date}>{formatDate(tx.createdAt)}</Text>
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.amount}>{formatUsdc(tx.amountUsdc)} USDC</Text>
        <Text style={[styles.status, { color: STATUS_COLOR[tx.status] }]}>{tx.status}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.8 },
  left: { flex: 1, gap: 2 },
  merchant: { color: colors.text, fontSize: 15, fontWeight: '600' },
  date: { color: colors.muted, fontSize: 12 },
  rightCol: { alignItems: 'flex-end', gap: 2 },
  amount: { color: colors.text, fontSize: 15, fontWeight: '700' },
  status: { fontSize: 11, fontWeight: '700' },
});
