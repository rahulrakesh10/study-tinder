import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../theme/colors';

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = [colors.gold, colors.silver, colors.bronze];

export default function LeaderboardScreen({ navigation }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('points', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const fetchedLeaders = [];
      querySnapshot.forEach((doc) => {
        fetchedLeaders.push({ id: doc.id, ...doc.data() });
      });
      setLeaders(fetchedLeaders);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const isTopThree = index < 3;
    const medal = isTopThree ? MEDALS[index] : null;
    const rankColor = RANK_COLORS[index] || colors.textSecondary;

    return (
      <View style={[styles.listItem, isTopThree && styles.listItemHighlight]}>
        <View style={styles.rankContainer}>
          {medal ? (
            <Text style={styles.medal}>{medal}</Text>
          ) : (
            <Text style={[styles.rankText, { color: rankColor }]}>#{index + 1}</Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.nameText}>{item.name}</Text>
          <Text style={styles.majorText}>{item.major}</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{item.points || 0}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Top Scholars</Text>
        </View>

        <View style={styles.podiumContainer}>
          <LinearGradient
            colors={[colors.primary + '40', colors.primary + '10']}
            style={styles.podiumGradient}
          >
            <Text style={styles.podiumEmoji}>🏆</Text>
            <Text style={styles.podiumText}>Leaderboard</Text>
          </LinearGradient>
        </View>

        <FlatList
          data={leaders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📊</Text>
              <Text style={styles.emptyText}>No rankings yet</Text>
              <Text style={styles.emptySubtext}>Study sessions will appear here!</Text>
            </View>
          }
        />
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
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  podiumContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  podiumGradient: {
    padding: 24,
    alignItems: 'center',
  },
  podiumEmoji: { fontSize: 48, marginBottom: 8 },
  podiumText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  listItemHighlight: {
    borderWidth: 2,
    borderColor: colors.primary + '60',
  },
  rankContainer: { width: 40, alignItems: 'center' },
  medal: { fontSize: 28 },
  rankText: { fontSize: 18, fontWeight: '800' },
  userInfo: { flex: 1, marginLeft: 16 },
  nameText: { fontSize: 18, fontWeight: '700', color: colors.text },
  majorText: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  pointsBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  pointsText: { fontSize: 18, fontWeight: '800', color: colors.white },
  pointsLabel: { fontSize: 10, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: { fontSize: 80, marginBottom: 20 },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
