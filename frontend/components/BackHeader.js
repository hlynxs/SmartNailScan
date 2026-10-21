import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function BackHeader({ title, onBack }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backArrow}>‹</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 34 }} />
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 16 },
    backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.creamAlt, alignItems: 'center', justifyContent: 'center' },
    backArrow: { fontSize: 20, color: colors.espresso, marginTop: -2 },
    title: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: colors.espresso },
  });
}