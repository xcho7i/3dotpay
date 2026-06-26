import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { getTransactionStatus } from '../lib/api';
import { useAuth } from '../lib/privy/hooks';
import { colors, spacing } from '../lib/theme';

const POLL_MS = 3000;
const TIMEOUT_MS = 90_000; // give up actively polling after 90s

type Phase = 'polling' | 'failed' | 'timeout';

export default function ProcessingScreen() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const { transactionId } = useLocalSearchParams<{ transactionId?: string; txHash?: string }>();

  const [phase, setPhase] = useState<Phase>('polling');
  const [message, setMessage] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!transactionId) {
      setPhase('failed');
      setMessage('Missing transaction reference.');
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (!active) return;
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const res = await getTransactionStatus(token, transactionId);

        if (!active) return;
        if (res.status === 'SUCCESS') {
          router.replace({ pathname: '/receipt', params: { transactionId } });
          return;
        }
        if (res.status === 'FAILED' || res.status === 'EXPIRED') {
          setPhase('failed');
          setMessage(res.failureReason ?? 'The payment could not be completed.');
          return;
        }
        if (Date.now() - startedAt.current > TIMEOUT_MS) {
          setPhase('timeout');
          return;
        }
      } catch {
        // Transient (e.g. RPC/network) — keep polling until timeout.
        if (Date.now() - startedAt.current > TIMEOUT_MS) {
          setPhase('timeout');
          return;
        }
      }
      timer = setTimeout(() => void poll(), POLL_MS);
    };

    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [transactionId, getAccessToken, router]);

  if (phase === 'failed') {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.failIcon}>✕</Text>
          <Text style={styles.title}>Payment failed</Text>
          <Text style={styles.hint}>{message}</Text>
          <Button title="Back to home" onPress={() => router.replace('/')} style={styles.btn} />
        </View>
      </Screen>
    );
  }

  if (phase === 'timeout') {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Still processing</Text>
          <Text style={styles.hint}>
            This is taking longer than usual. Your payment is still being confirmed — check History
            in a moment.
          </Text>
          <Button title="View history" onPress={() => router.replace('/history')} style={styles.btn} />
          <Button title="Back to home" variant="ghost" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.title}>Confirming payment</Text>
        <Text style={styles.hint}>Waiting for on-chain confirmation and settlement…</Text>
        <Text style={styles.sub}>Keep the app open.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  hint: { color: colors.subtext, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sub: { color: colors.muted, fontSize: 13 },
  failIcon: {
    color: colors.danger,
    fontSize: 44,
    fontWeight: '800',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: colors.danger,
    textAlign: 'center',
    lineHeight: 80,
  },
  btn: { alignSelf: 'stretch', marginTop: spacing.sm },
});
