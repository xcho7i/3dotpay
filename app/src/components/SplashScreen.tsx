import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '../lib/theme';
import { Logo } from './Logo';

/** Branded full-screen splash shown while Privy initializes. */
export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Logo size="lg" />
      <ActivityIndicator color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: 24 },
  spinner: { marginTop: 8 },
});
