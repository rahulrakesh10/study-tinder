import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../theme/colors';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const docRef = doc(db, 'users', userCredential.user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          console.log('Logged In!');
        } else {
          console.log('No profile found, redirecting to Profile Setup');
        }
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleTestUser = async () => {
    const testEmail = process.env.EXPO_PUBLIC_DEV_EMAIL;
    const testPassword = process.env.EXPO_PUBLIC_DEV_PASSWORD;
    if (!testEmail || !testPassword) {
      Alert.alert('Error', 'Test credentials not set in .env');
      return;
    }
    const resetTestUserData = async (uid) => {
      try {
        await updateDoc(doc(db, 'users', uid), {
          matches: [],
          liked: [],
          passed: [],
          swipesRemaining: 5,
          points: 0,
          streak: 0,
          isPremium: false,
        });
      } catch (e) {
        console.warn('Failed to reset test user:', e.message);
      }
    };
    try {
      const userCred = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      await resetTestUserData(userCred.user.uid);
    } catch (err) {
      const isInvalidCreds = err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential';
      if (isInvalidCreds) {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
          await setDoc(doc(db, 'users', userCred.user.uid), {
            uid: userCred.user.uid,
            name: 'Test User',
            major: 'Computer Science',
            year: 'Junior',
            courses: ['CS 101', 'MATH 241', 'ENGL 101', 'PHYS 101'],
            emoji: '👤',
            avatarUrl: `https://picsum.photos/seed/${userCred.user.uid}/400/500`,
            points: 0,
            streak: 0,
            swipesRemaining: 5,
            matches: [],
            liked: [],
            passed: [],
            isPremium: false,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          if (e.code === 'auth/email-already-in-use') {
            Alert.alert('Error', 'Test user exists but password is wrong. Check EXPO_PUBLIC_DEV_PASSWORD in .env');
          } else {
            Alert.alert('Error', e.message);
          }
        }
      } else {
        Alert.alert('Error', err.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.surface]}
        style={StyleSheet.absoluteFillObject}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Study Tinder</Text>
          <Text style={styles.tagline}>Find your study buddy</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isLogin ? 'password' : 'new-password'}
          />

          <TouchableOpacity onPress={handleAuth} style={styles.primaryButton} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>{isLogin ? 'Log In' : 'Sign Up'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsLogin(!isLogin)}
            style={styles.switchButton}
            activeOpacity={0.7}
          >
            <Text style={styles.switchButtonText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchButtonHighlight}>
                {isLogin ? 'Sign Up' : 'Log In'}
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTestUser}
            style={styles.testUserButton}
            activeOpacity={0.7}
          >
            <Text style={styles.testUserButtonText}>Test User</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  header: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 48,
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 8,
  },
  form: {
    flex: 2,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.cardBg,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  primaryButton: {
    marginTop: 8,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  switchButtonHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  testUserButton: {
    marginTop: 32,
    paddingVertical: 14,
    alignItems: 'center',
  },
  testUserButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});
