import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Image,
  ActivityIndicator,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { GlassCard, AppButton } from '../components/Shared';
import { FadeInUp } from '../components/Motion';
import Avatar from '../components/Avatar';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const API_BASE_URL = 'http://localhost:5000';

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, token, logout } = useUser();
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nailHistory, setNailHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const anim = useRef(new Animated.Value(0)).current;

  // Settings dropdown animation
  useEffect(() => {
    Animated.timing(anim, {
      toValue: settingsOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [settingsOpen, anim]);

  const dropdownStyle = {
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  // Settings dropdown options
  const settingsOptions = [
    {
      label: t('profile_personal_label'),
      desc: t('profile_personal_desc'),
      screen: 'PersonalInfo',
    },
    {
      label: t('profile_security_label'),
      desc: t('profile_security_desc'),
      screen: 'Security',
    },
    {
      label: t('profile_notifications_label'),
      desc: t('profile_notifications_desc'),
      screen: 'NotificationsSettings',
    },
    {
      label: t('profile_preferences_label'),
      desc: t('profile_preferences_desc'),
      screen: 'Preferences',
    },
    {
      label: t('profile_logout'),
      desc: '',
      screen: '__logout__',
    },
  ];

  // Sample condition breakdown values
  const conditionBreakdown = [
    { label: 'Healthy', pct: 75, color: colors.moss },
    { label: 'Leukonychia', pct: 17, color: colors.clay },
    { label: 'Onychomycosis', pct: 8, color: colors.toffee },
  ];

  // Fetch the logged-in user's saved nail scans
  const fetchNailHistory = useCallback(async (isRefresh = false) => {
    if (!token) {
      setNailHistory([]);
      setHistoryError(
        'Authentication token is missing. Please log out and log in again.'
      );
      setHistoryLoading(false);
      setHistoryRefreshing(false);
      return;
    }

    if (isRefresh) {
      setHistoryRefreshing(true);
    } else {
      setHistoryLoading(true);
    }

    setHistoryError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/scans/history`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Your session is invalid or expired. Please log in again.'
          );
        }

        if (response.status === 403) {
          throw new Error(
            'You are not authorized to view this nail history.'
          );
        }

        throw new Error(
          data.error || `Failed to load nail history (${response.status}).`
        );
      }

      setNailHistory(
        Array.isArray(data.scans) ? data.scans : []
      );
    } catch (error) {
      console.error('Failed to fetch nail history:', error);
      setHistoryError(
        error.message || 'Unable to connect to the server.'
      );
    } finally {
      setHistoryLoading(false);
      setHistoryRefreshing(false);
    }
  }, [token]);

  // Load history whenever this screen becomes active
  useFocusEffect(
    useCallback(() => {
      fetchNailHistory();
    }, [fetchNailHistory])
  );

  // Format MongoDB timestamps
  const formatHistoryDate = (dateString) => {
    if (!dateString) {
      return 'Date unavailable';
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Logout
  const handleLogout = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      // The user may not have signed in with Google.
    }

    logout();

    navigation.reset({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
  };

  // Open a settings screen (or log out)
  const handleOptionPress = (screen) => {
    setSettingsOpen(false);

    if (screen === '__logout__') {
      handleLogout();
      return;
    }

    navigation.navigate(screen);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <FadeInUp delay={0}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Avatar size={60} fontSize={20} />

              <View style={{ marginLeft: 12 }}>
                <Text style={styles.name}>
                  {user?.name || 'Guest'}
                </Text>

                <Text style={styles.email}>
                  {user?.email || ''}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.settingsBtn}
              onPress={() => setSettingsOpen((value) => !value)}
            >
              <View style={styles.gearOuter}>
                <View style={styles.gearInner} />
              </View>
            </Pressable>
          </View>
        </FadeInUp>

        {/* Condition breakdown */}
        <FadeInUp delay={80}>
          <Text style={styles.sectionTitle}>
            {t('profile_condition_breakdown')}
          </Text>

          <GlassCard style={styles.breakdownCard}>
            {conditionBreakdown.map((row) => (
              <View key={row.label} style={{ marginTop: 10 }}>
                <View style={styles.breakdownRowLabel}>
                  <Text style={styles.breakdownLabel}>
                    {row.label}
                  </Text>

                  <Text style={styles.breakdownPct}>
                    {row.pct}%
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${row.pct}%`,
                        backgroundColor: row.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </GlassCard>
        </FadeInUp>

        {/* Nail history heading */}
        <FadeInUp delay={140}>
          <Text style={styles.sectionTitle}>
            {t('profile_nail_history')}
          </Text>
        </FadeInUp>

        {/* Saved nail history */}
        <View style={styles.historyContainer}>
          {historyLoading ? (
            <View style={styles.historyState}>
              <ActivityIndicator size="large" color={colors.moss} />
              <Text style={styles.historyStateText}>
                Loading nail history...
              </Text>
            </View>
          ) : historyError ? (
            <View style={styles.historyState}>
              <Text style={styles.historyError}>
                {historyError}
              </Text>

              <Pressable
                onPress={() => fetchNailHistory()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>
                  Tap to try again
                </Text>
              </Pressable>
            </View>
          ) : nailHistory.length === 0 ? (
            <View style={styles.historyState}>
              <Text style={styles.historyEmptyTitle}>
                No nail history yet
              </Text>

              <Text style={styles.historyStateText}>
                Save a scan to see your individual nail images here.
              </Text>
            </View>
          ) : (
            nailHistory.map((scan, index) => {
              const nails = Array.isArray(scan.detections)
                ? scan.detections
                : [];

              return (
                <FadeInUp
                  key={scan.scan_id || scan._id || index}
                  delay={160 + index * 50}
                >
                  <GlassCard>
                    <View style={styles.historyHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowDate}>
                          {formatHistoryDate(scan.created_at)}
                        </Text>

                        <Text style={styles.rowMeta}>
                          {scan.nail_count ?? nails.length} nails analyzed
                        </Text>
                      </View>

                      <View style={styles.countChip}>
                        <Text style={styles.countChipText}>
                          {nails.length}{' '}
                          {nails.length === 1 ? 'nail' : 'nails'}
                        </Text>
                      </View>
                    </View>

                    {nails.length > 0 ? (
                      <View style={styles.nailGrid}>
                        {nails.map((nail, nailIndex) => {
                          const confidence = Number(nail.confidence);
                          const hasConfidence =
                            Number.isFinite(confidence);

                          return (
                            <View
                              key={`${scan.scan_id || scan._id}-nail-${nail.nail_number || nailIndex + 1}`}
                              style={styles.nailItem}
                            >
                              {nail.image_url ? (
                                <Image
                                  source={{ uri: nail.image_url }}
                                  style={styles.nailImage}
                                  resizeMode="contain"
                                  onError={(event) => {
                                    console.warn(
                                      'Failed to load nail image:',
                                      event.nativeEvent?.error
                                    );
                                  }}
                                />
                              ) : (
                                <View style={styles.nailPlaceholder}>
                                  <Text style={styles.placeholderText}>
                                    Image unavailable
                                  </Text>
                                </View>
                              )}

                              <Text style={styles.nailLabel}>
                                Nail {nail.nail_number ?? nailIndex + 1}
                              </Text>

                              {hasConfidence && (
                                <Text style={styles.nailConfidence}>
                                  {(confidence * 100).toFixed(1)}% confidence
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.historyStateText}>
                        No individual nail images are available for this scan.
                      </Text>
                    )}
                  </GlassCard>
                </FadeInUp>
              );
            })
          )}

          {!historyLoading &&
            !historyError &&
            nailHistory.length > 0 && (
              <Pressable
                onPress={() => fetchNailHistory(true)}
                disabled={historyRefreshing}
                style={styles.refreshButton}
              >
                {historyRefreshing ? (
                  <ActivityIndicator color={colors.moss} />
                ) : (
                  <Text style={styles.retryText}>
                    Refresh nail history
                  </Text>
                )}
              </Pressable>
            )}
        </View>

        {/* Logout */}
        <FadeInUp delay={300}>
          <View style={styles.logoutContainer}>
            <AppButton
              variant="secondary"
              onPress={handleLogout}
            >
              {t('profile_logout')}
            </AppButton>
          </View>
        </FadeInUp>
      </ScrollView>

      {/* Settings dropdown */}
      {settingsOpen && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setSettingsOpen(false)}
        >
          <Animated.View style={[styles.dropdown, dropdownStyle]}>
            {settingsOptions.map((option, index) => (
              <Pressable
                key={option.label}
                style={[
                  styles.dropdownRow,
                  index === settingsOptions.length - 1 && {
                    borderBottomWidth: 0,
                  },
                ]}
                onPress={() => handleOptionPress(option.screen)}
              >
                <Text style={styles.dropdownLabel}>
                  {option.label}
                </Text>

                {!!option.desc && (
                  <Text style={styles.dropdownDesc}>
                    {option.desc}
                  </Text>
                )}
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.cream,
      paddingTop: 54,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 22,
      marginBottom: 8,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    name: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.espresso,
    },
    email: {
      fontSize: 12,
      color: colors.toffee,
      marginTop: 2,
    },
    settingsBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.creamAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gearOuter: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.chocolate,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gearInner: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.chocolate,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.espresso,
      paddingHorizontal: 22,
      marginBottom: 10,
      marginTop: 8,
    },
    breakdownCard: {
      marginHorizontal: 22,
    },
    breakdownRowLabel: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    breakdownLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.espresso,
    },
    breakdownPct: {
      fontSize: 12,
      color: colors.toffee,
    },
    progressTrack: {
      height: 6,
      borderRadius: 4,
      backgroundColor: colors.creamAlt,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    historyContainer: {
      paddingHorizontal: 22,
      gap: 12,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    rowDate: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.espresso,
    },
    rowMeta: {
      fontSize: 12,
      color: colors.toffee,
      marginTop: 4,
      marginBottom: 4,
    },
    countChip: {
      backgroundColor: `${colors.moss}22`,
      borderRadius: 100,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginLeft: 8,
    },
    countChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.moss,
    },
    nailGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
      marginTop: 8,
    },
    nailItem: {
      width: '48%',
      padding: 8,
      borderRadius: 12,
      backgroundColor: colors.creamAlt,
      alignItems: 'center',
    },
    nailImage: {
      width: '100%',
      height: 120,
      borderRadius: 8,
      backgroundColor: colors.cream,
    },
    nailPlaceholder: {
      width: '100%',
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: colors.cream,
    },
    placeholderText: {
      fontSize: 10,
      color: colors.textSoft,
      textAlign: 'center',
    },
    nailLabel: {
      marginTop: 7,
      fontSize: 12,
      fontWeight: '700',
      color: colors.espresso,
    },
    nailConfidence: {
      marginTop: 3,
      fontSize: 10,
      color: colors.textSoft,
    },
    historyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 28,
      paddingHorizontal: 12,
    },
    historyStateText: {
      fontSize: 12,
      color: colors.textSoft,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 18,
    },
    historyEmptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.espresso,
      textAlign: 'center',
    },
    historyError: {
      fontSize: 12,
      color: colors.clay,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 8,
      padding: 6,
    },
    retryText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.moss,
    },
    refreshButton: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
    },
    logoutContainer: {
      paddingHorizontal: 22,
      marginTop: 24,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
    },
    dropdown: {
      position: 'absolute',
      top: 100,
      right: 22,
      width: 240,
      backgroundColor: colors.cream,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.toffee,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    dropdownRow: {
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.creamAlt,
    },
    dropdownLabel: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.espresso,
    },
    dropdownDesc: {
      fontSize: 11,
      color: colors.toffee,
      marginTop: 2,
    },
  });
}