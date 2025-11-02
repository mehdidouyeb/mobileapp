import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootLayoutNav() {
  const { user, loading } = useAuth();

  console.log('🎯 LAYOUT RENDER - user:', user?.email || 'null', 'loading:', loading, 'timestamp:', Date.now());
  console.log('🎯 LAYOUT RENDER - user exists:', !!user);

  if (loading) {
    console.log('🎯 LAYOUT: Still loading, showing nothing');
    return null; // Or show a loading screen
  }

  console.log('🎯 LAYOUT: Loading complete, user present:', !!user, 'will show:', user ? 'MAIN APP' : 'LOGIN');

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        {user ? (
          <>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </>
        ) : (
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        )}
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
