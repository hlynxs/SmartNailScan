import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { GlassCard } from '../components/Shared';
import { FadeInUp } from '../components/Motion';

const topics = [
  { title: 'Onychomycosis', desc: 'A fungal infection that can thicken, discolor, or crumble the nail over time.' },
  { title: 'Leukonychia', desc: 'White spots or streaks in the nail, often from minor trauma to the nail bed.' },
  { title: "Beau's Lines", desc: 'Horizontal ridges that can follow illness, injury, or nutritional changes.' },
  { title: 'Koilonychia', desc: 'A spoon-shaped nail that curves inward, sometimes linked to iron levels.' },
  { title: 'Nail polish & nail art', desc: 'Frequent use without breaks can trap moisture and weaken the nail plate.' },
];

export default function LearnScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = makeStyles(colors);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 20 }}>
      <FadeInUp delay={0}>
        <Text style={styles.title}>{t('learn_title')}</Text>
        <Text style={styles.subtitle}>{t('learn_subtitle')}</Text>
      </FadeInUp>
      <View style={{ paddingHorizontal: 22, gap: 12, marginTop: 18 }}>
        {topics.map((tp, i) => (
          <FadeInUp key={tp.title} delay={80 + i * 60}>
            <GlassCard>
              <Text style={styles.cardTitle}>{tp.title}</Text>
              <Text style={styles.cardDesc}>{tp.desc}</Text>
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
    cardTitle: { fontSize: 14.5, fontWeight: '700', color: colors.espresso, marginBottom: 4 },
    cardDesc: { fontSize: 12.5, color: colors.toffee, lineHeight: 18 },
  });
}