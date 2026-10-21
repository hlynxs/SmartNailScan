import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

function Dot({ delay, color, size }) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 320, useNativeDriver: true }),
        Animated.delay(400),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <Animated.View
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: color,
        transform: [{ translateY }],
      }}
    />
  );
}

export default function LoadingSpinner({ size = 8, gap = 6, color }) {
  const { colors } = useTheme();
  const dotColor = color || colors.chocolate;

  return (
    <View style={[styles.row, { gap }]}>
      <Dot delay={0} color={dotColor} size={size} />
      <Dot delay={120} color={dotColor} size={size} />
      <Dot delay={240} color={dotColor} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});