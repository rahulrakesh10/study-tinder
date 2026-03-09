import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import colors from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
const CARD_EMOJIS = ['💻', '⚡', '📐', '🔬', '🧬', '📚'];

export default function SwipeScreen({ navigation }) {
  const [swipesRemaining, setSwipesRemaining] = useState(null);
  const [deckUsers, setDeckUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      const userData = docSnap.exists() ? docSnap.data() : {};
      const myLiked = userData.liked || [];
      const myMatches = (userData.matches || []).map((m) => (typeof m === 'object' ? m.id : m));
      setSwipesRemaining(userData.swipesRemaining ?? 5);

      const excludeIds = new Set([user.uid, ...myLiked, ...myMatches]);
      const usersSnap = await getDocs(collection(db, 'users'));
      const candidates = [];
      usersSnap.forEach((d) => {
        if (!excludeIds.has(d.id) && d.data().name) {
          const data = d.data();
          const idx = candidates.length % CARD_COLORS.length;
          candidates.push({
            id: d.id,
            name: data.name,
            major: data.major || 'Unknown',
            color: CARD_COLORS[idx],
            emoji: CARD_EMOJIS[idx],
          });
        }
      });
      setDeckUsers(candidates);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (cardIndex) => {
    if (swipesRemaining <= 0) return;
    const newSwipes = swipesRemaining - 1;
    setSwipesRemaining(newSwipes);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { swipesRemaining: newSwipes });
      }
    } catch (error) {
      console.error('Error updating swipes:', error);
    }
  };

  const handleSwipedRight = async (cardIndex) => {
    const swipedUser = deckUsers[cardIndex];
    if (!swipedUser) return;
    try {
      const user = auth.currentUser;
      if (!user) return;

      const matchPayload = { id: swipedUser.id, name: swipedUser.name, major: swipedUser.major };

      await updateDoc(doc(db, 'users', user.uid), {
        liked: arrayUnion(swipedUser.id),
      });

      const otherDoc = await getDoc(doc(db, 'users', swipedUser.id));
      const otherLiked = (otherDoc.exists() && otherDoc.data().liked) || [];
      const isMutual = otherLiked.includes(user.uid);

      if (isMutual) {
        const currentUserData = (await getDoc(doc(db, 'users', user.uid))).data();
        const currentMatchPayload = {
          id: user.uid,
          name: currentUserData?.name || 'Unknown',
          major: currentUserData?.major || 'Unknown',
        };
        await updateDoc(doc(db, 'users', user.uid), {
          matches: arrayUnion(matchPayload),
        });
        await updateDoc(doc(db, 'users', swipedUser.id), {
          matches: arrayUnion(currentMatchPayload),
        });
      }
    } catch (error) {
      console.error('Error saving like/match:', error);
    }
  };

  const renderCard = (card) => {
    if (!card) return <View style={styles.card} />;
    return (
      <View style={[styles.card, { backgroundColor: card.color }]}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.cardGradient}
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardEmoji}>{card.emoji}</Text>
          <Text style={styles.cardName}>{card.name}</Text>
          <Text style={styles.cardMajor}>{card.major}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, styles.container]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.logo}>Study Tinder</Text>
          <View style={styles.swipeBadge}>
            <Text style={styles.swipeBadgeText}>{swipesRemaining} swipes left</Text>
          </View>
        </View>

        <View style={styles.swiperContainer}>
          {swipesRemaining > 0 && deckUsers.length > 0 ? (
            <Swiper
              ref={swiperRef}
              cards={deckUsers}
              renderCard={renderCard}
              keyExtractor={(card) => (card?.id ? `card-${card.id}` : `card-${Math.random()}`)}
              onSwiped={handleSwipe}
              onSwipedRight={handleSwipedRight}
              cardIndex={0}
              backgroundColor="transparent"
              stackSize={3}
              stackSeparation={12}
              disableBottomSwipe
              disableTopSwipe
              infinite={deckUsers.length > 2}
              animateCardOpacity
              marginTop={0}
              marginBottom={300}
              cardVerticalMargin={16}
              cardHorizontalMargin={16}
              overlayLabels={null}
            />
          ) : swipesRemaining <= 0 ? (
            <View style={styles.outOfSwipesContainer}>
              <Text style={styles.outOfSwipesEmoji}>🔥</Text>
              <Text style={styles.outOfSwipesText}>Out of swipes for today!</Text>
              <Text style={styles.upgradeText}>Come back tomorrow for more study buddies.</Text>
            </View>
          ) : (
            <View style={styles.outOfSwipesContainer}>
              <Text style={styles.outOfSwipesEmoji}>👋</Text>
              <Text style={styles.outOfSwipesText}>No one new to discover</Text>
              <Text style={styles.upgradeText}>Check back later for more study buddies.</Text>
            </View>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 4,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  swipeBadge: {
    marginTop: 2,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  swipeBadgeText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  swiperContainer: { flex: 1, overflow: 'hidden' },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 28,
  },
  cardEmoji: { fontSize: 64, marginBottom: 12 },
  cardName: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardMajor: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
    marginTop: 4,
  },
  outOfSwipesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  outOfSwipesEmoji: { fontSize: 80, marginBottom: 20 },
  outOfSwipesText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
