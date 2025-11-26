import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export const SettingsButton = () => {
  const router = useRouter();

  return (
    <TouchableOpacity 
      onPress={() => router.push('/settings')}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
      }}
    >
      <Ionicons name="settings-outline" size={24} color="white" />
    </TouchableOpacity>
  );
};
