import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useConversations, StarterPrompt } from '../hooks/useConversations';

interface StarterPromptsProps {
  onSelectPrompt: (prompt: StarterPrompt) => void;
}

export function StarterPrompts({ onSelectPrompt }: StarterPromptsProps) {
  const { starterPrompts } = useConversations();

  console.log('🎯 StarterPrompts component rendering, prompts:', starterPrompts?.length || 0);

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
      <Text style={styles.title}>Choose a topic to start chatting!</Text>
      <Text style={styles.subtitle}>Pick any prompt below to begin a conversation with Fluent Flo</Text>

      <ScrollView style={styles.promptsList} showsVerticalScrollIndicator={false}>
        {starterPrompts.map((prompt) => (
          <Pressable
            key={prompt.id}
            style={styles.promptCard}
            onPress={() => onSelectPrompt(prompt)}
          >
            <View style={styles.promptHeader}>
              <Text style={styles.categoryEmoji}>
                {getCategoryEmoji(prompt.category)}
              </Text>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(prompt.difficulty) }]}>
                <Text style={styles.difficultyText}>
                  {prompt.difficulty}
                </Text>
              </View>
            </View>

            <Text style={styles.promptTitle}>{prompt.title}</Text>
            <Text style={styles.promptText} numberOfLines={2}>
              {prompt.prompt}
            </Text>
          </Pressable>
        ))}
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
