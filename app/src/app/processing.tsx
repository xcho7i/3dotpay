import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../components/Screen';
import { colors, spacing } from '../lib/theme';

const STEPS = ['Signing transaction', 'Broadcasting on Base', 'Notifying settlement'];

export default function ProcessingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Simulate the on-chain + settlement flow, then show the receipt.
  // TODO: replace with real tx submit + confirmation polling.
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 900),
      setTimeout(() => setStep(2), 1800),
      setTimeout(() => router.replace('/receipt'), 2700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [router]);

  return (
    <Screen>
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.title}>Processing payment</Text>
        <View style={styles.steps}>
          {STEPS.map((label, i) => (
            <View key={label} style={styles.step}>
              <Text style={[styles.dot, i <= step && styles.dotActive]}>
                {i < step ? '✓' : '•'}
              </Text>
              <Text style={[styles.stepText, i <= step && styles.stepTextActive]}>{label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.hint}>Keep the app open…</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  steps: { gap: spacing.sm, alignSelf: 'stretch', paddingHorizontal: spacing.xl },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { color: colors.muted, fontSize: 16, width: 18, textAlign: 'center' },
  dotActive: { color: colors.success },
  stepText: { color: colors.muted, fontSize: 15 },
  stepTextActive: { color: colors.text },
  hint: { color: colors.muted, fontSize: 13 },
});
