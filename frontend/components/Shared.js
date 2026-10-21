import React, { useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function GlassCard({ children, style }) {
  const { colors } = useTheme();
  return <View style={[makeStyles(colors).glassCard, style]}>{children}</View>;
}

export function PressableCard({ children, onPress, style }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[styles.glassCard, style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function AppButton({ children, onPress, variant = 'primary', style }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        style={[
          styles.btnBase,
          variant === 'primary' && styles.btnPrimary,
          variant === 'secondary' && styles.btnSecondary,
          variant === 'ghost' && styles.btnGhost,
          style,
          { transform: [{ scale }] },
        ]}
      >
        <Text
          style={[
            styles.btnText,
            variant === 'primary' && styles.btnTextPrimary,
            variant === 'secondary' && styles.btnTextSecondary,
            variant === 'ghost' && styles.btnTextGhost,
          ]}
        >
          {children}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function FormInput({ label, focused, onFocus, onBlur, ...props }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const underline = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(underline, { toValue: focused ? 1 : 0, duration: 220, useNativeDriver: false }).start();
  }, [focused]);
  const width = underline.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ marginTop: 16 }}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput style={styles.input} placeholderTextColor={colors.toffee} onFocus={onFocus} onBlur={onBlur} {...props} />
      <View style={styles.underlineTrack}>
        <Animated.View style={[styles.underlineFill, { width }]} />
      </View>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    glassCard: {
      backgroundColor: colors.creamAlt,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.toffee,
      padding: 20,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    btnBase: { borderRadius: 100, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
    btnPrimary: { backgroundColor: colors.chocolate },
    btnSecondary: { backgroundColor: colors.creamAlt, borderWidth: 1, borderColor: colors.toffee },
    btnGhost: { backgroundColor: 'transparent' },
    btnText: { fontWeight: '700', fontSize: 13 },
    btnTextPrimary: { color: colors.cream },
    btnTextSecondary: { color: colors.espresso },
    btnTextGhost: { color: colors.caramel },
    inputLabel: { fontSize: 12, fontWeight: '600', color: colors.espresso, marginBottom: 6 },
    input: { fontSize: 14, color: colors.espresso, paddingVertical: 8, paddingHorizontal: 2 },
    underlineTrack: { height: 1.5, backgroundColor: colors.toffee, marginTop: 2, borderRadius: 2 },
    underlineFill: { height: 1.5, backgroundColor: colors.chocolate, borderRadius: 2 },
  });
}