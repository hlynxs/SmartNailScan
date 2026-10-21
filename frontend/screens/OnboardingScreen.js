import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

function NailMotif() {
  return (
    <View style={styles.motifWrap}>
      <View style={styles.nailGlow} />
      <View style={styles.nail}>
        <View style={styles.nailHighlight} />
      </View>
    </View>
  );
}

function ScanMotif() {
  return (
    <View style={styles.motifWrap}>
      <View style={styles.scanRingOuter} />
      <View style={styles.scanRingInner}>
        <View style={styles.scanDot} />
      </View>
    </View>
  );
}

function TrackMotif() {
  return (
    <View style={styles.motifWrap}>
      <View style={styles.trackBarsRow}>
        <View style={[styles.trackBar, { height: 30 }]} />
        <View style={[styles.trackBar, { height: 50 }]} />
        <View style={[styles.trackBar, { height: 40 }]} />
        <View style={[styles.trackBar, { height: 65 }]} />
      </View>
    </View>
  );
}

const slides = [
  {
    Motif: NailMotif,
    title: 'Position your nail',
    desc: 'Use a phone stabilizer and macro lens to capture a clear, close-up shot of your nail.',
  },
  {
    Motif: ScanMotif,
    title: 'Get an instant read',
    desc: 'Each nail is analyzed on the spot, showing a detected condition and a confidence score.',
  },
  {
    Motif: TrackMotif,
    title: 'Track changes over time',
    desc: 'Every scan is saved to your nail profile, so you can watch how things change.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.replace('Landing');
  };

  const handleNext = () => {
    if (index === slides.length - 1) {
      finishOnboarding();
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (e) => {
        const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
        setIndex(newIndex);
      },
    }
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.skipBtn} onPress={finishOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide) => (
          <View key={slide.title} style={styles.slide}>
            <slide.Motif />
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.desc}>{slide.desc}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [width * (i - 1), width * i, width * (i + 1)],
              outputRange: [8, 22, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [width * (i - 1), width * i, width * (i + 1)],
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
              />
            );
          })}
        </View>

        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>{index === slides.length - 1 ? 'Get started' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.chocolate },
  skipBtn: { position: 'absolute', top: 54, right: 24, zIndex: 10, padding: 8 },
  skipText: { color: colors.sand, fontSize: 13, fontWeight: '600' },
  slide: { width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  motifWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 36 },

  nailGlow: { position: 'absolute', width: 130, height: 160, borderRadius: 65, backgroundColor: colors.sand, opacity: 0.2 },
  nail: {
    width: 96, height: 128, borderTopLeftRadius: 48, borderTopRightRadius: 48,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    backgroundColor: colors.caramel, borderWidth: 1.5, borderColor: colors.sand, overflow: 'hidden',
  },
  nailHighlight: {
    position: 'absolute', top: 10, left: 14, width: 22, height: 46,
    borderRadius: 20, backgroundColor: 'rgba(245,239,228,0.35)', transform: [{ rotate: '-12deg' }],
  },

  scanRingOuter: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 1.5, borderColor: 'rgba(220,199,163,0.35)' },
  scanRingInner: { width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, borderColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  scanDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.sand, opacity: 0.25 },

  trackBarsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, height: 80 },
  trackBar: { width: 18, borderRadius: 9, backgroundColor: colors.caramel, borderWidth: 1.5, borderColor: colors.sand },

  title: { fontFamily: 'serif', fontSize: 24, color: colors.cream, textAlign: 'center', marginBottom: 12 },
  desc: { fontSize: 13.5, color: colors.sand, textAlign: 'center', lineHeight: 20 },

  footer: { paddingHorizontal: 28, paddingBottom: 40, paddingTop: 10, alignItems: 'center' },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 22 },
  dot: { height: 8, borderRadius: 4, backgroundColor: colors.cream },
  nextBtn: { backgroundColor: colors.cream, borderRadius: 100, paddingVertical: 15, width: '100%', alignItems: 'center' },
  nextText: { color: colors.espresso, fontWeight: '700', fontSize: 15 },
});