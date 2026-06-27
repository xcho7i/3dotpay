import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Logo } from '../../../components/Logo';
import { colors } from '../../../lib/theme';

export function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Logo size="lg" />
        <Text style={styles.subtitle}>Scan. Pay. Done.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          onPress={() => router.push('/(auth)/email')}
        >
          <Text style={styles.primaryBtnText}>Continue with email</Text>
        </Pressable>

        {/* Optional social logins — placeholders until configured in Privy. */}
        <Pressable style={[styles.secondaryBtn, styles.disabled]} disabled>
          <Text style={styles.secondaryBtnText}>Continue with Google (soon)</Text>
        </Pressable>
        <Pressable style={[styles.secondaryBtn, styles.disabled]} disabled>
          <Text style={styles.secondaryBtnText}>Continue with Apple (soon)</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'space-between' },
  brand: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  subtitle: { color: colors.subtext, fontSize: 16 },
  actions: { gap: 12, paddingBottom: 24 },
  primaryBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.subtext, fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
