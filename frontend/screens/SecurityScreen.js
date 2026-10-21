import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, Linking } from 'react-native';
import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import BackHeader from '../components/BackHeader';
import { FormInput, AppButton, GlassCard } from '../components/Shared';
import LoadingSpinner from '../components/LoadingSpinner';

const API = 'http://localhost:5000/api/security';

async function call(path, token, method = 'GET', body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function explain(e) {
  if (e.status) return e.message;
  return 'Could not reach the server. Check your connection and try again.';
}

export default function SecurityScreen({ navigation }) {
  const { t } = useLanguage();
  const { user, updateUser } = useUser();
  const token = user?.token;

  const [status, setStatus] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [focused, setFocused] = useState(null);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const [panel, setPanel] = useState(null); // 'setup' | 'disable' | null
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState('');
  const [tfError, setTfError] = useState('');
  const [tfBusy, setTfBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await call('/status', token));
      setLoadError('');
    } catch (e) {
      setLoadError(
        e.status === 401 || e.status === 403 ? 'Your session has ended. Please log in again.' : explain(e),
      );
    }
  }, [token]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handlePassword = async () => {
    setPwError('');
    if (status.has_password && !current) {
      setPwError('Enter your current password.');
      return;
    }
    if (next.length < 8) {
      setPwError('The new password must be at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setPwError('The new passwords do not match.');
      return;
    }
    setPwBusy(true);
    try {
      const data = await call('/password', token, 'POST', { current_password: current, new_password: next });
      updateUser({ token: data.token });
      setStatus((s) => ({ ...s, has_password: true }));
      setCurrent('');
      setNext('');
      setConfirm('');
      Alert.alert('Password updated', 'Your other devices have been signed out.');
    } catch (e) {
      setPwError(explain(e));
    } finally {
      setPwBusy(false);
    }
  };

  const startSetup = async () => {
    setTfError('');
    setCode('');
    setTfBusy(true);
    try {
      const data = await call('/2fa/setup', token, 'POST');
      setSetup(data);
      setPanel('setup');
    } catch (e) {
      Alert.alert('Could not start setup', explain(e));
    } finally {
      setTfBusy(false);
    }
  };

  const confirmEnable = async () => {
    setTfError('');
    if (code.length !== 6) {
      setTfError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setTfBusy(true);
    try {
      await call('/2fa/enable', token, 'POST', { code });
      setStatus((s) => ({ ...s, two_factor_enabled: true }));
      setPanel(null);
      setSetup(null);
      setCode('');
      Alert.alert('Two-factor authentication is on', 'You will be asked for a code each time you log in.');
    } catch (e) {
      setTfError(explain(e));
    } finally {
      setTfBusy(false);
    }
  };

  const confirmDisable = async () => {
    setTfError('');
    if (code.length !== 6) {
      setTfError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setTfBusy(true);
    try {
      await call('/2fa/disable', token, 'POST', { code });
      setStatus((s) => ({ ...s, two_factor_enabled: false }));
      setPanel(null);
      setCode('');
      Alert.alert('Two-factor authentication is off');
    } catch (e) {
      setTfError(explain(e));
    } finally {
      setTfBusy(false);
    }
  };

  const cancelPanel = () => {
    setPanel(null);
    setSetup(null);
    setCode('');
    setTfError('');
  };

  const handleToggle = (value) => {
    setTfError('');
    setCode('');
    if (value) {
      if (!status.two_factor_enabled) startSetup();
    } else if (status.two_factor_enabled) {
      setPanel('disable');
    } else {
      cancelPanel();
    }
  };

  const openAuthenticator = () => {
    Linking.openURL(setup.otpauth_uri).catch(() =>
      Alert.alert(
        'No authenticator app found',
        'Install Google Authenticator (or a similar app), then add the account with the setup key shown here.',
      ),
    );
  };

  if (!status) {
    return (
      <View style={styles.screen}>
        <BackHeader title={t('security_title')} onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          {loadError ? (
            <>
              <Text style={styles.errorText}>{loadError}</Text>
              <AppButton variant="secondary" style={{ marginTop: 14 }} onPress={loadStatus}>
                Try again
              </AppButton>
            </>
          ) : (
            <LoadingSpinner size={9} />
          )}
        </View>
      </View>
    );
  }

  const keyText = setup?.secret ? (setup.secret.match(/.{1,4}/g) || []).join(' ') : '';

  return (
    <View style={styles.screen}>
      <BackHeader title={t('security_title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <GlassCard>
          <Text style={styles.cardTitle}>Password</Text>
          {!status.has_password ? (
            <Text style={styles.hint}>
              This account signed in with Google and has no password yet. Set one to also log in with your email.
            </Text>
          ) : null}

          {status.has_password ? (
            <FormInput
              label={t('security_current_label')} value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none"
              onFocus={() => setFocused('cur')} onBlur={() => setFocused(null)} focused={focused === 'cur'}
            />
          ) : null}
          <FormInput
            label={t('security_new_label')} value={next} onChangeText={setNext} secureTextEntry autoCapitalize="none"
            onFocus={() => setFocused('next')} onBlur={() => setFocused(null)} focused={focused === 'next'}
          />
          <FormInput
            label="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none"
            onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)} focused={focused === 'confirm'}
          />

          {pwError ? <Text style={styles.errorText}>{pwError}</Text> : null}

          <AppButton variant="primary" style={{ marginTop: 20 }} onPress={pwBusy ? () => {} : handlePassword}>
            {pwBusy ? <LoadingSpinner size={7} color={colors.cream} /> : t('security_update')}
          </AppButton>
        </GlassCard>

        <GlassCard style={{ marginTop: 14 }}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.cardTitle}>{t('security_2fa_title')}</Text>
              <Text style={styles.hint}>{t('security_2fa_desc')}</Text>
            </View>
            <Switch
              value={panel !== null || status.two_factor_enabled}
              onValueChange={handleToggle}
              disabled={tfBusy}
              trackColor={{ false: colors.creamAlt, true: colors.caramel }}
              thumbColor={colors.cream}
            />
          </View>

          {panel === 'setup' && setup ? (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.step}>1. Add NailScan to an authenticator app such as Google Authenticator.</Text>
              <AppButton variant="secondary" style={{ marginTop: 8 }} onPress={openAuthenticator}>
                Open in authenticator app
              </AppButton>
              <Text style={styles.hintSmall}>
                Or choose "Enter a setup key" in your app and type this key (time based). Press and hold it to copy.
              </Text>
              <Text selectable style={styles.secret}>{keyText}</Text>
              <Text style={styles.step}>2. Enter the 6-digit code the app shows.</Text>
              <FormInput
                label="Code" placeholder="123456" value={code} keyboardType="number-pad" maxLength={6}
                onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))}
                onFocus={() => setFocused('code')} onBlur={() => setFocused(null)} focused={focused === 'code'}
              />
              {tfError ? <Text style={styles.errorText}>{tfError}</Text> : null}
              <AppButton variant="primary" style={{ marginTop: 16 }} onPress={tfBusy ? () => {} : confirmEnable}>
                {tfBusy ? <LoadingSpinner size={7} color={colors.cream} /> : 'Turn on'}
              </AppButton>
              <AppButton variant="ghost" onPress={cancelPanel}>Cancel</AppButton>
            </View>
          ) : null}

          {panel === 'disable' ? (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.step}>Enter a code from your authenticator app to turn this off.</Text>
              <FormInput
                label="Code" placeholder="123456" value={code} keyboardType="number-pad" maxLength={6}
                onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))}
                onFocus={() => setFocused('code')} onBlur={() => setFocused(null)} focused={focused === 'code'}
              />
              {tfError ? <Text style={styles.errorText}>{tfError}</Text> : null}
              <AppButton variant="primary" style={{ marginTop: 16 }} onPress={tfBusy ? () => {} : confirmDisable}>
                {tfBusy ? <LoadingSpinner size={7} color={colors.cream} /> : 'Turn off'}
              </AppButton>
              <AppButton variant="ghost" onPress={cancelPanel}>Cancel</AppButton>
            </View>
          ) : null}
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 30 },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: colors.espresso, marginBottom: 2 },
  hint: { fontSize: 11.5, color: colors.toffee, lineHeight: 16, marginTop: 2 },
  hintSmall: { fontSize: 11.5, color: colors.toffee, lineHeight: 16, marginTop: 12 },
  step: { fontSize: 12.5, fontWeight: '600', color: colors.chocolate, marginTop: 10 },
  secret: {
    fontFamily: 'monospace', fontSize: 15, color: colors.espresso, backgroundColor: colors.creamAlt,
    borderRadius: 10, padding: 12, marginTop: 8, marginBottom: 4, letterSpacing: 1,
  },
  errorText: { color: colors.clay, fontSize: 12.5, marginTop: 12, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
});