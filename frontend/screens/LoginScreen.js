import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Vibration } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { AppButton, FormInput } from '../components/Shared';
import { FadeInUp } from '../components/Motion';
import LoadingSpinner from '../components/LoadingSpinner';

const LOGIN_API_URL = 'http://localhost:5000/api/login';
const TWO_FA_API_URL = 'http://localhost:5000/api/login/2fa';
const GOOGLE_LOGIN_API_URL = 'http://localhost:5000/api/google-login';

// Public (not secret) — from Google Cloud Console step 2.
const WEB_CLIENT_ID = '1082001076425-6bouamracv1ff914koom0f7gsakc0mg3.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  offlineAccess: false,
});

export default function LoginScreen({ navigation }) {
  const { t } = useLanguage();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const badgeScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.spring(badgeScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }).start();
  }, []);

  const goHome = (role) => {
    navigation.replace(role === 'admin' ? 'Admin' : 'Dashboard');
  };

  // Shared by email login, Google login, and the 2FA step.
  const finishLogin = (data) => {
    if (data.requires_2fa) {
      setChallenge(data.challenge);
      setCode('');
      setError('');
      return;
    }
    Vibration.vibrate(15);
    login({ name: data.name, email: data.email, phone: data.phone, photo: data.photo, role: data.role, token: data.token });
    goHome(data.role);
  };

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        return;
      }
      finishLogin(data);
    } catch (err) {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(TWO_FA_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed.');
        // 401 means the sign-in expired or is invalid, so start over.
        if (res.status === 401) {
          setChallenge(null);
          setCode('');
        }
        return;
      }
      finishLogin(data);
    } catch (err) {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    let stage = 'google';
    try {
      await GoogleSignin.hasPlayServices();
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Nothing to sign out of on a first attempt; safe to ignore.
      }
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken || response.idToken;

      if (!idToken) {
        setError('Google worked, but no token came back.');
        return;
      }

      stage = 'backend';
      const res = await fetch(GOOGLE_LOGIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 403 ? data.error : `Backend said: ${data.error || res.status}`);
        return;
      }
      finishLogin(data);
    } catch (err) {
      console.log('GOOGLE SIGN-IN ERROR:', stage, err.code, err.message);
      if (err.code !== 'SIGN_IN_CANCELLED' && err.code !== '-5') {
        setError(`Failed at ${stage} step (${err.code || 'no code'}): ${err.message}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const backToLogin = () => {
    setChallenge(null);
    setCode('');
    setError('');
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
        {challenge ? (
          <>
            <FadeInUp delay={60}><Text style={styles.title}>Two-step verification</Text></FadeInUp>
            <FadeInUp delay={100}>
              <Text style={styles.subtitle}>Open your authenticator app and enter the 6-digit code for NailScan.</Text>
            </FadeInUp>
            <FadeInUp delay={140}>
              <FormInput
                label="Code" placeholder="123456" value={code} keyboardType="number-pad" maxLength={6}
                onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))}
                onFocus={() => setFocused('code')} onBlur={() => setFocused(null)} focused={focused === 'code'}
              />
            </FadeInUp>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <FadeInUp delay={180}>
              <AppButton variant="primary" style={{ marginTop: 20 }} onPress={verifying ? () => {} : handleVerify}>
                {verifying ? <LoadingSpinner size={7} color={colors.cream} /> : 'Verify'}
              </AppButton>
            </FadeInUp>
            <FadeInUp delay={220}>
              <AppButton variant="ghost" onPress={backToLogin}>Back to log in</AppButton>
            </FadeInUp>
          </>
        ) : (
          <>
            <FadeInUp delay={80}><Text style={styles.title}>{t('login_title')}</Text></FadeInUp>

            <FadeInUp delay={140}>
              <FormInput
                label={t('login_email_label')} placeholder="you@email.com" value={email} onChangeText={setEmail}
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} focused={focused === 'email'}
                autoCapitalize="none"
              />
            </FadeInUp>

            <FadeInUp delay={200}>
              <FormInput
                label={t('login_password_label')} placeholder="••••••••" value={password} onChangeText={setPassword}
                onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} focused={focused === 'password'}
                secureTextEntry
                autoCapitalize="none"
              />
            </FadeInUp>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <FadeInUp delay={260}>
              <AppButton variant="primary" style={{ marginTop: 20 }} onPress={handleLogin}>
                {loading ? <LoadingSpinner size={7} color={colors.cream} /> : t('login_button')}
              </AppButton>
            </FadeInUp>

            <FadeInUp delay={300}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <AppButton variant="secondary" onPress={handleGoogleLogin}>
                {googleLoading ? <LoadingSpinner size={7} color={colors.espresso} /> : 'Continue with Google'}
              </AppButton>
            </FadeInUp>

            <FadeInUp delay={340}>
              <AppButton variant="ghost" onPress={() => navigation.navigate('Register')}>
                {t('login_signup_prompt')} {t('login_signup_link')}
              </AppButton>
            </FadeInUp>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.chocolate },
  header: { height: '34%', borderBottomLeftRadius: 44, borderBottomRightRadius: 44, alignItems: 'center', justifyContent: 'center' },
  badgeNail: { width: 46, height: 60, borderTopLeftRadius: 23, borderTopRightRadius: 23, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, backgroundColor: colors.caramel, borderWidth: 1.5, borderColor: colors.sand, overflow: 'hidden', marginBottom: 12 },
  badgeHighlight: { position: 'absolute', top: 6, left: 8, width: 10, height: 22, borderRadius: 10, backgroundColor: 'rgba(245,239,228,0.35)', transform: [{ rotate: '-12deg' }] },
  headerBrand: { color: colors.cream, fontSize: 14, letterSpacing: 2, fontWeight: '600' },
  card: { flex: 1, backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28, paddingHorizontal: 26, paddingTop: 34 },
  title: { fontFamily: 'serif', fontSize: 24, color: colors.espresso, marginBottom: 10 },
  subtitle: { fontSize: 13, color: colors.textSoft, lineHeight: 19, marginBottom: 6 },
  errorText: { color: colors.clay, fontSize: 12.5, marginTop: 14, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.sand },
  dividerText: { fontSize: 11.5, color: colors.toffee, marginHorizontal: 10, fontWeight: '600' },
});