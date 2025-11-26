import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StreakContextType {
  currentStreak: number;
  lastPracticeDate: string | null;
  longestStreak: number;
  updateStreak: () => Promise<void>;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastPracticeDate, setLastPracticeDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved streak data on mount
  useEffect(() => {
    const loadStreakData = async () => {
      try {
        const [savedStreak, savedLongestStreak, savedLastDate] = await Promise.all([
          AsyncStorage.getItem('currentStreak'),
          AsyncStorage.getItem('longestStreak'),
          AsyncStorage.getItem('lastPracticeDate'),
        ]);

        if (savedStreak) setCurrentStreak(parseInt(savedStreak, 10));
        if (savedLongestStreak) setLongestStreak(parseInt(savedLongestStreak, 10));
        if (savedLastDate) setLastPracticeDate(savedLastDate);
      } catch (error) {
        console.error('Failed to load streak data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStreakData();
  }, []);

  const updateStreak = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // If already practiced today, do nothing
      if (lastPracticeDate === today) return;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      
      // If the last practice was yesterday, increment the streak
      if (lastPracticeDate === yesterdayStr) {
        newStreak = currentStreak + 1;
      }
      // If the last practice was before yesterday, reset the streak
      else if (lastPracticeDate && lastPracticeDate < yesterdayStr) {
        newStreak = 1;
      }

      const newLongestStreak = Math.max(longestStreak, newStreak);

      // Update state
      setCurrentStreak(newStreak);
      setLongestStreak(newLongestStreak);
      setLastPracticeDate(today);

      // Save to storage
      await Promise.all([
        AsyncStorage.setItem('currentStreak', newStreak.toString()),
        AsyncStorage.setItem('longestStreak', newLongestStreak.toString()),
        AsyncStorage.setItem('lastPracticeDate', today),
      ]);
    } catch (error) {
      console.error('Failed to update streak', error);
    }
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <StreakContext.Provider
      value={{
        currentStreak,
        lastPracticeDate,
        longestStreak,
        updateStreak,
      }}
    >
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = (): StreakContextType => {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
};
