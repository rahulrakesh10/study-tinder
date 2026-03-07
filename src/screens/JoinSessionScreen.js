import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Button, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// The Haversine Formula Utility
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
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
      <View style={styles.centerContainer}>
        <Text style={styles.text}>We need camera and location permissions</Text>
        <Button onPress={requestPermission} title="Grant Camera Permission" />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setLoading(true);

    try {
      const sessionId = data;

      // 1. Get current joiner's location
      const loc = await Location.getCurrentPositionAsync({});
      const joinerLat = loc.coords.latitude;
      const joinerLng = loc.coords.longitude;

      // 2. Fetch Session from Firestore
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        Alert.alert('Error', 'Session not found.');
        setScanned(false);
        setLoading(false);
        return;
      }

      const { hostLat, hostLng } = sessionSnap.data();

      // 3. Distance Check via Haversine
      const distance = calculateDistanceMeters(hostLat, hostLng, joinerLat, joinerLng);

      console.log(`Computed Distance: ${distance} meters`);

      // 4. Verification Outcome logic
      if (distance <= 20) {
          await updateDoc(sessionRef, { status: 'verified' });
          setIsVerified(true);
      } else {
          Alert.alert(
              "Verification Failed",
              "You are not at the same location as the host.",
              [{ text: "Try Again", onPress: () => setScanned(false) }]
          );
      }

    } catch (error) {
       console.error("Error scanning code:", error);
       Alert.alert("Error", "Something went wrong while verifying the session.");
       setScanned(false);
    } finally {
       setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <View style={styles.successContainer}>
         <Text style={styles.successEmoji}>✅</Text>
         <Text style={styles.successTitle}>Location Verified!</Text>
         <Text style={styles.successSubtitle}>+1 Study Streak</Text>
         <View style={{ marginTop: 40 }}>
            <Button title="Back to Matches" onPress={() => navigation.navigate('Matches')} color="#FF5A5F" />
         </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF5A5F" />
        <Text style={styles.loadingText}>Verifying Location...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Scan Partner QR</Text>
      
      <View style={styles.cameraFrame}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
      </View>
      
      <Text style={styles.instructionText}>Position the host's QR code within the frame.</Text>
      
      <View style={{ marginTop: 40 }}>
        <Button title="Cancel Setup" color="#999" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F5E9' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 60, marginBottom: 40 },
  instructionText: { color: '#ccc', marginTop: 40, fontSize: 16 },
  text: { textAlign: 'center', marginBottom: 10, fontSize: 16, color: '#333' },
  cameraFrame: { width: 300, height: 300, overflow: 'hidden', borderRadius: 20, borderWidth: 2, borderColor: '#FF5A5F' },
  loadingText: { marginTop: 15, fontSize: 18, color: '#FF5A5F', fontWeight: 'bold' },
  successEmoji: { fontSize: 80, marginBottom: 20 },
  successTitle: { fontSize: 32, fontWeight: 'bold', color: '#2E7D32' },
  successSubtitle: { fontSize: 24, color: '#4CAF50', fontWeight: 'bold', marginTop: 10 }
});
