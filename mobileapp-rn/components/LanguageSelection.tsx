import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LanguageSelectionProps {
  title: string;
  selectedLanguage: string;
  onSelectLanguage: (language: string) => void;
}

const CONTAINER_PADDING = 16;
const ITEM_HEIGHT = 60;

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

export function LanguageSelection({ title, selectedLanguage, onSelectLanguage }: LanguageSelectionProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {languages.map((lang) => {
          const isSelected = selectedLanguage === lang.code;
          
          return (
            <Pressable
              key={lang.code}
              style={({ pressed }) => [
                styles.languageButton,
                isSelected && styles.selectedButton,
                pressed && !isSelected && styles.pressedButton
              ]}
              onPress={() => onSelectLanguage(lang.code)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${lang.name} language`}
            >
              <Text style={[styles.flag, isSelected && styles.selectedText]}>{lang.flag}</Text>
              <Text style={[styles.languageName, isSelected && styles.selectedText]}>
                {lang.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300, // Fixed height to ensure visibility
    padding: CONTAINER_PADDING,
    backgroundColor: '#0b1020',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollView: {
    flexGrow: 0, // Prevent the ScrollView from taking up all available space
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 8, // Add some horizontal padding
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  selectedButton: {
    backgroundColor: '#1E40AF',
    borderColor: '#3B82F6',
  },
  pressedButton: {
    opacity: 0.8,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  languageName: {
    fontSize: 16,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
