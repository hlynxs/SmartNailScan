import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import BottomNavBar from '../components/BottomNavBar';
import DashboardScreen from './DashboardScreen';
import ProfileScreen from './ProfileScreen';

export default function MainTabs({ navigation }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState('home');

  const handleTabChange = (key) => {
    if (key === 'scan') {
      navigation.navigate('Scan');
      return;
    }
    setTab(key);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cream }]}>
      <View style={{ flex: 1 }}>
        {tab === 'home' && (
          <DashboardScreen navigation={navigation} onOpenProfile={() => setTab('profile')} />
        )}
        {tab === 'profile' && <ProfileScreen navigation={navigation} />}
      </View>
      <BottomNavBar active={tab} onChange={handleTabChange} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });