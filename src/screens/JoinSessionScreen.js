import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../theme/colors';

const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function JoinSessionScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Location permission needed to verify session proximity.');
      }
    })();
  }, []);

  if (!permission || locationPermission === null) {
    return <View />;
  }

  if (!permission.granted || !locationPermission) {
    return (
      <View style={[styles.centerContainer, styles.container]}>
        <LinearGradient
          colors={[colors.background, colors.surface]}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.permissionEmoji}>📷</Text>
        <Text style={styles.permissionText}>We need camera and location permissions</Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.primaryButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.primaryButtonGradient}
          >
            <Text style={styles.primaryButtonText}>Grant Permissions</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setLoading(true);

    try {
      const sessionId = data;
      const loc = await Location.getCurrentPositionAsync({});
      const joinerLat = loc.coords.latitude;
      const joinerLng = loc.coords.longitude;

      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        Alert.alert('Error', 'Session not found.');
        setScanned(false);
        setLoading(false);
        return;
      }

      const { hostLat, hostLng } = sessionSnap.data();
      const distance = calculateDistanceMeters(hostLat, hostLng, joinerLat, joinerLng);

      if (distance <= 20) {
        await updateDoc(sessionRef, { status: 'verified' });
        setIsVerified(true);
      } else {
        Alert.alert(
          'Verification Failed',
          "You're not close enough to the host. Make sure you're in the same study spot!",
          [{ text: 'Try Again', onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('Error scanning code:', error);
      Alert.alert('Error', 'Something went wrong while verifying.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.surface]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>Location Verified!</Text>
          <Text style={styles.successSubtitle}>+1 Study Streak</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs', { screen: 'Matches' })}
            style={styles.primaryButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Back to Matches</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centerContainer, styles.container]}>
        <LinearGradient
          colors={[colors.background, colors.surface]}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Verifying location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.surface]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.instructionText}>
          Position the host's QR code within the frame
        </Text>

        <View style={styles.cameraFrame}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centerContainer: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: { fontSize: 24, color: colors.text, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  headerSpacer: { width: 44 },
  instructionText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  cameraFrame: {
    width: 280,
    height: 280,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  loadingText: { marginTop: 20, fontSize: 18, color: colors.primary, fontWeight: '700' },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successEmoji: { fontSize: 100, marginBottom: 24 },
  successTitle: { fontSize: 32, fontWeight: '800', color: colors.success },
  successSubtitle: { fontSize: 24, color: colors.textSecondary, fontWeight: '700', marginTop: 12 },
  primaryButton: {
    marginTop: 48,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 18, fontWeight: '700', color: colors.white },
  permissionEmoji: { fontSize: 80, marginBottom: 24 },
  permissionText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  cancelButton: {
    marginTop: 40,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
