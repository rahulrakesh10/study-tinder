import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../theme/colors';

const PREMIUM_SWIPES = 15;

export default function PremiumScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      const currentSwipes = docSnap.exists() ? (docSnap.data().swipesRemaining ?? 0) : 0;
      const newSwipes = currentSwipes + PREMIUM_SWIPES;
      await updateDoc(doc(db, 'users', user.uid), {
        isPremium: true,
        swipesRemaining: newSwipes,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error upgrading:', error);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.emoji}>👑</Text>
        <Text style={styles.title}>Study Tinder Premium</Text>
        <Text style={styles.subtitle}>Unlock more study buddies</Text>
        <View style={styles.perksList}>
          <View style={styles.perkRow}>
            <Text style={styles.perkIcon}>🔄</Text>
            <Text style={styles.perkText}>15 extra swipes right now</Text>
          </View>
          <View style={styles.perkRow}>
            <Text style={styles.perkIcon}>∞</Text>
            <Text style={styles.perkText}>Unlimited swipes (coming soon)</Text>
          </View>
          <View style={styles.perkRow}>
            <Text style={styles.perkIcon}>👀</Text>
            <Text style={styles.perkText}>See who liked you first (coming soon)</Text>
          </View>
          <View style={styles.perkRow}>
            <Text style={styles.perkIcon}>⭐</Text>
            <Text style={styles.perkText}>Premium badge on profile</Text>
          </View>
          <View style={styles.perkRow}>
            <Text style={styles.perkIcon}>2x</Text>
            <Text style={styles.perkText}>Double points from study sessions (coming soon)</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.upgradeCta}
          onPress={handleUpgrade}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.gold, '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeCtaGradient}
          >
            {loading ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <Text style={styles.upgradeCtaText}>Upgrade Now — 15 Swipes</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 28, paddingTop: 60 },
  emoji: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  perksList: { marginBottom: 32 },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  perkIcon: { fontSize: 24, marginRight: 16, width: 32, textAlign: 'center' },
  perkText: { fontSize: 17, color: colors.text, fontWeight: '500', flex: 1 },
  upgradeCta: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  upgradeCtaGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  upgradeCtaText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  backBtn: { alignItems: 'center', paddingVertical: 12 },
  backBtnText: { fontSize: 16, color: colors.textSecondary },
});
