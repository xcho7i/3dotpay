import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { ErrorState, LoadingState } from '../components/StateView';
import { useQuote } from '../features/quote/useQuote';
import { formatUsdc, shortenAddress } from '../lib/format';
import { colors, spacing } from '../lib/theme';

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={[styles.lineValue, strong && styles.lineValueStrong]}>{value}</Text>
    </View>
  );
}

export default function QuoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    merchantId?: string;
    merchantName?: string;
    amount?: string;
    requiresAmount?: string;
    rawPayload?: string;
  }>();

  const merchantLabel = params.merchantName || `PromptPay · ${shortenAddress(params.merchantId)}`;
  const needsAmount = params.requiresAmount === '1' && !params.amount;

  const [manualAmount, setManualAmount] = useState('');
  const [confirmedAmount, setConfirmedAmount] = useState<string | undefined>(params.amount || undefined);
  const [amountError, setAmountError] = useState<string | null>(null);

  const { state, refresh } = useQuote({
    merchantId: params.merchantId ?? '',
    merchantName: params.merchantName,
    merchantAmount: confirmedAmount,
    rawQrPayload: params.rawPayload,
  });

  // Countdown derived from the quote's expiry.
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  useEffect(() => {
    if (state.status !== 'ready') {
      setSecondsLeft(null);
      return;
    }
    const expiry = new Date(state.quote.expiresAt).getTime();
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((expiry - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state]);

  const submitAmount = () => {
    setAmountError(null);
    const n = Number(manualAmount.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) {
      setAmountError('Enter an amount greater than 0');
      return;
    }
    setConfirmedAmount(n.toFixed(2));
  };

  // Step 1: manual amount entry (QR had no amount).
  if (needsAmount && !confirmedAmount) {
    return (
      <Screen>
        <Header title="Enter amount" />
        <Card>
          <Text style={styles.merchantLabel}>Pay to</Text>
          <Text style={styles.merchant} numberOfLines={1}>
            {merchantLabel}
          </Text>
        </Card>

        <Text style={styles.fieldLabel}>Amount (THB)</Text>
        <View style={styles.amountRow}>
          <Text style={styles.baht}>฿</Text>
          <TextInput
            style={styles.amountInput}
            value={manualAmount}
            onChangeText={setManualAmount}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            inputMode="decimal"
            autoFocus
            onSubmitEditing={submitAmount}
          />
        </View>
        {amountError ? <Text style={styles.error}>{amountError}</Text> : null}

        <View style={styles.actions}>
          <Button title="Continue" onPress={submitAmount} />
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  // Step 2: quote summary with live conversion + countdown.
  const expired = secondsLeft === 0;

  return (
    <Screen scroll>
      <Header title="Confirm payment" />

      {state.status === 'loading' || state.status === 'idle' ? (
        <LoadingState label="Getting a quote…" />
      ) : state.status === 'error' ? (
        <ErrorState message={state.message} onRetry={refresh} />
      ) : (
        <>
          <Card>
            <Text style={styles.merchantLabel}>Pay to</Text>
            <Text style={styles.merchant} numberOfLines={1}>
              {merchantLabel}
            </Text>

            <View style={styles.divider} />

            <Line label="Amount" value={`฿ ${state.quote.amountTHB}`} strong />
            <Line label="You pay" value={`${formatUsdc(state.quote.amountUSDC)} USDC`} strong />
            <Line label="Rate" value={`1 USDC ≈ ฿ ${state.quote.fxRate}`} />
            <Line label="Network fee (est.)" value={`~ ${state.quote.networkFeeEstimate} USDC`} />
            <Line
              label="Settlement"
              value={shortenAddress(state.quote.settlementAddress)}
            />
          </Card>

          <View style={[styles.timer, expired && styles.timerExpired]}>
            <Text style={[styles.timerText, expired && styles.timerTextExpired]}>
              {expired
                ? 'Quote expired'
                : `Quote expires in ${secondsLeft ?? state.quote.expirySeconds}s`}
            </Text>
          </View>

          <View style={styles.actions}>
            {expired ? (
              <Button title="Get a new quote" onPress={refresh} />
            ) : (
              <Button title="Pay now" onPress={() => router.replace('/processing')} disabled={expired} />
            )}
            <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  merchantLabel: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  merchant: { color: colors.text, fontSize: 18, fontWeight: '700' },
  fieldLabel: { color: colors.subtext, fontSize: 13, marginBottom: -spacing.sm },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  baht: { color: colors.subtext, fontSize: 28, fontWeight: '700' },
  amountInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  error: { color: colors.danger, fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  lineLabel: { color: colors.subtext, fontSize: 14 },
  lineValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  lineValueStrong: { fontSize: 16, fontWeight: '800' },
  timer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerExpired: { borderColor: colors.danger, backgroundColor: 'rgba(248,113,113,0.08)' },
  timerText: { color: colors.subtext, fontSize: 14, fontWeight: '600' },
  timerTextExpired: { color: colors.danger },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
