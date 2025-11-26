import { useCallback } from 'react';
import { useStreak } from '../contexts/StreakContext';

export const usePracticeSession = () => {
  const { updateStreak } = useStreak();

  const completePracticeSession = useCallback(async () => {
    try {
      // Update the streak when a practice session is completed
      await updateStreak();
      // You can add additional logic here, like saving practice data
    } catch (error) {
      console.error('Failed to complete practice session', error);
      throw error;
    }
  }, [updateStreak]);

  return {
    completePracticeSession,
  };
};
