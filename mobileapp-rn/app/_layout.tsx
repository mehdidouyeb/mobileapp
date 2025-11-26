import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useEffect } from 'react';
import '../lib/i18n'; // Initialize i18n
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { StreakProvider } from '../contexts/StreakContext';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log('🎯 LAYOUT RENDER - user:', user?.email || 'null', 'loading:', loading, 'timestamp:', Date.now());
  console.log('🎯 LAYOUT RENDER - user exists:', !!user);

  // Redirect to auth if not loading and no user
  useEffect(() => {
    if (!loading && !user) {
      console.log('🎯 No user found, redirecting to auth');
      router.replace('/auth');
    } else if (!loading && user) {
      console.log('🎯 User found, redirecting to home');
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading) {
    console.log('🎯 LAYOUT: Still loading, showing nothing');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b1020' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <StreakProvider>
        <RootLayoutNav />
      </StreakProvider>
    </AuthProvider>
  );
}
