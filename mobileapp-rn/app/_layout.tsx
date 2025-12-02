import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import '../lib/i18n'; // Initialize i18n
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { StreakProvider } from '../contexts/StreakContext';
import { NotificationProvider } from '../contexts/NotificationContext';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [initialized, setInitialized] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🎯 AUTH STATE - user:', user?.email || 'null', 'loading:', loading, 'initialized:', initialized);
  }, [user, loading, initialized]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (loading) return; // Skip if still loading

    const currentRoute = segments[0];
    console.log('Navigation state:', { user: !!user, route: currentRoute });

    if (!user) {
      // If user is not signed in and not on auth screen
      if (currentRoute !== 'auth') {
        console.log('Redirecting to /auth');
        router.replace('/auth');
      }
    } else {
      // If user is signed in and on auth screen
      if (currentRoute === 'auth') {
        console.log('Redirecting to home');
        router.replace('/');
      }
    }

    if (!initialized) setInitialized(true);
  }, [user, loading, segments, router, initialized]);

  // Show loading screen only during initial load
  if (loading || !initialized) {
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
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ title: 'Admin Panel' }} />
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
      <NotificationProvider>
        <StreakProvider>
          <RootLayoutNav />
        </StreakProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
