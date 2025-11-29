import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch, Platform, TouchableOpacity, Alert, Button } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const Settings = () => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const router = useRouter();
  const { 
    scheduleDailyReminder, 
    cancelAllNotifications, 
    hasNotificationPermission 
  } = useNotifications();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load saved notification settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTime = await AsyncStorage.getItem('reminderTime');
        if (savedTime) {
          setReminderTime(new Date(savedTime));
          setNotificationsEnabled(true);
        }
      } catch (error) {
        console.error('Failed to load notification settings', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      // Request notification permission if enabling
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('settings.notificationPermissionDenied'),
          t('settings.notificationPermissionDeniedMessage')
        );
        return;
      }
      await scheduleDailyReminder(reminderTime);
    } else {
      await cancelAllNotifications();
    }
    setNotificationsEnabled(value);
  };

  const onTimeChange = async (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newTime = new Date(selectedTime);
      setReminderTime(newTime);
      
      if (notificationsEnabled) {
        await scheduleDailyReminder(newTime);
      }
    }
  };

  const showTimePickerComponent = () => {
    setShowTimePicker(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>{t('common.loading')}...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.settingItem}>
        <Text style={styles.settingText}>{t('settings.dailyReminder')}</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>

      {notificationsEnabled && (
        <View>
          <TouchableOpacity 
            style={styles.timePickerButton}
            onPress={showTimePickerComponent}
            disabled={!hasNotificationPermission}
          >
            <Text style={styles.timePickerText}>
              {t('settings.reminderTime')}: {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={reminderTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          )}
        </View>
      )}

      <TouchableOpacity 
        style={styles.adminButton} 
        onPress={() => router.push('/admin')}
      >
        <Text style={styles.adminButtonText}>Admin Panel</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>{t('auth.signOut')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2f45',
  },
  settingText: {
    color: 'white',
    fontSize: 16,
  },
  timePickerButton: {
    padding: 15,
    backgroundColor: '#1a1f33',
    borderRadius: 8,
    marginTop: 10,
  },
  timePickerText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  adminButton: {
    marginTop: 30,
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  adminButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#2a2f45',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Settings;
