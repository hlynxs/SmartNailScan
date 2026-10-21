
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import BackHeader from '../components/BackHeader';
import { GlassCard, AppButton } from '../components/Shared';
import { FadeInUp } from '../components/Motion';

const API_BASE_URL = 'http://localhost:5000';

export default function ResultsScreen({ navigation, route }) {
  const { t } = useLanguage();
  const { user } = useUser();

  const { scanResult } = route.params || {};
  const [saving, setSaving] = useState(false);

  const nailCount = scanResult?.nail_count ?? 0;
  const detections = scanResult?.detections ?? [];

  const handleSaveToHistory = async () => {
    if (saving) return;

    if (!user?.token) {
      Alert.alert(
        'Login required',
        'Please log in again to save your scan.'
      );
      return;
    }

    if (!scanResult?.scan_id) {
      Alert.alert(
        'Cannot save scan',
        'The scan ID is missing. Please scan again.'
      );
      return;
    }

    if (detections.length === 0) {
      Alert.alert(
        'Cannot save scan',
        'No detected nail images are available.'
      );
      return;
    }

    const missingImages = detections.some(
      (nail) => !nail.normalized_image
    );

    if (missingImages) {
      Alert.alert(
        'Cannot save scan',
        'Some cropped nail images are missing. Please scan again.'
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/scans/save`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scan_id: scanResult.scan_id,
            image_width: scanResult.image_width,
            image_height: scanResult.image_height,
            nail_count: nailCount,
            detections: detections,
            condition: scanResult.condition ?? null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Could not save your cropped nail images.'
        );
      }

      Alert.alert(
        'Scan saved',
        `${data.nail_count ?? nailCount} cropped nail images have been saved to your history.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ]
      );
    } catch (error) {
      console.error('Save cropped nails error:', error);

      Alert.alert(
        'Save failed',
        error.message ||
          'Could not save your nail images. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <BackHeader
        title={t('results_title')}
        onBack={() => navigation.goBack()}
      />

      <Text style={styles.meta}>{t('results_meta')}</Text>

      <FadeInUp delay={80}>
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.condition}>Normalized Nails</Text>

          <Text style={styles.count}>{nailCount}</Text>

          <Text style={styles.desc}>
            {nailCount === 1
              ? 'One nail was detected and processed.'
              : `${nailCount} nails were detected and processed.`}
          </Text>
        </GlassCard>
      </FadeInUp>

      <FadeInUp delay={120}>
        <View style={styles.nailsSection}>
          <Text style={styles.sectionTitle}>
            Individual Cropped Nails
          </Text>

          <Text style={styles.sectionDescription}>
            Each image shows an individual nail detected by the model.
          </Text>

          {detections.length > 0 ? (
            <View style={styles.nailGrid}>
              {detections.map((nail, index) => (
                <GlassCard
                  key={`${index}-${nail.label || 'nail'}`}
                  style={styles.nailCard}
                >
                  <Text style={styles.nailTitle}>
                    Nail {index + 1}
                  </Text>

                  <View style={styles.imageContainer}>
                    {nail.normalized_image ? (
                      <Image
                        source={{
                          uri: nail.normalized_image,
                        }}
                        style={styles.normalizedImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.emptyText}>
                        Cropped image unavailable.
                      </Text>
                    )}
                  </View>

                  <Text style={styles.confidence}>
                    Confidence:{' '}
                    {typeof nail.confidence === 'number'
                      ? `${(nail.confidence * 100).toFixed(1)}%`
                      : 'N/A'}
                  </Text>
                </GlassCard>
              ))}
            </View>
          ) : (
            <GlassCard style={styles.nailCard}>
              <Text style={styles.emptyText}>
                No nails were detected. Please capture another image
                with your nails clearly visible.
              </Text>
            </GlassCard>
          )}
        </View>
      </FadeInUp>

      <FadeInUp delay={140}>
        <View style={styles.buttonContainer}>
          <AppButton
            variant="primary"
            onPress={handleSaveToHistory}
            disabled={saving || nailCount === 0}
          >
            {saving ? 'Saving cropped nails...' : t('results_save')}
          </AppButton>

          {saving && (
            <ActivityIndicator
              color={colors.clay}
              style={styles.loader}
            />
          )}
        </View>
      </FadeInUp>

      <Text style={styles.disclaimer}>
        The displayed images are normalized nail crops prepared for
        further processing. Nail detection alone does not diagnose
        nail diseases.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    paddingBottom: 40,
  },
  meta: {
    fontSize: 12,
    color: colors.toffee,
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  summaryCard: {
    marginHorizontal: 22,
    marginTop: 18,
  },
  condition: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.espresso,
    marginBottom: 8,
  },
  count: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.clay,
    textAlign: 'center',
    marginVertical: 8,
  },
  desc: {
    fontSize: 12.5,
    color: colors.chocolate,
    lineHeight: 18,
    textAlign: 'center',
  },
  nailsSection: {
    paddingHorizontal: 22,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.espresso,
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 12,
    color: colors.toffee,
    lineHeight: 18,
    marginBottom: 14,
  },
  nailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  nailCard: {
    width: '48%',
    marginBottom: 4,
  },
  nailTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.espresso,
    marginBottom: 8,
  },
  imageContainer: {
    width: '100%',
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.creamAlt,
    borderRadius: 12,
    padding: 6,
  },
  normalizedImage: {
    width: '100%',
    height: '100%',
  },
  confidence: {
    fontSize: 11,
    color: colors.toffee,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 12,
    color: colors.toffee,
    lineHeight: 18,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 22,
    marginTop: 24,
  },
  loader: {
    marginTop: 12,
  },
  disclaimer: {
    fontSize: 10.5,
    color: colors.toffee,
    textAlign: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
  },
});
