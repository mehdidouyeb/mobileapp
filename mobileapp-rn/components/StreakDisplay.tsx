import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStreak } from '../contexts/StreakContext';
import { FontAwesome } from '@expo/vector-icons';

export const StreakDisplay = () => {
  const { currentStreak, longestStreak } = useStreak();

  return (
    <View style={styles.container}>
      <View style={styles.streakContainer}>
        <FontAwesome name="fire" size={24} color="#FF5722" />
        <Text style={styles.streakText}>{currentStreak}</Text>
        <Text style={styles.label}>Current Streak</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.streakContainer}>
        <FontAwesome name="trophy" size={24} color="#FFC107" />
        <Text style={styles.streakText}>{longestStreak}</Text>
        <Text style={styles.label}>Longest Streak</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakContainer: {
    alignItems: 'center',
    flex: 1,
  },
  streakText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
});
