import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../lib/theme';

const LOGO = require('../../assets/3dotpay_logo.png');

/** 3DotPay brand: logo mark (PNG) + optional wordmark. */
export function Logo({ size = 'md', showName = true }: { size?: 'sm' | 'md' | 'lg'; showName?: boolean }) {
  const mark = size === 'lg' ? 64 : size === 'sm' ? 24 : 36;
  const font = size === 'lg' ? 40 : size === 'sm' ? 18 : 26;

  return (
    <View style={styles.row}>
      <Image source={LOGO} style={{ width: mark, height: mark }} resizeMode="contain" />
      {showName ? <Text style={[styles.name, { fontSize: font }]}>3DotPay</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { color: colors.text, fontWeight: '800', letterSpacing: 0.3 },
});
