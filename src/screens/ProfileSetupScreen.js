import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function ProfileSetupScreen({ navigation, onProfileComplete }) {
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');

  const handleSaveProfile = async () => {
    if (!name || !major) {
      Alert.alert('Error', 'Please fill out all fields');
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: name,
          major: major,
          points: 0,
          streak: 0,
          swipesRemaining: 5,
          isPremium: false,
          createdAt: new Date().toISOString()
        });
        
        // After setting the doc, we need App.js to re-read the profile status.
        // We'll dispatch a custom event or force an auth state trigger shortly, 
        // but for now, since we only rely on the initial onAuthStateChanged, 
        // we can prompt the user to restart, or pass a prop. Let's handle it 
        // via a simple alert and letting them hit "refresh" to keep it quick.
        Alert.alert(
          "Profile Complete 🎉", 
          "Welcome to Study Tinder! Please reload the app to enter the home screen.",
          [{ text: "OK", onPress: () => {
              if (onProfileComplete) onProfileComplete();
          }}]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Up Your Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Major"
        value={major}
        onChangeText={setMajor}
      />
      <Button title="Save Profile" onPress={handleSaveProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 }
});
