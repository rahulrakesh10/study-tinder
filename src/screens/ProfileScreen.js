import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../theme/colors';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, styles.container]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.name}>{profile?.name || 'Unknown'}</Text>
          <Text style={styles.major}>{profile?.major || '—'}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.points ?? 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.streak ?? 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.swipesRemaining ?? 0}</Text>
              <Text style={styles.statLabel}>Swipes Left</Text>
            </View>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {profile?.isPremium ? '⭐ Premium' : 'Free'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centerContainer: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarEmoji: { fontSize: 48 },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  major: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
