import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../lib/theme';
import { Button } from './Button';

/** Centered loading spinner with a label. */
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

/** Centered error message with optional retry. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.label}>{message}</Text>
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} style={styles.btn} /> : null}
    </View>
  );
}

/** Centered empty placeholder. */
export function EmptyState({
  title,
  subtitle,
  icon = '∅',
}: {
  title: string;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.label}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  label: { color: colors.subtext, fontSize: 14, textAlign: 'center' },
  errorTitle: { color: colors.danger, fontSize: 16, fontWeight: '700' },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  icon: { color: colors.muted, fontSize: 36, marginBottom: spacing.xs },
  btn: { marginTop: spacing.sm, alignSelf: 'stretch' },
});
