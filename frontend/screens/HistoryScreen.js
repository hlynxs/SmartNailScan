import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { GlassCard } from '../components/Shared';
import { FadeInUp } from '../components/Motion';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = makeStyles(colors);

  const history = [
    { date: 'Sep 17, 2026', nails: 10, condition: 'Healthy', confidence: 94, color: colors.moss },
    { date: 'Sep 12, 2026', nails: 8, condition: 'Leukonychia', confidence: 87, color: colors.clay },
    { date: 'Sep 5, 2026', nails: 10, condition: 'Healthy', confidence: 91, color: colors.moss },
    { date: 'Aug 29, 2026', nails: 10, condition: 'Healthy', confidence: 89, color: colors.moss },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 20 }}>
      <FadeInUp delay={0}>
        <Text style={styles.title}>{t('history_title')}</Text>
        <Text style={styles.subtitle}>{t('history_subtitle')}</Text>
      </FadeInUp>
      <View style={{ paddingHorizontal: 22, gap: 12, marginTop: 18 }}>
        {history.map((scan, i) => (
          <FadeInUp key={scan.date} delay={80 + i * 60}>
            <GlassCard>
              <Text style={styles.rowDate}>{scan.date}</Text>
              <Text style={styles.rowMeta}>{scan.nails} nails analyzed</Text>
              <View style={[styles.chip, { backgroundColor: `${scan.color}22` }]}>
                <Text style={[styles.chipText, { color: scan.color }]}>{scan.condition} · {scan.confidence}%</Text>
              </View>
            </GlassCard>
          </FadeInUp>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream, paddingTop: 54 },
    title: { fontFamily: 'serif', fontSize: 24, color: colors.espresso, paddingHorizontal: 22 },
    subtitle: { fontSize: 12.5, color: colors.textSoft, paddingHorizontal: 22, marginTop: 4 },
    rowDate: { fontSize: 14, fontWeight: '700', color: colors.espresso },
    rowMeta: { fontSize: 12, color: colors.toffee, marginTop: 2, marginBottom: 8 },
    chip: { alignSelf: 'flex-start', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
    chipText: { fontSize: 11, fontWeight: '700' },
  });
}