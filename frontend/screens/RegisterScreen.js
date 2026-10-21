import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, Pressable } from 'react-native';
import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { AppButton, FormInput } from '../components/Shared';
import { FadeInUp } from '../components/Motion';
import { Vibration } from 'react-native';
import LoadingSpinner from '../components/LoadingSpinner';

const REGISTER_API_URL = 'http://localhost:5000/api/register';

export default function RegisterScreen({ navigation }) {
  const { t } = useLanguage();
  const { login } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const badgeScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.spring(badgeScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }).start();
  }, []);

  const handleRegister = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in every field.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the terms to continue.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(REGISTER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }
      login({ name: data.name, email: data.email, phone: '', photo: null, role: data.role, token: data.token });
      Vibration.vibrate(15);
      navigation.replace('Dashboard');
    } catch (err) {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.badgeNail, { transform: [{ scale: badgeScale }] }]}>
          <View style={styles.badgeHighlight} />
        </Animated.View>
        <Text style={styles.headerBrand}>NAILSCAN</Text>
      </View>

      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <FadeInUp delay={60}><Text style={styles.title}>{t('register_title')}</Text></FadeInUp>

          <FadeInUp delay={100}>
            <FormInput label={t('register_name_label')} placeholder="Juan Dela Cruz" value={name} onChangeText={setName}
              onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} focused={focused === 'name'} />
          </FadeInUp>
          <FadeInUp delay={140}>
            <FormInput label={t('register_email_label')} placeholder="you@email.com" value={email} onChangeText={setEmail}
              onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} focused={focused === 'email'}
              autoCapitalize="none" keyboardType="email-address" />
          </FadeInUp>
          <FadeInUp delay={180}>
            <FormInput label={t('register_password_label')} placeholder="••••••••" value={password} onChangeText={setPassword}
              onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} focused={focused === 'password'}
              secureTextEntry autoCapitalize="none" />
          </FadeInUp>
          <FadeInUp delay={220}>
            <FormInput label={t('register_confirm_label')} placeholder="••••••••" value={confirmPassword} onChangeText={setConfirmPassword}
              onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)} focused={focused === 'confirm'}
              secureTextEntry autoCapitalize="none" />
          </FadeInUp>

          <FadeInUp delay={260}>
            <Pressable style={styles.agreeRow} onPress={() => setAgreed(!agreed)}>
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]} />
              <Text style={styles.agreeText}>{t('register_agree')}</Text>
            </Pressable>
          </FadeInUp>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <FadeInUp delay={300}>
            <AppButton variant="primary" style={{ marginTop: 18 }} onPress={handleRegister}>
              {loading ? <LoadingSpinner size={7} color={colors.cream} /> : t('register_button')}
            </AppButton>
          </FadeInUp>

          <FadeInUp delay={340}>
            <AppButton variant="ghost" onPress={() => navigation.navigate('Login')}>
              {t('register_login_prompt')} {t('register_login_link')}
            </AppButton>
          </FadeInUp>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.chocolate },
  header: { height: '22%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, alignItems: 'center', justifyContent: 'center' },
  badgeNail: { width: 40, height: 52, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: colors.caramel, borderWidth: 1.5, borderColor: colors.sand, overflow: 'hidden', marginBottom: 8 },
  badgeHighlight: { position: 'absolute', top: 5, left: 7, width: 8, height: 18, borderRadius: 8, backgroundColor: 'rgba(245,239,228,0.35)', transform: [{ rotate: '-12deg' }] },
  headerBrand: { color: colors.cream, fontSize: 13, letterSpacing: 2, fontWeight: '600' },
  card: { flex: 1, backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28, paddingHorizontal: 26, paddingTop: 30 },
  title: { fontFamily: 'serif', fontSize: 21, color: colors.espresso, marginBottom: 6 },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 20 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.toffee, marginTop: 1 },
  checkboxChecked: { backgroundColor: colors.chocolate, borderColor: colors.chocolate },
  agreeText: { flex: 1, fontSize: 11.5, color: colors.chocolate, lineHeight: 16 },
  errorText: { color: colors.clay, fontSize: 12.5, marginTop: 14, fontWeight: '600' },
});