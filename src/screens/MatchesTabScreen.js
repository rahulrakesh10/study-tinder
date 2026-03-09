import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import SwipeScreen from './SwipeScreen';
import MatchesScreen from './MatchesScreen';
import colors from '../theme/colors';

export default function MatchesTabScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('discover');
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.surface]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.toggleContainer, { marginTop: insets.top + 4 }]}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'discover' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('discover')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, activeTab === 'discover' && styles.toggleTextActive]}>
            Discover
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'matches' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('matches')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, activeTab === 'matches' && styles.toggleTextActive]}>
            My Matches
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {activeTab === 'discover' ? (
          <SwipeScreen navigation={navigation} />
        ) : (
          <MatchesScreen navigation={navigation} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 2,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.white,
  },
  content: { flex: 1 },
});
