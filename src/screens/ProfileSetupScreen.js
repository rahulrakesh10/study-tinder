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
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../theme/colors';

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
        const emojis = ['👤', '👩', '👨', '🧑', '👩‍💻', '👨‍🔬', '👩‍🎓', '👨‍🎓'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const avatarUrl = `https://picsum.photos/seed/${user.uid}/400/500`;
        const years = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
        const coursesPool = ['CS 101', 'MATH 241', 'ENGL 101', 'HIST 101', 'PSYC 101', 'ECON 101'];
        const year = years[Math.floor(Math.random() * years.length)];
        const courses = coursesPool.sort(() => Math.random() - 0.5).slice(0, 4);
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: name.trim(),
          major: major.trim(),
          year,
          courses,
          emoji,
          avatarUrl,
          points: 0,
          streak: 0,
          swipesRemaining: 5,
          matches: [],
          liked: [],
          passed: [],
          isPremium: false,
          createdAt: new Date().toISOString(),
        });

        Alert.alert('Profile Complete 🎉', 'Welcome to Study Tinder!', [
          {
            text: 'OK',
            onPress: () => {
              if (onProfileComplete) onProfileComplete();
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
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
          <Text style={styles.emoji}>📚</Text>
          <Text style={styles.title}>Set Up Your Profile</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Major (e.g. Computer Science)"
            placeholderTextColor={colors.textMuted}
            value={major}
            onChangeText={setMajor}
            autoCapitalize="words"
          />

          <TouchableOpacity onPress={handleSaveProfile} style={styles.primaryButton} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Save Profile</Text>
            </LinearGradient>
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
    paddingBottom: 40,
    alignItems: 'center',
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
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
});
