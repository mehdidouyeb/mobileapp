import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useConversations, StarterPrompt } from '../hooks/useConversations';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface StarterPromptsProps {
  onSelectPrompt: (prompt: StarterPrompt) => void;
}

export function StarterPrompts({ onSelectPrompt }: StarterPromptsProps) {
  const { starterPrompts } = useConversations();
  const { t } = useTranslation();
  const { preferredLanguage } = useAuth();

  console.log('🎯 StarterPrompts component rendering');
  console.log('🎯 starterPrompts array:', starterPrompts);
  console.log('🎯 starterPrompts length:', starterPrompts?.length || 0);

  // Create translated starter prompts based on user's preferred language
  const translatedPrompts: StarterPrompt[] = [
    {
      id: 'daily-routine',
      title: 'Daily Routine',
      prompt: t('starterPrompts.dailyRoutine'),
      category: 'lifestyle',
      difficulty: 'beginner' as const,
      language: preferredLanguage,
      created_at: new Date().toISOString()
    },
    {
      id: 'travel-dreams',
      title: 'Travel Dreams',
      prompt: t('starterPrompts.travelDreams'),
      category: 'travel',
      difficulty: 'intermediate' as const,
      language: preferredLanguage,
      created_at: new Date().toISOString()
    },
    {
      id: 'weekend-plans',
      title: 'Weekend Plans',
      prompt: t('starterPrompts.weekendPlans'),
      category: 'lifestyle',
      difficulty: 'beginner' as const,
      language: preferredLanguage,
      created_at: new Date().toISOString()
    },
    {
      id: 'favorite-hobby',
      title: 'Favorite Hobby',
      prompt: t('starterPrompts.favoriteHobby'),
      category: 'interests',
      difficulty: 'beginner' as const,
      language: preferredLanguage,
      created_at: new Date().toISOString()
    }
  ];

  // Use translated prompts or fall back to database prompts
  const promptsToShow = translatedPrompts.length > 0 ? translatedPrompts : starterPrompts;

  if (!promptsToShow || promptsToShow.length === 0) {
    console.log('🎯 NO STARTER PROMPTS - showing fallback');
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Fluent Flo! 🎓</Text>
        <Text style={styles.subtitle}>Loading conversation starters...</Text>
        <Text style={{ color: 'white', marginTop: 20 }}>No starter prompts available yet.</Text>
      </View>
    );
  }

  console.log('🎯 RENDERING STARTER PROMPTS:', starterPrompts.length);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10B981'; // green
      case 'intermediate': return '#F59E0B'; // yellow
      case 'advanced': return '#EF4444'; // red
      default: return '#6B7280';
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'lifestyle': return '🏠';
      case 'travel': return '✈️';
      case 'personal': return '👤';
      case 'interests': return '🎨';
      case 'food': return '🍽️';
      case 'education': return '📚';
      case 'technology': return '💻';
      default: return '💬';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('app.name')} 🎓</Text>
      <Text style={styles.subtitle}>{t('starterPrompts.chooseTopic')}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
        <View style={styles.promptsRow}>
          {promptsToShow.map((prompt) => (
            <Pressable
              key={prompt.id}
              style={styles.promptCard}
              onPress={() => onSelectPrompt(prompt)}
            >
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryEmoji}>{getCategoryEmoji(prompt.category)}</Text>
              </View>

              <Text style={styles.promptTitle}>{prompt.title}</Text>

              <View style={styles.difficultyBadge}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(prompt.difficulty) }]}>
                  {prompt.difficulty}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  promptsList: {
    flex: 1,
    width: '100%',
  },
  promptCard: {
    backgroundColor: '#1a1f3a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 20,
  },
});
