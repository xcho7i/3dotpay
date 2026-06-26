import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../lib/theme';

/** Lightweight in-screen header with a back chevron and optional right slot. */
export function Header({ title, right }: { title: string; right?: ReactNode }) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
        <Text style={styles.chevron}>‹</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  chevron: { color: colors.text, fontSize: 34, lineHeight: 34, marginTop: -4 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', flex: 1 },
  right: { minWidth: 32, alignItems: 'flex-end' },
});
