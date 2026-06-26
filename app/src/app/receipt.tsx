import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { colors, spacing } from '../lib/theme';

export default function ReceiptScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.badge}>
          <Text style={styles.check}>✓</Text>
        </View>
        <Text style={styles.title}>Payment sent</Text>
        <Text style={styles.subtitle}>Your payment is being settled.</Text>

        <Card style={styles.card}>
          <Row label="Amount" value="0.00 USDC" />
          <Row label="To" value="PromptPay merchant" />
          <Row label="Status" value="Settlement pending" valueColor={colors.warning} />
          <Row label="Tx hash" value="—" />
        </Card>
      </View>

      <View style={styles.actions}>
        <Button title="Done" onPress={() => router.replace('/')} />
        <Button title="View history" variant="ghost" onPress={() => router.replace('/history')} />
      </View>
    </Screen>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: colors.success, fontSize: 44, fontWeight: '800' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.subtext, fontSize: 15 },
  card: { alignSelf: 'stretch', marginTop: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: colors.subtext, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  actions: { gap: spacing.sm },
});
