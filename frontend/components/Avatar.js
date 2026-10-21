import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ size = 40, fontSize = 13 }) {
  const { colors } = useTheme();
  const { user } = useUser();

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.chocolate,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (user?.photo) {
    return (
      <View style={containerStyle}>
        <Image source={{ uri: user.photo }} style={{ width: size, height: size }} />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Text style={{ color: colors.cream, fontSize, fontWeight: '700' }}>{getInitials(user?.name)}</Text>
    </View>
  );
}