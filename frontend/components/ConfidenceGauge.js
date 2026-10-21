import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const TICK_COUNT = 24;
const ARC_START = -225; // degrees
const ARC_END = 45;

export default function ConfidenceGauge({ percent = 0, color, size = 140 }) {
  const { colors } = useTheme();
  const fillColor = color || colors.clay;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: percent, duration: 900, useNativeDriver: false }).start();
  }, [percent]);

  const [animatedPercent, setAnimatedPercent] = React.useState(0);
  useEffect(() => {
    const id = anim.addListener(({ value }) => setAnimatedPercent(value));
    return () => anim.removeListener(id);
  }, []);

  const litCount = Math.round((animatedPercent / 100) * TICK_COUNT);
  const radius = size / 2;
  const tickLength = size * 0.12;
  const tickWidth = 3;

  const ticks = Array.from({ length: TICK_COUNT }).map((_, i) => {
    const angleDeg = ARC_START + (i / (TICK_COUNT - 1)) * (ARC_END - ARC_START);
    const angleRad = (angleDeg * Math.PI) / 180;
    const innerR = radius - tickLength - 4;
    const x = radius + innerR * Math.cos(angleRad) - tickWidth / 2;
    const y = radius + innerR * Math.sin(angleRad) - tickWidth / 2;
    const isLit = i < litCount;

    return (
      <View
        key={i}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: tickWidth,
          height: tickLength,
          borderRadius: tickWidth / 2,
          backgroundColor: isLit ? fillColor : colors.creamAlt,
          transform: [{ rotate: `${angleDeg + 90}deg` }],
        }}
      />
    );
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {ticks}
      <Text style={[styles.percentText, { color: colors.espresso }]}>{Math.round(animatedPercent)}%</Text>
      <Text style={[styles.label, { color: colors.toffee }]}>confidence</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  percentText: { fontSize: 26, fontWeight: '700' },
  label: { fontSize: 11, marginTop: -2 },
});