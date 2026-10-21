import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { GlassCard, AppButton } from '../components/Shared';
import { FadeInUp } from '../components/Motion';

function NailMark({ size = 34 }) {
  return (
    <View style={{
      width: size * 0.75, height: size,
      borderTopLeftRadius: size * 0.4, borderTopRightRadius: size * 0.4,
      borderBottomLeftRadius: size * 0.25, borderBottomRightRadius: size * 0.25,
      backgroundColor: colors.caramel, borderWidth: 1.5, borderColor: colors.sand, overflow: 'hidden',
    }}>
      <View style={{
        position: 'absolute', top: size * 0.12, left: size * 0.14,
        width: size * 0.18, height: size * 0.4, borderRadius: size * 0.2,
        backgroundColor: 'rgba(245,239,228,0.35)', transform: [{ rotate: '-12deg' }],
      }} />
    </View>
  );
}

function CaptureMark() {
  return <View style={styles.markBox}><View style={styles.captureLens} /></View>;
}
function AnalysisMark() {
  return (
    <View style={[styles.markBox, { flexDirection: 'row', alignItems: 'flex-end', gap: 4 }]}>
      <View style={[styles.bar, { height: 10 }]} />
      <View style={[styles.bar, { height: 18 }]} />
      <View style={[styles.bar, { height: 14 }]} />
    </View>
  );
}
function TrackingMark() {
  return (
    <View style={styles.markBox}>
      <View style={styles.trackLineBack} />
      <View style={styles.trackLineFront} />
    </View>
  );
}

export default function LandingScreen({ navigation }) {
  const { t } = useLanguage();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.85] });

  const features = [
    { title: t('landing_feature1_title'), desc: t('landing_feature1_desc'), Mark: CaptureMark },
    { title: t('landing_feature2_title'), desc: t('landing_feature2_desc'), Mark: AnalysisMark },
    { title: t('landing_feature3_title'), desc: t('landing_feature3_desc'), Mark: TrackingMark },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 48 }}>
      <FadeInUp delay={0}>
        <View style={styles.nav}>
          <View style={styles.navBrand}>
            <NailMark size={26} />
            <Text style={styles.navBrandText}>NailScan</Text>
          </View>
          <View style={styles.navActions}>
            <AppButton variant="ghost" onPress={() => navigation.navigate('Login')}>{t('landing_login')}</AppButton>
            <AppButton variant="primary" onPress={() => navigation.navigate('Register')}>{t('landing_getstarted')}</AppButton>
          </View>
        </View>
      </FadeInUp>

      <View style={styles.hero}>
        <FadeInUp delay={60}>
          <Animated.View style={[styles.pill, { opacity: glowOpacity }]}>
            <View style={styles.pillDot} />
            <Text style={styles.pillText}>{t('landing_pill')}</Text>
          </Animated.View>
        </FadeInUp>

        <FadeInUp delay={120}>
          <Text style={styles.heroTitle}>{t('landing_title')}</Text>
        </FadeInUp>
        <FadeInUp delay={180}>
          <Text style={styles.heroSubtitle}>{t('landing_subtitle')}</Text>
        </FadeInUp>
        <FadeInUp delay={240}>
          <View style={styles.heroActions}>
            <AppButton variant="primary" onPress={() => navigation.navigate('Register')}>{t('landing_cta_start')}</AppButton>
            <AppButton variant="secondary">{t('landing_cta_learn')}</AppButton>
          </View>
        </FadeInUp>
      </View>

      <View style={styles.features}>
        {features.map((f, i) => (
          <FadeInUp key={f.title} delay={280 + i * 70}>
            <GlassCard>
              <f.Mark />
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </GlassCard>
          </FadeInUp>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 54, paddingBottom: 10 },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBrandText: { fontSize: 16, fontWeight: '700', color: colors.espresso },
  navActions: { flexDirection: 'row', gap: 6 },
  hero: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.creamAlt, borderWidth: 1, borderColor: colors.sand, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 18 },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.caramel, marginRight: 8 },
  pillText: { fontSize: 11, fontWeight: '600', color: colors.chocolate },
  heroTitle: { fontFamily: 'serif', fontSize: 34, lineHeight: 40, color: colors.espresso, marginBottom: 12 },
  heroSubtitle: { fontSize: 14, lineHeight: 21, color: colors.textSoft, marginBottom: 22 },
  heroActions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  features: { paddingHorizontal: 22, gap: 14 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: colors.espresso, marginTop: 12, marginBottom: 4 },
  featureDesc: { fontSize: 13, color: colors.chocolate, lineHeight: 19 },
  markBox: { width: 44, height: 34, justifyContent: 'center' },
  captureLens: { width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: colors.caramel },
  bar: { width: 8, borderRadius: 4, backgroundColor: colors.caramel },
  trackLineBack: { position: 'absolute', width: 34, height: 2, backgroundColor: colors.sand, top: 20, transform: [{ rotate: '-20deg' }] },
  trackLineFront: { position: 'absolute', width: 20, height: 2, backgroundColor: colors.caramel, top: 8, left: 14, transform: [{ rotate: '-20deg' }] },
});