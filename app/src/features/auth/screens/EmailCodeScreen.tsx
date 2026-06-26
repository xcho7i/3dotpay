import { useLoginWithEmail } from '@privy-io/expo';
import { useLocalSearchParams } from 'expo-router';
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

export function EmailCodeScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // On success, Privy sets `user`; RootNavigator redirects to Home automatically.
  const { loginWithCode, sendCode } = useLoginWithEmail({
    onError: (e) => setError(e instanceof Error ? e.message : String(e)),
  });

  const onSubmit = async () => {
    setError(null);
    if (code.trim().length < 6) {
      setError('Enter the 6-digit code');
      return;
    }
    try {
      setSubmitting(true);
      await loginWithCode({ code: code.trim(), email });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setError(null);
    try {
      await sendCode({ email });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Enter your code</Text>
      <Text style={styles.subtitle}>Sent to {email}</Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={6}
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
          <Text style={styles.btnText}>Verify & sign in</Text>
        )}
      </Pressable>

      <Pressable onPress={onResend} disabled={submitting} style={styles.resend}>
        <Text style={styles.resendText}>Resend code</Text>
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
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
  },
  error: { color: colors.danger, fontSize: 14 },
  btn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  resend: { alignItems: 'center', paddingVertical: 12 },
  resendText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
