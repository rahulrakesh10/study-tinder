import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../theme/colors';

export default function SettingsScreen() {
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

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>

          {/* Profile section */}
          <View style={styles.profileSection}>
            <Text style={styles.sectionLabel}>Profile</Text>
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
              <Text style={styles.name}>{profile?.name || 'Unknown'}</Text>
              <Text style={styles.major}>{profile?.major || '—'}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile?.points ?? 0}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile?.streak ?? 0}</Text>
                  <Text style={styles.statLabel}>Streak</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile?.swipesRemaining ?? 0}</Text>
                  <Text style={styles.statLabel}>Swipes</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Account section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionLabel}>Account</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>🚪</Text>
              <Text style={styles.menuItemText}>Log Out</Text>
              <Text style={styles.menuItemArrow}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.version}>Study Tinder v1.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centerContainer: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarEmoji: { fontSize: 40 },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  major: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsSection: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
  },
  menuItemIcon: { fontSize: 24, marginRight: 16 },
  menuItemText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  menuItemArrow: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  version: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
