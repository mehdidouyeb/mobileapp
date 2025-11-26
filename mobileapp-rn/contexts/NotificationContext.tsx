import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationContextType {
  notification: Notifications.Notification | null;
  expoPushToken: string | null;
  scheduleDailyReminder: (time: Date) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  hasNotificationPermission: boolean;
  notificationTime: Date;
  setNotificationTime: (time: Date) => void;
  isNotificationScheduled: boolean;
  requestNotificationPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  } as Notifications.NotificationBehavior),
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [notificationTime, setNotificationTime] = useState<Date>(new Date());
  const [isNotificationScheduled, setIsNotificationScheduled] = useState(false);

  // Request notification permissions and register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
    });

    // Listen for notifications when the app is in the foreground
    const notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listen for notification responses (when user taps on a notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
    });

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // Function to register for push notifications
  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    let token;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      setHasNotificationPermission(finalStatus === 'granted');
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo push token:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token || null;
  };

  // Schedule a daily reminder at the specified time
  const scheduleDailyReminder = async (time: Date) => {
    try {
      // Cancel any existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Set up the notification content
      const content = {
        title: "Time to practice! 🎯",
        body: "Don't break your streak! Practice your language skills now.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      };

      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          hour: time.getHours(),
          minute: time.getMinutes(),
          repeats: true,
          channelId: 'default',
        } as unknown as Notifications.DailyTriggerInput,
      });

      // Save the reminder time
      await AsyncStorage.setItem('reminderTime', time.toISOString());
      console.log('Daily reminder scheduled for:', time.toLocaleTimeString());
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  };

  // Cancel all scheduled notifications
  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem('reminderTime');
    console.log('All notifications cancelled');
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    const granted = finalStatus === 'granted';
    setHasNotificationPermission(granted);
    return granted;
  };

  // Load saved notification time on mount
  useEffect(() => {
    const loadNotificationTime = async () => {
      try {
        const savedTime = await AsyncStorage.getItem('notificationTime');
        if (savedTime) {
          setNotificationTime(new Date(savedTime));
        }
      } catch (error) {
        console.error('Failed to load notification time', error);
      }
    };
    
    loadNotificationTime();
  }, []);

  // Save notification time when it changes
  useEffect(() => {
    const saveNotificationTime = async () => {
      try {
        await AsyncStorage.setItem('notificationTime', notificationTime.toISOString());
      } catch (error) {
        console.error('Failed to save notification time', error);
      }
    };
    
    saveNotificationTime();
  }, [notificationTime]);

  return (
    <NotificationContext.Provider
      value={{
        notification,
        expoPushToken,
        scheduleDailyReminder,
        cancelAllNotifications,
        hasNotificationPermission,
        notificationTime,
        setNotificationTime,
        isNotificationScheduled,
        requestNotificationPermission,
      }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
