import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { GlassCard, AppButton } from '../components/Shared';
import { FadeInUp } from '../components/Motion';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';

const EDUCATION_API_URL = 'http://localhost:5000/api/education';

// Shown only if the server can't be reached and nothing was loaded yet.
const DEFAULT_TIPS = [
  { id: 'd1', title: 'Onychomycosis', description: 'A fungal infection that can thicken, discolor, or crumble the nail over time.' },
  { id: 'd2', title: 'Leukonychia', description: 'White spots or streaks in the nail, often from minor trauma to the nail bed.' },
  { id: 'd3', title: "Beau's lines", description: 'Horizontal ridges that can follow illness, injury, or nutritional changes.' },
  { id: 'd4', title: 'Koilonychia', description: 'A spoon-shaped nail that curves inward, sometimes linked to iron levels.' },
  { id: 'd5', title: 'Nail polish and nail art', description: 'Frequent use without breaks can trap moisture and weaken the nail plate.' },
];

function firstName(fullName) {
  if (!fullName) return '';
  return fullName.trim().split(' ')[0];
}

export default function DashboardScreen({ navigation, onOpenProfile }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { user } = useUser();
  const styles = makeStyles(colors);

  const [tips, setTips] = useState(null);
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadTips = useCallback(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(EDUCATION_API_URL, { signal: controller.signal });
      if (!res.ok) throw new Error('Bad response');
      const list = await res.json();
      setTips(list);
      setOffline(false);
    } catch (e) {
      setTips((prev) => prev || DEFAULT_TIPS);
      setOffline(true);
    } finally {
      clearTimeout(timer);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTips();
  }, [loadTips]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTips();
  };

  const pick = (tip) =>
    language === 'fil' && tip.title_fil && tip.description_fil
      ? { title: tip.title_fil, desc: tip.description_fil }
      : { title: tip.title, desc: tip.description };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.chocolate}
          colors={[colors.caramel]}
        />
      }
    >
      <FadeInUp delay={0}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi{user?.name ? `, ${firstName(user.name)}` : ''} 👋</Text>
            <Text style={styles.headerSubtitle}>Here's what's worth knowing about your nails today.</Text>
          </View>
          <View style={styles.headerIcons}>
            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('NotificationsFeed')}>
              <View style={styles.bellShape} />
              <View style={styles.bellDot} />
            </Pressable>
            <Pressable onPress={onOpenProfile}>
              <Avatar size={40} fontSize={13} />
            </Pressable>
          </View>
        </View>
      </FadeInUp>

      <FadeInUp delay={60}>
        <GlassCard style={styles.scanCard}>
          <View style={styles.scanCardIcon}>
            <View style={styles.scanLens} />
          </View>
          <Text style={styles.scanCardTitle}>Ready for a check-in?</Text>
          <Text style={styles.scanCardDesc}>
            A scan takes under a minute and gives you an early read on how your nails are doing.
          </Text>
          <AppButton variant="primary" style={{ marginTop: 14 }} onPress={() => navigation.navigate('Scan')}>
            Start a scan
          </AppButton>
        </GlassCard>
      </FadeInUp>

      <FadeInUp delay={120}>
        <Text style={styles.sectionTitle}>Nail health tips</Text>
        <Text style={styles.sectionSubtitle}>Learn about common nail conditions and care.</Text>
        {offline ? <Text style={styles.offlineNote}>Couldn't refresh. Pull down to try again.</Text> : null}
      </FadeInUp>

      {tips === null ? (
        <View style={styles.loadingWrap}>
          <LoadingSpinner size={8} />
        </View>
      ) : tips.length === 0 ? (
        <View style={{ paddingHorizontal: 22, marginTop: 12 }}>
          <GlassCard>
            <Text style={styles.tipDesc}>No tips right now. Check back soon.</Text>
          </GlassCard>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 22, gap: 12, marginTop: 12 }}>
          {tips.map((tip, i) => {
            const text = pick(tip);
            return (
              <FadeInUp key={tip.id} delay={160 + i * 60}>
                <GlassCard>
                  <Text style={styles.tipTitle}>{text.title}</Text>
                  <Text style={styles.tipDesc}>{text.desc}</Text>
                </GlassCard>
              </FadeInUp>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 22, paddingTop: 54, paddingBottom: 18 },
    greeting: { fontFamily: 'serif', fontSize: 22, color: colors.espresso },
    headerSubtitle: { fontSize: 12.5, color: colors.textSoft, marginTop: 4, maxWidth: 220 },
    headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.creamAlt, alignItems: 'center', justifyContent: 'center' },
    bellShape: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.chocolate, borderBottomWidth: 0, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
    bellDot: { position: 'absolute', top: 8, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.clay },
    scanCard: { marginHorizontal: 22, alignItems: 'flex-start', marginBottom: 8 },
    scanCardIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.creamAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    scanLens: { width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: colors.caramel },
    scanCardTitle: { fontSize: 15.5, fontWeight: '700', color: colors.espresso, marginBottom: 4 },
    scanCardDesc: { fontSize: 12.5, color: colors.toffee, lineHeight: 18 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.espresso, paddingHorizontal: 22, marginTop: 22 },
    sectionSubtitle: { fontSize: 12, color: colors.toffee, paddingHorizontal: 22, marginTop: 2 },
    offlineNote: { fontSize: 11.5, color: colors.clay, paddingHorizontal: 22, marginTop: 6 },
    loadingWrap: { paddingTop: 30, alignItems: 'center' },
    tipTitle: { fontSize: 14, fontWeight: '700', color: colors.espresso, marginBottom: 4 },
    tipDesc: { fontSize: 12.5, color: colors.toffee, lineHeight: 18 },
  });
}