import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './src/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { View, ActivityIndicator, Text } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import SwipeScreen from './src/screens/SwipeScreen';
import HostSessionScreen from './src/screens/HostSessionScreen';
import JoinSessionScreen from './src/screens/JoinSessionScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import MatchesScreen from './src/screens/MatchesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);
        try {
          const docRef = doc(db, 'users', authenticatedUser.uid);
          const docSnap = await getDoc(docRef);
          setHasProfile(docSnap.exists());
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setHasProfile(false);
        }
      } else {
        setUser(null);
        setHasProfile(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : !hasProfile ? (
          <Stack.Screen name="ProfileSetup">
            {props => <ProfileSetupScreen {...props} onProfileComplete={() => setHasProfile(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Home" component={SwipeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="HostSession" component={HostSessionScreen} />
            <Stack.Screen name="JoinSession" component={JoinSessionScreen} />
            <Stack.Screen name="Matches" component={MatchesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
