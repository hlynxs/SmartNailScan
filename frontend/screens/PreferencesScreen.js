import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import BackHeader from '../components/BackHeader';
import { GlassCard } from '../components/Shared';

export default function PreferencesScreen({ navigation }) {
  const { colors, mode, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const styles = makeStyles(colors);

  return (
    <View style={styles.screen}>
      <BackHeader title={t('preferences_title')} onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: 22, gap: 12 }}>
        <GlassCard>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('preferences_darkmode_title')}</Text>
              <Text style={styles.desc}>{t('preferences_darkmode_desc')}</Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.creamAlt, true: colors.caramel }}
              thumbColor={colors.cream}
            />
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={styles.title}>{t('preferences_language_title')}</Text>
          <Text style={styles.desc}>{t('preferences_language_desc')}</Text>
          <View style={styles.pillRow}>
            <Pressable style={[styles.pill, language === 'en' && styles.pillActive]} onPress={() => setLanguage('en')}>
              <Text style={[styles.pillText, language === 'en' && styles.pillTextActive]}>{t('preferences_lang_en')}</Text>
            </Pressable>
            <Pressable style={[styles.pill, language === 'fil' && styles.pillActive]} onPress={() => setLanguage('fil')}>
              <Text style={[styles.pillText, language === 'fil' && styles.pillTextActive]}>{t('preferences_lang_fil')}</Text>
            </Pressable>
          </View>
        </GlassCard>
      </View>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream },
    row: { flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 13.5, fontWeight: '700', color: colors.espresso, marginBottom: 4 },
    desc: { fontSize: 11.5, color: colors.toffee, marginBottom: 14 },
    pillRow: { flexDirection: 'row', gap: 10 },
    pill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100, borderWidth: 1, borderColor: colors.toffee },
    pillActive: { backgroundColor: colors.chocolate, borderColor: colors.chocolate },
    pillText: { fontSize: 12.5, fontWeight: '600', color: colors.espresso },
    pillTextActive: { color: colors.cream },
  });
}