import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

function TabIcon({ tabKey, active, colors }) {
  const color = active ? colors.chocolate : colors.toffee;
  if (tabKey === 'home') return <View style={[styles.iconHome, { borderColor: color }]} />;
  if (tabKey === 'scan')
    return (
      <View style={[styles.iconScan, { borderColor: color }]}>
        <View style={[styles.iconScanDot, { backgroundColor: color }]} />
      </View>
    );
  return (
    <View style={styles.iconProfile}>
      <View style={[styles.iconProfileHead, { backgroundColor: color }]} />
      <View style={[styles.iconProfileBody, { backgroundColor: color }]} />
    </View>
  );
}

export default function BottomNavBar({ active, onChange }) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const TABS = [
    { key: 'home', label: t('nav_home') },
    { key: 'scan', label: t('nav_scan') },
    { key: 'profile', label: t('nav_profile') },
  ];

  return (
    <View style={[styles.bar, { backgroundColor: colors.cream, borderTopColor: colors.toffee }]}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
            <TabIcon tabKey={tab.key} active={isActive} colors={colors} />
            <Text style={[styles.label, { color: isActive ? colors.chocolate : colors.toffee }]}>{tab.label}</Text>
            {isActive && <View style={[styles.activeDot, { backgroundColor: colors.chocolate }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingBottom: 22, paddingHorizontal: 10 },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10.5, fontWeight: '600' },
  activeDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  iconHome: { width: 18, height: 18, borderWidth: 2, borderRadius: 5 },
  iconScan: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  iconScanDot: { width: 6, height: 6, borderRadius: 3 },
  iconProfile: { width: 18, height: 18, alignItems: 'center' },
  iconProfileHead: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  iconProfileBody: { width: 14, height: 7, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
});