import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import QRCode from 'react-native-qrcode-svg';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../theme/colors';

export default function HostSessionScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStartHosting = async () => {
    setLoading(true);
    setSessionId(null);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      const user = auth.currentUser;
      if (user) {
        const docRef = await addDoc(collection(db, 'sessions'), {
          hostUid: user.uid,
          hostLat: loc.coords.latitude,
          hostLng: loc.coords.longitude,
          status: 'waiting',
          timestamp: new Date().toISOString(),
        });
        setSessionId(docRef.id);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Host Session</Text>
          <View style={styles.headerSpacer} />
        </View>

        {!sessionId && !loading && (
          <View style={styles.center}>
            <Text style={styles.emoji}>📍</Text>
            <Text style={styles.title}>Ready to verify?</Text>
            <Text style={styles.subtitle}>
              Share your location with a study partner to verify your session together.
            </Text>
            <TouchableOpacity onPress={handleStartHosting} style={styles.primaryButton} activeOpacity={0.8}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Start Hosting</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching location...</Text>
          </View>
        )}

        {sessionId && !loading && (
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <View style={styles.qrInner}>
                <QRCode
                  value={sessionId}
                  size={220}
                  color={colors.background}
                  backgroundColor={colors.white}
                />
              </View>
            </View>
            <Text style={styles.promptText}>
              Show this QR code to your study partner to verify you're together.
            </Text>
            <Text style={styles.sessionIdText}>Session ID: {sessionId.slice(0, 8)}...</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emoji: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 12 },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
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
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 18, fontWeight: '700', color: colors.white },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  qrSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  qrContainer: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  qrInner: {
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 12,
  },
  promptText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 28,
    color: colors.textSecondary,
    paddingHorizontal: 24,
    lineHeight: 24,
  },
  sessionIdText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textMuted,
  },
  backButton: {
    margin: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
