import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert, Button } from 'react-native';
import * as Location from 'expo-location';
import QRCode from 'react-native-qrcode-svg';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function HostSessionScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStartHosting = async () => {
    setLoading(true);
    setSessionId(null);

    try {
      // 1. Get Location Permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setLoading(false);
        return;
      }

      // 2. Get Current Location
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      // 3. Create Session in Firestore
      const user = auth.currentUser;
      if (user) {
        const docRef = await addDoc(collection(db, 'sessions'), {
          hostUid: user.uid,
          hostLat: loc.coords.latitude,
          hostLng: loc.coords.longitude,
          status: 'waiting',
          timestamp: new Date().toISOString()
        });

        // 4. Set the generated ID for the QR code
        setSessionId(docRef.id);
      }
    } catch (error) {
      console.error("Error creating session:", error);
      Alert.alert('Error', 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Study Session</Text>
      
      {!sessionId && !loading && (
        <View style={styles.center}>
          <Text style={styles.subtitle}>Ready to verify your location with a partner?</Text>
          <Button title="Start Hosting" onPress={handleStartHosting} />
        </View>
      )}

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.loadingText}>Fetching coordinates...</Text>
        </View>
      )}

      {sessionId && !loading && (
        <View style={styles.qrContainer}>
          <QRCode
            value={sessionId}
            size={250}
            color="black"
            backgroundColor="white"
          />
          <Text style={styles.promptText}>Show this to your study partner to verify your location.</Text>
          <Text style={styles.sessionIdText}>ID: {sessionId}</Text>
        </View>
      )}

      <View style={{ marginTop: 20 }}>
        <Button title="Go Back" color="red" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', padding: 20 },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10, marginTop: 40 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  qrContainer: { padding: 20, backgroundColor: '#f0f0f0', borderRadius: 20, alignItems: 'center', marginTop: 20 },
  promptText: { fontSize: 16, textAlign: 'center', marginTop: 20, fontWeight: '500', paddingHorizontal: 10 },
  sessionIdText: { marginTop: 10, fontSize: 12, color: '#999' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' }
});
