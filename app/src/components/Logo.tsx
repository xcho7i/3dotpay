import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../lib/theme';

/** 3DotPay wordmark: three dots (red / white / red) + name. */
export function Logo({ size = 'md', showName = true }: { size?: 'sm' | 'md' | 'lg'; showName?: boolean }) {
  const dot = size === 'lg' ? 16 : size === 'sm' ? 8 : 12;
  const font = size === 'lg' ? 40 : size === 'sm' ? 18 : 26;

  return (
    <View style={styles.row}>
      <View style={[styles.dots, { gap: dot * 0.6 }]}>
        <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: colors.primary }]} />
        <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: colors.text }]} />
        <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: colors.primary }]} />
      </View>
      {showName ? <Text style={[styles.name, { fontSize: font }]}>3DotPay</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dots: { flexDirection: 'row', alignItems: 'center' },
  dot: {},
  name: { color: colors.text, fontWeight: '800', letterSpacing: 0.3 },
});
