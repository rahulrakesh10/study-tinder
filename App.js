import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './src/config/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import LoginScreen from './src/screens/LoginScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import HostSessionScreen from './src/screens/HostSessionScreen';
import JoinSessionScreen from './src/screens/JoinSessionScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import MatchesTabScreen from './src/screens/MatchesTabScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PremiumScreen from './src/screens/PremiumScreen';
import { seedTestUsers } from './src/utils/seedTestUsers';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TEST_MATCHES = [
  { id: 'test-match-001', name: 'Alex', major: 'Computer Science', emoji: '👩‍💻', avatarUrl: 'https://picsum.photos/seed/match1/400/500' },
  { id: 'test-match-002', name: 'Jordan', major: 'Data Science', emoji: '👨‍🔬', avatarUrl: 'https://picsum.photos/seed/match2/400/500' },
  { id: 'test-match-003', name: 'Taylor', major: 'Psychology', emoji: '🧑', avatarUrl: 'https://picsum.photos/seed/match3/400/500' },
  { id: 'test-match-004', name: 'Morgan', major: 'Economics', emoji: '👩', avatarUrl: 'https://picsum.photos/seed/match4/400/500' },
  { id: 'test-match-005', name: 'Casey', major: 'Biology', emoji: '👨', avatarUrl: 'https://picsum.photos/seed/match5/400/500' },
];

const TEST_USER_RESET = {
  matches: [],
  liked: [],
  passed: [],
  swipesRemaining: 5,
  points: 0,
  streak: 0,
  isPremium: false,
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#252525',
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B6B6B',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Matches"
        component={MatchesTabScreen}
        options={{ tabBarLabel: 'Matches', tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💬</Text> }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarLabel: 'Leaderboard', tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏆</Text> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings', tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>⚙️</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const devEmail = process.env.EXPO_PUBLIC_DEV_EMAIL;
    const devPassword = process.env.EXPO_PUBLIC_DEV_PASSWORD;
    const devAutoLogin = process.env.EXPO_PUBLIC_DEV_AUTO_LOGIN === 'true';

    const resetTestUserData = async (uid) => {
      try {
        await updateDoc(doc(db, 'users', uid), TEST_USER_RESET);
      } catch (e) {
        console.warn('Failed to reset test user:', e.message);
      }
    };

    const tryDevAutoLogin = async () => {
      if (!devAutoLogin || !devEmail || !devPassword) return false;
      try {
        const userCred = await signInWithEmailAndPassword(auth, devEmail, devPassword);
        await resetTestUserData(userCred.user.uid);
        return true;
      } catch (err) {
        const isInvalidCreds = err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential';
        if (isInvalidCreds) {
          try {
            const userCred = await createUserWithEmailAndPassword(auth, devEmail, devPassword);
            await setDoc(doc(db, 'users', userCred.user.uid), {
              uid: userCred.user.uid,
              name: 'Test User',
              major: 'Computer Science',
              year: 'Junior',
              courses: ['CS 101', 'MATH 241', 'ENGL 101', 'PHYS 101'],
              emoji: '👤',
              avatarUrl: `https://picsum.photos/seed/${userCred.user.uid}/400/500`,
              ...TEST_USER_RESET,
              isPremium: false,
              createdAt: new Date().toISOString(),
            });
            return true;
          } catch (e) {
            console.warn('Dev auto-login failed:', e.message);
            return false;
          }
        }
        if (err.code !== 'auth/email-already-in-use') {
          console.warn('Dev auto-login failed:', err.message);
        }
        return false;
      }
    };

    const init = async () => {
      if (devAutoLogin && devEmail && devPassword) {
        await tryDevAutoLogin();
      }
    };
    init();

    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);
        try {
          const docRef = doc(db, 'users', authenticatedUser.uid);
          const docSnap = await getDoc(docRef);
          setHasProfile(docSnap.exists());
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setHasProfile(false);
        }
        setLoading(false);
      } else {
        setUser(null);
        setHasProfile(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const hasAutoSeeded = useRef(false);
  useEffect(() => {
    if (!user || !hasProfile || hasAutoSeeded.current) return;
    hasAutoSeeded.current = true;
    const runAutoSeed = async () => {
      try {
        await seedTestUsers(50);
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        const matches = docSnap.exists() ? (docSnap.data().matches || []) : [];
        if (matches.length === 0) {
          await updateDoc(doc(db, 'users', user.uid), {
            matches: arrayUnion(...TEST_MATCHES),
          });
        }
      } catch (e) {
        console.warn('Auto-seed failed:', e.message);
      }
    };
    runAutoSeed();
  }, [user?.uid, hasProfile]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0D0D0D', '#1A1A1A']}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.loadingEmoji}>📚</Text>
        <Text style={styles.loadingText}>Study Tinder</Text>
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loadingSpinner} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0D0D0D' },
          }}
        >
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : !hasProfile ? (
            <Stack.Screen name="ProfileSetup">
              {(props) => <ProfileSetupScreen {...props} onProfileComplete={() => setHasProfile(true)} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="HostSession" component={HostSessionScreen} />
              <Stack.Screen name="JoinSession" component={JoinSessionScreen} />
              <Stack.Screen name="Premium" component={PremiumScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
  },
  loadingEmoji: { fontSize: 80, marginBottom: 16 },
  loadingText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: 32,
  },
  loadingSpinner: { marginTop: 8 },
});
