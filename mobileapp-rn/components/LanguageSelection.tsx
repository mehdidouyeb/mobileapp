import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface LanguageSelectionProps {
  title: string;
  selectedLanguage: string;
  onSelectLanguage: (language: string) => void;
}

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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.grid}>
        {languages.map((lang) => (
          <Pressable
            key={lang.code}
            style={[
              styles.languageButton,
              selectedLanguage === lang.code && styles.selectedButton,
            ]}
            onPress={() => onSelectLanguage(lang.code)}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text style={[
              styles.languageName,
              selectedLanguage === lang.code && styles.selectedText,
            ]}>
              {lang.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  languageButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },
  flag: {
    fontSize: 24,
    marginBottom: 4,
  },
  languageName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  selectedText: {
    color: '#FFFFFF',
  },
});
