import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import BackHeader from '../components/BackHeader';
import { GlassCard } from '../components/Shared';

export default function NotificationsSettingsScreen({ navigation }) {
  const { t } = useLanguage();
  const [scanReminders, setScanReminders] = useState(true);
  const [healthTips, setHealthTips] = useState(true);
  const [resultAlerts, setResultAlerts] = useState(true);

  const Row = ({ title, desc, value, onValueChange }) => (
    <GlassCard style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.creamAlt, true: colors.caramel }} thumbColor={colors.cream} />
    </GlassCard>
  );

  return (
    <View style={styles.screen}>
      <BackHeader title={t('notifsettings_title')} onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: 22, gap: 12 }}>
        <Row title={t('notifsettings_reminders_title')} desc={t('notifsettings_reminders_desc')} value={scanReminders} onValueChange={setScanReminders} />
        <Row title={t('notifsettings_tips_title')} desc={t('notifsettings_tips_desc')} value={healthTips} onValueChange={setHealthTips} />
        <Row title={t('notifsettings_alerts_title')} desc={t('notifsettings_alerts_desc')} value={resultAlerts} onValueChange={setResultAlerts} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 13.5, fontWeight: '700', color: colors.espresso },
  desc: { fontSize: 11.5, color: colors.toffee, marginTop: 2, paddingRight: 10 },
});