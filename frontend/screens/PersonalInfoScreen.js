import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import BackHeader from '../components/BackHeader';
import { FormInput, AppButton } from '../components/Shared';
import Avatar from '../components/Avatar';
import { Vibration } from 'react-native';
import LoadingSpinner from '../components/LoadingSpinner';

const PROFILE_API_URL = 'http://localhost:5000/api/profile';

export default function PersonalInfoScreen({ navigation }) {
  const { t } = useLanguage();
  const { user, updateUser } = useUser();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [photo, setPhoto] = useState(user?.photo || null);
  const [focused, setFocused] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePickPhoto = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.5, maxWidth: 500, maxHeight: 500, includeBase64: true },
      (response) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset?.base64) {
          const dataUri = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
          setPhoto(dataUri);
        }
      }
    );
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(PROFILE_API_URL, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          photo: photo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save changes.');
        return;
      }
      updateUser({ name: data.name, phone: data.phone, photo: data.photo });
      Vibration.vibrate(15);
      Alert.alert('Saved', 'Your profile has been updated.');
      navigation.goBack();
    } catch (err) {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <BackHeader title={t('personalinfo_title')} onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: 26 }}>
        <View style={styles.avatarSection}>
          <Avatar size={84} fontSize={26} />
          <Pressable onPress={handlePickPhoto}>
            <Text style={styles.changePhotoText}>Change photo</Text>
          </Pressable>
        </View>

        <FormInput label={t('personalinfo_name_label')} value={name} onChangeText={setName}
          onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} focused={focused === 'name'} />
        <FormInput label={t('personalinfo_email_label')} value={user?.email || ''} editable={false}
          onFocus={() => {}} onBlur={() => {}} focused={false} />
        <FormInput label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad"
          onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)} focused={focused === 'phone'} />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AppButton variant="primary" style={{ marginTop: 26 }} onPress={handleSave}>
          {saving ? <LoadingSpinner size={7} color={colors.cream} /> : t('personalinfo_save')}
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  avatarSection: { alignItems: 'center', marginBottom: 10 },
  changePhotoText: { color: colors.caramel, fontWeight: '700', fontSize: 13, marginTop: 10 },
  errorText: { color: colors.clay, fontSize: 12.5, marginTop: 14, fontWeight: '600' },
});