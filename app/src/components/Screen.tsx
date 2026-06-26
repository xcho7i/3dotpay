import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../lib/theme';

/** Dark, safe-area screen container. Set `scroll` for scrollable content. */
export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
  refreshControl,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  refreshControl?: ScrollViewProps['refreshControl'];
}) {
  const inner: ViewStyle = { flex: scroll ? undefined : 1, padding: padded ? spacing.lg : 0, gap: spacing.lg };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[{ padding: padded ? spacing.lg : 0, gap: spacing.lg }, style]}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[inner, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
});
