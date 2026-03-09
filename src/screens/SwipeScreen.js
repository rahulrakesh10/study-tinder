import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import colors from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
const CARD_EMOJIS = ['👤', '👩', '👨', '🧑', '👩‍💻', '👨‍🔬', '👩‍🎓', '👨‍🎓', '🧑‍💻', '🧑‍🔬'];

const PREMIUM_SWIPES = 15;
const FREE_SWIPES = 5;

export default function SwipeScreen({ navigation }) {
  const [swipesRemaining, setSwipesRemaining] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [deckUsers, setDeckUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (auth.currentUser) fetchUserData();
    }, [])
  );

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
      const myPassed = userData.passed || [];
      const myMatches = (userData.matches || []).map((m) => (typeof m === 'object' ? m.id : m));
      setIsPremium(userData.isPremium ?? false);
      setSwipesRemaining(userData.swipesRemaining ?? FREE_SWIPES);

      const excludeIds = new Set([user.uid, ...myLiked, ...myPassed, ...myMatches]);
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
            year: data.year || 'Sophomore',
            courses: data.courses || ['CS 101', 'MATH 241', 'ENGL 101'],
            color: CARD_COLORS[idx],
            emoji: data.emoji || CARD_EMOJIS[idx],
            avatarUrl: data.avatarUrl || null,
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

  const handleSwipedLeft = async (cardIndex) => {
    const swipedUser = deckUsers[cardIndex];
    if (!swipedUser) return;
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          passed: arrayUnion(swipedUser.id),
        });
      }
    } catch (error) {
      console.error('Error saving passed:', error);
    }
  };

  const handleSwipedRight = async (cardIndex) => {
    const swipedUser = deckUsers[cardIndex];
    if (!swipedUser) return;
    try {
      const user = auth.currentUser;
      if (!user) return;

      const matchPayload = {
        id: swipedUser.id,
        name: swipedUser.name,
        major: swipedUser.major,
        emoji: swipedUser.emoji,
        avatarUrl: swipedUser.avatarUrl,
      };

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
          emoji: currentUserData?.emoji || '👤',
          avatarUrl: currentUserData?.avatarUrl || null,
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

  const handleTapCard = (cardIndex) => {
    const card = deckUsers[cardIndex];
    if (card) setSelectedProfile(card);
  };

  const handleUpgradeToPremium = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const newSwipes = swipesRemaining + PREMIUM_SWIPES;
      await updateDoc(doc(db, 'users', user.uid), {
        isPremium: true,
        swipesRemaining: newSwipes,
      });
      setSwipesRemaining(newSwipes);
      setIsPremium(true);
      setShowPremiumModal(false);
      await fetchUserData();
    } catch (error) {
      console.error('Error upgrading:', error);
    }
  };

  const renderCard = (card) => {
    if (!card) return <View style={styles.card} />;
    return (
      <View style={[styles.card, { backgroundColor: card.color }]}>
        {card.avatarUrl ? (
          <Image source={{ uri: card.avatarUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardEmojiContainer}>
            <Text style={styles.cardEmoji}>{card.emoji}</Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.cardGradient}
        />
        <View style={styles.cardContent}>
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
              onSwipedLeft={handleSwipedLeft}
              onSwipedRight={handleSwipedRight}
              onTapCard={handleTapCard}
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
              overlayLabels={{
                left: {
                  element: <View style={styles.overlayRed} />,
                  style: { wrapper: styles.overlayWrapper },
                },
                right: {
                  element: <View style={styles.overlayGreen} />,
                  style: { wrapper: styles.overlayWrapper },
                },
              }}
              overlayLabelWrapperStyle={styles.overlayWrapper}
            />
          ) : swipesRemaining <= 0 ? (
            <View style={styles.outOfSwipesContainer}>
              <Text style={styles.outOfSwipesEmoji}>🔥</Text>
              <Text style={styles.outOfSwipesText}>Out of swipes!</Text>
              <Text style={styles.upgradeText}>
                {isPremium ? 'You\'ve used all your swipes. Come back tomorrow!' : 'Upgrade to Premium for 15 more swipes now.'}
              </Text>
              {!isPremium && (
                <TouchableOpacity
                  style={styles.premiumButton}
                  onPress={() => setShowPremiumModal(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.gold, '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.premiumButtonGradient}
                  >
                    <Text style={styles.premiumButtonText}>✨ Go Premium</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.outOfSwipesContainer}>
              <Text style={styles.outOfSwipesEmoji}>👋</Text>
              <Text style={styles.outOfSwipesText}>No one new to discover</Text>
              <Text style={styles.upgradeText}>Check back later for more study buddies.</Text>
            </View>
          )}
        </View>

        <Modal visible={!!selectedProfile} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSelectedProfile(null)} />
            <View style={styles.profileModalContent}>
              {selectedProfile && (
                <>
                  {selectedProfile.avatarUrl ? (
                    <Image source={{ uri: selectedProfile.avatarUrl }} style={styles.profileModalImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.profileModalEmoji, { backgroundColor: selectedProfile.color }]}>
                      <Text style={styles.profileModalEmojiText}>{selectedProfile.emoji}</Text>
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.95)']}
                    style={styles.profileModalGradient}
                  />
                  <ScrollView style={styles.profileModalScroll} showsVerticalScrollIndicator={false}>
                    <Text style={styles.profileModalName}>{selectedProfile.name}</Text>
                    <Text style={styles.profileModalMajor}>{selectedProfile.major}</Text>
                    <View style={styles.profileModalRow}>
                      <Text style={styles.profileModalLabel}>Year:</Text>
                      <Text style={styles.profileModalValue}>{selectedProfile.year}</Text>
                    </View>
                    <Text style={[styles.profileModalLabel, { marginBottom: 8 }]}>Courses this semester</Text>
                    <View style={styles.profileModalCourses}>
                      {(selectedProfile.courses || []).map((c, i) => (
                        <View key={i} style={styles.courseChip}>
                          <Text style={styles.courseChipText}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.closeProfileBtn}
                    onPress={() => setSelectedProfile(null)}
                  >
                    <Text style={styles.closeProfileBtnText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={showPremiumModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalEmoji}>👑</Text>
              <Text style={styles.modalTitle}>Study Tinder Premium</Text>
              <Text style={styles.modalSubtitle}>Unlock more study buddies</Text>
              <ScrollView style={styles.perksList} showsVerticalScrollIndicator={false}>
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
              </ScrollView>
              <TouchableOpacity
                style={styles.upgradeCta}
                onPress={handleUpgradeToPremium}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.gold, '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upgradeCtaGradient}
                >
                  <Text style={styles.upgradeCtaText}>Upgrade Now — 15 Swipes</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.maybeLaterBtn}
                onPress={() => setShowPremiumModal(false)}
              >
                <Text style={styles.maybeLaterText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardEmojiContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  cardEmoji: { fontSize: 120 },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 28,
  },
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
    marginBottom: 20,
  },
  premiumButton: {
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  premiumButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  premiumButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 12 },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  perksList: { maxHeight: 220, marginBottom: 24 },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  perkIcon: { fontSize: 22, marginRight: 12, width: 28, textAlign: 'center' },
  perkText: { fontSize: 16, color: colors.text, fontWeight: '500', flex: 1 },
  upgradeCta: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
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
  maybeLaterBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  profileModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '85%',
    marginTop: '15%',
  },
  profileModalImage: {
    width: '100%',
    height: 280,
  },
  profileModalEmoji: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModalEmojiText: { fontSize: 100 },
  profileModalGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 320,
  },
  profileModalScroll: {
    padding: 24,
    paddingTop: 16,
    maxHeight: 280,
  },
  profileModalName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  profileModalMajor: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 16,
  },
  profileModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileModalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  profileModalValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    marginLeft: 8,
  },
  profileModalCourses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  courseChip: {
    backgroundColor: colors.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  courseChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  closeProfileBtn: {
    paddingVertical: 18,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.cardBg,
  },
  closeProfileBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  overlayWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  overlayRed: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: 20,
  },
  overlayGreen: {
    flex: 1,
    backgroundColor: 'rgba(74, 222, 128, 0.5)',
    borderRadius: 20,
  },
});
