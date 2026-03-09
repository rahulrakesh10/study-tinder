import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../theme/colors';

const CARD_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

export default function MatchesScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().matches) {
          setMatches(docSnap.data().matches);
        }
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const color = CARD_COLORS[(index % CARD_COLORS.length)] || CARD_COLORS[0];
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: color }]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('HostSession')}
      >
        <View style={styles.cardContent}>
          <Text style={styles.cardEmoji}>{item.emoji || '📚'}</Text>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardMajor}>{item.major}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.hostBtn]}
              onPress={() => navigation.navigate('HostSession')}
            >
              <Text style={styles.actionBtnText}>Host</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.joinBtn]}
              onPress={() => navigation.navigate('JoinSession')}
            >
              <Text style={styles.actionBtnText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Your Matches</Text>
        </View>

        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💔</Text>
              <Text style={styles.emptyText}>No matches yet</Text>
              <Text style={styles.emptySubtext}>Keep swiping to find study buddies!</Text>
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
  listContent: { padding: 20, paddingBottom: 40 },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cardContent: {
    paddingVertical: 0,
  },
  cardEmoji: { fontSize: 40, marginBottom: 8 },
  cardName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardMajor: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  hostBtn: {
    backgroundColor: colors.primary,
  },
  joinBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 2,
    borderColor: colors.white,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
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
