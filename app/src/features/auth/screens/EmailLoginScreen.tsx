import { useLoginWithEmail } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { colors } from '../../../lib/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { sendCode } = useLoginWithEmail({
    onError: (e) => setError(e instanceof Error ? e.message : String(e)),
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError('Enter a valid email address');
      return;
    }
    try {
      setSubmitting(true);
      await sendCode({ email: value });
      router.push({ pathname: '/(auth)/code', params: { email: value } });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>What's your email?</Text>
      <Text style={styles.subtitle}>We'll send you a one-time code to sign in.</Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        inputMode="email"
        autoFocus
        editable={!submitting}
        onSubmitEditing={onSubmit}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={({ pressed }) => [styles.btn, (pressed || submitting) && styles.pressed]}
        onPress={onSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.btnText}>Send code</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, gap: 12, justifyContent: 'center' },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.subtext, fontSize: 15, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
  },
  error: { color: colors.danger, fontSize: 14 },
  btn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
