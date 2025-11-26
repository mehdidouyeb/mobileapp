import { View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoadingScreen() {
  const colorScheme = useColorScheme();
  
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff',
    }}>
      <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#fff' : '#000'} />
      <ThemedText style={{ marginTop: 10 }}>Loading...</ThemedText>
    </View>
  );
}
