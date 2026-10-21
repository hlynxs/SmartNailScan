import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Vibration,
} from 'react-native';

import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';

import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import BackHeader from '../components/BackHeader';
import LoadingSpinner from '../components/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000';

const FLASH_MODES = ['off', 'on', 'auto'];
const FLASH_LABELS = {
  off: 'Flash: Off',
  on: 'Flash: On',
  auto: 'Flash: Auto',
};

async function detectNails(photoUri, token) {
  // Check whether the user is logged in and has a token.
  if (!token) {
    throw new Error('Missing token. Please log in again.');
  }

  const formData = new FormData();

  formData.append('image', {
    uri: photoUri,
    name: 'hand_scan.jpg',
    type: 'image/jpeg',
  });

  const url = `${API_BASE_URL}/api/detect-nails`;

  console.log('Photo URI:', photoUri);
  console.log('Request URL:', url);

  let response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch (error) {
    console.log('NETWORK CONNECTION ERROR:', error);

    throw new Error(
      'Cannot connect to the server. Check your network and Android HTTP settings.'
    );
  }

  const responseText = await response.text();

  console.log('HTTP status:', response.status);
  console.log('Server response:', responseText);

  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error('The server returned an invalid response.');
  }

  if (!response.ok) {
    throw new Error(data.error || 'Nail detection failed.');
  }

  return data;
}

export default function ScanScreen({ navigation }) {
  const { t } = useLanguage();
  const { user } = useUser();

  const cameraRef = useRef(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const photoOutput = usePhotoOutput();

  const [analyzing, setAnalyzing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [flashMode, setFlashMode] = useState('off');

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const toggleFlash = () => {
    setFlashMode((current) => {
      const index = FLASH_MODES.indexOf(current);
      return FLASH_MODES[(index + 1) % FLASH_MODES.length];
    });
  };

  const handleCapture = async () => {
    if (!cameraReady || analyzing) return;

    Vibration.vibrate(10);

    let photo = null;

    try {
      setAnalyzing(true);
      setCameraError(null);

      // 1. Check the login token before processing the scan.
      if (!user?.token) {
        throw new Error('Missing token. Please log in again.');
      }

      // 2. Capture the photo (flash mode is applied here).
      const flash = device?.hasFlash ? flashMode : 'off';
      photo = await photoOutput.capturePhoto({ flashMode: flash }, {});

      // 3. Save the captured photo to a temporary file.
      const photoPath = await photo.saveToTemporaryFileAsync();

      console.log('Saved photo path:', photoPath);

      // 4. Convert the filesystem path to a file URI.
      const photoUri = photoPath.startsWith('file://')
        ? photoPath
        : `file://${photoPath}`;

      // 5. Release the native photo object.
      photo.dispose();
      photo = null;

      // 6. Send the image and login token to Flask.
      console.log('Sending image to nail detection API...');

      const scanResult = await detectNails(photoUri, user.token);

      console.log('Nail detection result:', scanResult);
      console.log('Number of detected nails:', scanResult.nail_count);

      // 7. Navigate to Results and pass the detection response.
      navigation.navigate('Results', {
        photoUri,
        scanResult,
      });
    } catch (error) {
      console.log('Scan error:', error, error?.stack);

      // Release the photo if an error occurs before disposal.
      if (photo && typeof photo.dispose === 'function') {
        photo.dispose();
      }

      setCameraError(
        error?.message || 'Unable to capture or analyze the image.'
      );
    } finally {
      // Stop the loading indicator whether the scan succeeds or fails.
      setAnalyzing(false);
    }
  };

  const renderCamera = () => {
    if (!hasPermission) {
      return (
        <Text style={styles.hint}>
          Camera permission is required.
        </Text>
      );
    }

    if (!device) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.chocolate} />
          <Text style={styles.hint}>
            No camera device found
          </Text>
        </View>
      );
    }

    return (
      <>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          outputs={[photoOutput]}
          isActive={true}
          onInitialized={() => setCameraReady(true)}
          onStarted={() => setCameraReady(true)}
          onError={(error) => {
            setCameraError(error.message);
            console.log('Camera error:', error);
          }}
        />

        {!cameraReady && (
          <View style={[StyleSheet.absoluteFill, styles.overlay]}>
            <ActivityIndicator color={colors.chocolate} />
          </View>
        )}

        {cameraReady && device.hasFlash && (
          <Pressable
            style={styles.flashButton}
            onPress={toggleFlash}
            disabled={analyzing}
            hitSlop={8}
          >
            <Text style={styles.flashText}>
              {FLASH_LABELS[flashMode]}
            </Text>
          </Pressable>
        )}
      </>
    );
  };

  return (
    <View style={styles.screen}>
      <BackHeader
        title="Scan"
        onBack={() => navigation.goBack()}
      />

      <Text style={styles.hint}>
        {cameraError
          ? `Scan error: ${cameraError}`
          : 'Place your nail inside the frame'}
      </Text>

      <View style={styles.frame}>
        {renderCamera()}
      </View>

      <Pressable
        style={styles.shutterWrap}
        onPress={handleCapture}
        disabled={analyzing || !cameraReady}
      >
        <View style={styles.shutterOuter}>
          <View style={styles.shutterInner} />
        </View>
      </Pressable>

      <Text style={styles.shutterLabel}>
        Tap to scan
      </Text>

      {analyzing && <LoadingSpinner />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12.5,
    color: colors.textSoft,
    paddingHorizontal: 30,
    marginBottom: 16,
  },
  frame: {
    flex: 1,
    marginHorizontal: 30,
    marginBottom: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.toffee,
    backgroundColor: colors.creamAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.creamAlt,
  },
  flashButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  flashText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  shutterWrap: {
    alignSelf: 'center',
    marginBottom: 6,
  },
  shutterOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: colors.chocolate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.chocolate,
  },
  shutterLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.toffee,
    marginBottom: 30,
  },
});