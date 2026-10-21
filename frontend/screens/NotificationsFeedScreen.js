import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import BackHeader from '../components/BackHeader';
import { GlassCard, AppButton } from '../components/Shared';

const initial = [
  { id: 1, title: 'Time for your monthly scan', body: "It's been 30 days since your last check.", unread: true },
  { id: 2, title: 'Scan result ready', body: 'Your Sep 17 scan finished analyzing.', unread: true },
  { id: 3, title: 'New article: caring for brittle nails', body: 'A short guide based on your scan history.', unread: false },
];

export default function NotificationsFeedScreen({ navigation }) {
  const { t } = useLanguage();
  const [items, setItems] = useState(initial);

  return (
    <View style={styles.screen}>
      <BackHeader title={t('notifications_title')} onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: 22, marginBottom: 10 }}>
        <AppButton variant="ghost" onPress={() => setItems(items.map((i) => ({ ...i, unread: false })))}>
          {t('notifications_markallread')}
        </AppButton>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, gap: 10 }}>
        {items.map((n) => (
          <Pressable key={n.id} onPress={() => setItems(items.map((i) => (i.id === n.id ? { ...i, unread: false } : i)))}>
            <GlassCard style={n.unread && styles.unreadCard}>
              <View style={styles.rowTop}>
                {n.unread && <View style={styles.dot} />}
                <Text style={styles.itemTitle}>{n.title}</Text>
              </View>
              <Text style={styles.itemBody}>{n.body}</Text>
            </GlassCard>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  unreadCard: { borderColor: colors.caramel },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.clay },
  itemTitle: { fontSize: 13.5, fontWeight: '700', color: colors.espresso },
  itemBody: { fontSize: 12, color: colors.chocolate, lineHeight: 17 },
});