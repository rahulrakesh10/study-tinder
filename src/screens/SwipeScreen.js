import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert, Button } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const MOCK_USERS = [
  { id: '1', name: 'Alice', major: 'Computer Science', color: '#FFB3BA' },
  { id: '2', name: 'Bob', major: 'Electrical Engineering', color: '#FFDFBA' },
  { id: '3', name: 'Charlie', major: 'Mathematics', color: '#FFFFBA' },
  { id: '4', name: 'Diana', major: 'Physics', color: '#BAFFC9' },
  { id: '5', name: 'Eve', major: 'Biology', color: '#BAE1FF' },
];

export default function SwipeScreen({ navigation }) {
  const [swipesRemaining, setSwipesRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSwipesRemaining(docSnap.data().swipesRemaining);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
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
            await updateDoc(doc(db, 'users', user.uid), {
                swipesRemaining: newSwipes
            });
        }
    } catch (error) {
        console.error("Error updating swipes:", error);
    }
  };

  const handleSwipedRight = async (cardIndex) => {
      // Step 1: Just silently save the matched user to Firestore
      const swipedUser = MOCK_USERS[cardIndex];
      
      try {
          const user = auth.currentUser;
          if (user) {
              await updateDoc(doc(db, 'users', user.uid), {
                  matches: arrayUnion(swipedUser)
              });
              
              // Optional: Show a brief toast or non-blocking alert if desired, 
              // but per request "silently save and move to next card", we'll just log
              console.log(`Matched with ${swipedUser.name}! Saved to Firestore.`);
          }
      } catch (error) {
          console.error("Error saving match:", error);
      }
  };

  const renderCard = (card) => {
    if (!card) return <View style={styles.card} />;
    return (
      <View style={[styles.card, { backgroundColor: card.color }]}>
        <Text style={styles.cardName}>{card.name}</Text>
        <Text style={styles.cardMajor}>{card.major}</Text>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerText}>Study Tinder</Text>
          <Text style={styles.swipesText}>Swipes left: {swipesRemaining}</Text>
        </View>
        <View style={styles.headerButtons}>
            <Button title="Matches" onPress={() => navigation.navigate('Matches')} />
            <Button title="Leaders" onPress={() => navigation.navigate('Leaderboard')} />
        </View>
      </View>

      <View style={styles.swiperContainer}>
        {swipesRemaining > 0 ? (
          <Swiper
            ref={swiperRef}
            cards={MOCK_USERS}
            renderCard={renderCard}
            onSwiped={handleSwipe}
            onSwipedRight={handleSwipedRight}
            cardIndex={0}
            backgroundColor={'#f0f0f0'}
            stackSize={3}
            disableBottomSwipe
            disableTopSwipe
            infinite
            animateCardOpacity
          />
        ) : (
          <View style={styles.outOfSwipesContainer}>
            <Text style={styles.outOfSwipesText}>Out of swipes for today!</Text>
            <Text style={styles.upgradeText}>Upgrade to Premium for unlimited swipes.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  headerText: { fontSize: 24, fontWeight: 'bold' },
  swipesText: { fontSize: 16, color: '#666', fontWeight: '600' },
  headerButtons: { flexDirection: 'row', gap: 5 },
  swiperContainer: { flex: 1 },
  card: { flex: 0.8, borderRadius: 10, justifyContent: 'center', alignItems: 'center', padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
  cardName: { fontSize: 32, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  cardMajor: { fontSize: 20, color: '#555' },
  outOfSwipesContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  outOfSwipesText: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  upgradeText: { fontSize: 16, color: '#666', textAlign: 'center' }
});
