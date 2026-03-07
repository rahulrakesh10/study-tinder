import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Button } from 'react-native';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

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
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      const fetchedLeaders = [];
      querySnapshot.forEach((doc) => {
        fetchedLeaders.push({ id: doc.id, ...doc.data() });
      });

      setLeaders(fetchedLeaders);
    } catch (error) {
      console.error("Error fetching leaderboard: ", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.listItem}>
      <Text style={styles.rankText}>#{index + 1}</Text>
      <View style={styles.userInfo}>
        <Text style={styles.nameText}>{item.name}</Text>
        <Text style={styles.majorText}>{item.major}</Text>
      </View>
      <Text style={styles.pointsText}>{item.points} pts</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Top Scholars</Text>
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>
      
      <FlatList
        data={leaders}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No verifications yet.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  listContent: { padding: 20 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rankText: { fontSize: 20, fontWeight: 'bold', width: 40, color: '#FF5A5F' },
  userInfo: { flex: 1 },
  nameText: { fontSize: 18, fontWeight: '600' },
  majorText: { fontSize: 14, color: '#666', marginTop: 4 },
  pointsText: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#999' }
});
