import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ChatBotProvider } from './context/ChatBotContext';
import { UserProvider, useUser } from './context/UserContext';
import ChatBotBubble from './components/ChatBotBubble';
import ChatBotPanel from './components/ChatBotPanel';
import AdminScreen from './screens/AdminScreen';

import OnboardingScreen from './screens/OnboardingScreen';
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainTabs from './screens/MainTabs';
import ScanScreen from './screens/ScanScreen';
import ResultsScreen from './screens/ResultsScreen';
import NotificationsFeedScreen from './screens/NotificationsFeedScreen';
import PersonalInfoScreen from './screens/PersonalInfoScreen';
import SecurityScreen from './screens/SecurityScreen';
import NotificationsSettingsScreen from './screens/NotificationsSettingsScreen';
import PreferencesScreen from './screens/PreferencesScreen';

const Stack = createNativeStackNavigator();

// Hides the chatbot for admin accounts. Must be its own component so it can
// call useUser() from inside UserProvider.
function ChatBotLayer() {
  const { user } = useUser();
  if (user?.role === 'admin') return null;
  return (
    <>
      <ChatBotBubble />
      <ChatBotPanel />
    </>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then((value) => {
      setInitialRoute(value === 'true' ? 'Landing' : 'Onboarding');
    });
  }, []);

  if (!initialRoute) {
    // Brief check while AsyncStorage loads — effectively instant, so a blank
    // chocolate-colored view avoids a white flash without needing a spinner.
    return <View style={{ flex: 1, backgroundColor: '#4C2F1E' }} />;
  }

  return (
    <UserProvider>
      <LanguageProvider>
        <ThemeProvider>
          <ChatBotProvider>
            <View style={styles.root}>
              <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
                  <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                  <Stack.Screen name="Landing" component={LandingScreen} />
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Register" component={RegisterScreen} />
                  <Stack.Screen name="Dashboard" component={MainTabs} />
                  <Stack.Screen name="Scan" component={ScanScreen} />
                  <Stack.Screen name="Results" component={ResultsScreen} />
                  <Stack.Screen name="NotificationsFeed" component={NotificationsFeedScreen} />
                  <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
                  <Stack.Screen name="Security" component={SecurityScreen} />
                  <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
                  <Stack.Screen name="Preferences" component={PreferencesScreen} />
                  <Stack.Screen name="Admin" component={AdminScreen} />
                </Stack.Navigator>
              </NavigationContainer>
              <ChatBotLayer />
            </View>
          </ChatBotProvider>
        </ThemeProvider>
      </LanguageProvider>
    </UserProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });