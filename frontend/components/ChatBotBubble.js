import React, { useEffect, useRef } from 'react';
import { Pressable, View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useChatBot } from '../context/ChatBotContext';

export default function ChatBotBubble() {
  const { colors } = useTheme();
  const { open, setOpen } = useChatBot();
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [bounce]);

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });

  if (open) return null;

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY }] }]} pointerEvents="box-none">
      <Pressable style={[styles.bubble, { backgroundColor: colors.chocolate, borderColor: colors.sand }]} onPress={() => setOpen(true)}>
        <View style={styles.face}>
          <View style={[styles.eye, { backgroundColor: colors.cream }]} />
          <View style={[styles.eye, { backgroundColor: colors.cream }]} />
        </View>
        <View style={[styles.smile, { borderColor: colors.cream }]} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 100, right: 20, zIndex: 50 },
  bubble: {
    width: 58, height: 58, borderRadius: 29, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  face: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  eye: { width: 6, height: 6, borderRadius: 3 },
  smile: { width: 14, height: 7, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderWidth: 1.5, borderTopWidth: 0 },
});