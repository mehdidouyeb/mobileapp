import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, TextInput, Platform, Alert, Modal } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import * as Speech from 'expo-speech';
import { useGemini } from '../hooks/useGemini';
import { useAuth } from '../contexts/AuthContext';
import { useConversations } from '../hooks/useConversations';
import { useStreak } from '../contexts/StreakContext';
import { ConversationList } from '../components/ConversationList';
import { StarterPrompts } from '../components/StarterPrompts';
import { LanguageSelection } from '../components/LanguageSelection';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../contexts/NotificationContext';
import { Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const styles = StyleSheet.create({
  // Notification settings
  settingsSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  timePickerLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#374151',
  },
  timePickerText: {
    fontSize: 16,
    color: '#111827',
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    textAlign: 'center',
  },
  
  // Main layout
  safe: { 
    flex: 1, 
    backgroundColor: '#0b1020' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#1a1f3a', 
    borderBottomWidth: 1, 
    borderBottomColor: '#2a2f4a' 
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    flex: 1,
  },
  menuButton: { 
    padding: 8 
  },
  menuText: { 
    fontSize: 18 
  },
  
  // Modal styles
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 20, 
    width: '90%', 
    maxWidth: 500 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  modalInput: { 
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 20, 
    fontSize: 16 
  },
  modalButtons: { 
    flexDirection: 'row', 
    gap: 12 
  },
  modalButton: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  cancelButton: { 
    backgroundColor: '#374151' 
  },
  submitButton: { 
    backgroundColor: '#2563EB' 
  },
  modalButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  settingsScroll: { 
    maxHeight: 400 
  },
  ttsButton: { 
    backgroundColor: '#374151', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 8 
  },
  ttsButtonText: { 
    color: '#D1D5DB', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  saveButton: { 
    backgroundColor: '#10B981' 
  },
  ttsEnabled: {
    backgroundColor: '#10B981',
  },
  
  // Streak styles
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  streakItem: {
    alignItems: 'center',
    minWidth: 40,
  },
  streakEmoji: {
    fontSize: 14,
    marginBottom: 2,
  },
  streakNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  streakLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
  
  // Header right styles
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  settingsText: {
    color: 'white',
    fontSize: 14,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
  },
  
  // Extra controls
  extraControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
    backgroundColor: '#1a1f3a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2f4a',
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
  },
  reviewButton: {
    backgroundColor: '#4F46E5',
  },
  exerciseButton: {
    backgroundColor: '#10B981',
  },
  
  // Chat area styles
  chatArea: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 80,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  
  // Bottom bar styles
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 24,
    backgroundColor: '#1a1f3a',
    borderTopWidth: 1,
    borderTopColor: '#2a2f4a',
  },
  iconButton: {
    padding: 10,
    marginRight: 8,
  },
  iconText: {
    fontSize: 24,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#2a2f4a',
    color: 'white',
    borderRadius: 20,
    padding: 12,
    paddingRight: 50,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Feedback modal styles
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 8,
  },
  starText: {
    fontSize: 32,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
  },
  
  // Settings section styles
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 12,
  },
  timePickerButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  
  // Title styles
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default function HomeScreen() {
  console.log('🚀 APP STARTED - Constants available:', !!Constants);
  console.log('🚀 ExpoConfig:', Constants?.expoConfig);
  console.log('🚀 Extra:', Constants?.expoConfig?.extra);

  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true); // Enable TTS by default
  const [showConversationList, setShowConversationList] = useState(false);
  const [reviewResponse, setReviewResponse] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [exerciseContent, setExerciseContent] = useState('');
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempPreferredLanguage, setTempPreferredLanguage] = useState('');
  const [tempTargetLanguage, setTempTargetLanguage] = useState('');
  
  // Notification settings
  const { 
    hasNotificationPermission, 
    scheduleDailyReminder, 
    cancelAllNotifications, 
    notificationTime = new Date(),
    setNotificationTime = () => {},
    isNotificationScheduled = false,
    requestNotificationPermission = async () => false
  } = useNotifications() || {};
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(isNotificationScheduled);
  
  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleDailyReminder(notificationTime);
        setNotificationsEnabled(true);
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive daily reminders.'
        );
      }
    } else {
      await cancelAllNotifications();
      setNotificationsEnabled(false);
    }
  };
  
  const toggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleDailyReminder(notificationTime);
        setNotificationsEnabled(true);
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive daily reminders.'
        );
        setNotificationsEnabled(false);
      }
    } else {
      await cancelAllNotifications();
      setNotificationsEnabled(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setNotificationTime(selectedTime);
      if (notificationsEnabled) {
        scheduleDailyReminder(selectedTime);
      }
    }
  };
  const recognizedTextRef = useRef('');
  const voiceProcessedRef = useRef(false);
  const isReviewModeRef = useRef(false);

  const { signOut, preferredLanguage, targetLanguage, updateLanguages } = useAuth();
  const { currentStreak, longestStreak, updateStreak } = useStreak();
  const { t } = useTranslation();

  // Force re-render when language changes
  const [currentLang, setCurrentLang] = useState(preferredLanguage);
  useEffect(() => {
    if (preferredLanguage !== currentLang) {
      console.log('🌍 Language changed from', currentLang, 'to', preferredLanguage);
      console.log('🌍 Current translations:', {
        appName: t('app.name'),
        typeMessage: t('chat.typeMessage'),
        settingsTitle: t('settings.title')
      });
      setCurrentLang(preferredLanguage);
    }
  }, [preferredLanguage, currentLang, t]);

  // Track when language changes to force reconnection on next message
  const languageChangedRef = useRef(false);
  useEffect(() => {
    console.log('🎯 Target language changed to:', targetLanguage);
    languageChangedRef.current = true; // Mark that language changed
  }, [targetLanguage]);

  const appendLog = useCallback((msg: string) => {
    setLogs(prev => [new Date().toLocaleTimeString() + ' ' + msg, ...prev].slice(0, 200));
  }, []);

  // Languages available for settings
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
  const getLanguageCode = useCallback((language: string) => {
    const languageMap: { [key: string]: string } = {
      'English': 'en-US',
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'German': 'de-DE',
      'Italian': 'it-IT',
      'Portuguese': 'pt-BR',
      'Russian': 'ru-RU',
      'Japanese': 'ja-JP',
      'Korean': 'ko-KR',
      'Chinese': 'zh-CN',
      'Arabic': 'ar-SA',
      'Hindi': 'hi-IN',
    };
    return languageMap[language] || 'en-US';
  }, []);

  // Refs for dependencies that aren't available yet
  const currentConversationRef = useRef<any>(null);
  const addMessageRef = useRef<any>(null);

  // Define callbacks first (they need to be declared before hooks that use them)
  const onAIMessage = useCallback(async (evt: any) => {
    const aiMessageTimestamp = Date.now();
    console.log(` [${aiMessageTimestamp}] AI MESSAGE RECEIVED:`, evt);
    console.log(` [${aiMessageTimestamp}] Current conversation:`, currentConversationRef.current?.id);
    appendLog('AI message received');
    const text = typeof evt === 'string' ? evt : (evt?.text ?? JSON.stringify(evt));

    // Check if this is a review response
    if (isReviewModeRef.current) {
      console.log(' REVIEW RESPONSE RECEIVED:', text);
      isReviewModeRef.current = false; // Reset review mode
      setReviewResponse(text);
      setShowReviewModal(true);
      return;
    }

    // Add message to conversation
    if (currentConversationRef.current && addMessageRef.current) {
      console.log(`📤 [${Date.now()}] Adding message to conversation:`, currentConversationRef.current.id);
      await addMessageRef.current(currentConversationRef.current.id, 'assistant', text);
      console.log(`🤖 [${aiMessageTimestamp}] Message added successfully`);

      // Speak the response if TTS is enabled
      if (ttsEnabled && text) {
        try {
          console.log(`🔊 Speaking AI response:`, text.substring(0, 50) + '...');
          await Speech.speak(text, {
            language: getLanguageCode(preferredLanguage),
            rate: 0.8, // Slightly slower for clarity
            pitch: 1.0,
          });
        } catch (error) {
          console.log('🔊 TTS Error:', error);
          appendLog('🔊 TTS failed');
        }
      }
    } else {
      console.log(`🤖 [${aiMessageTimestamp}] Refs not ready - conversation:`, !!currentConversationRef.current, 'addMessage:', !!addMessageRef.current);
    }
  }, [appendLog, ttsEnabled, preferredLanguage]);

  const onAIError = useCallback((err: any) => {
    const aiErrorTimestamp = Date.now();
    console.log(`❌ [${aiErrorTimestamp}] AI ERROR:`, err);
    const msg = 'AI error: ' + (err?.message ?? String(err));
    appendLog(msg);
    if (currentConversationRef.current && addMessageRef.current) {
      addMessageRef.current(currentConversationRef.current.id, 'system', msg);
    }
  }, [appendLog]);

  const onAIClose = useCallback(() => {
    const aiCloseTimestamp = Date.now();
    console.log(`🔌 [${aiCloseTimestamp}] AI CONNECTION CLOSED`);
    setIsConnected(false);
    appendLog('AI session closed');
  }, [appendLog]);

  const onAIOpen = useCallback(() => {
    const aiOpenTimestamp = Date.now();
    console.log(`🔌 [${aiOpenTimestamp}] AI CONNECTION OPENED`);
    setIsConnected(true);
    appendLog('AI session open');
  }, [appendLog]);

  // Hook declarations - now come after callbacks
  const {
    currentConversation,
    messages,
    createConversation,
    addMessage,
    loadMessages,
    setCurrentConversation,
    setMessages,
  } = useConversations();

  const { connect, sendTextInput, close } = useGemini({
    onOpen: onAIOpen,
    onMessage: onAIMessage,
    onError: onAIError,
    onClose: onAIClose
  });

  // Update refs when hooks become available
  useEffect(() => {
    currentConversationRef.current = currentConversation;
    addMessageRef.current = addMessage;
  }, [currentConversation, addMessage]);

  // Define callbacks with refs
  const handleSend = useCallback(async (source = 'unknown') => {
    const sendTimestamp = Date.now();
    console.log(` [${sendTimestamp}] handleSend called from: ${source}`);
    if (!message.trim()) return;

    const text = message.trim();
    console.log(` [${sendTimestamp}] Trimmed text:`, text);

    // Update streak when sending a message
    try {
      await updateStreak();
    } catch (error) {
      console.error('Failed to update streak:', error);
    }

    // Create conversation if none exists
    let conversation = currentConversation;
    if (!conversation) {
      console.log('📝 Creating new conversation for message');
      conversation = await createConversation(text.substring(0, 30) + (text.length > 30 ? '...' : ''));
      if (!conversation) {
        console.error('Failed to create conversation');
        return;
      }
      setCurrentConversation(conversation);
    }

    // Auto-connect if not connected
    if (!isConnected) {
      try {
        console.log('🔗 Auto-connecting to AI...');
        await connect({
          model: 'gemini-2.5-flash',
          systemInstruction: `You are FluentFlow, an AI language learning assistant. Always respond in ${targetLanguage || 'English'}.`
        });
      } catch (error) {
        console.error('Failed to connect to AI:', error);
        Alert.alert('Connection Error', 'Failed to connect to the AI service. Please try again.');
        return;
      }
    }

    // Save user message
    console.log('💾 Saving user message to DB');
    const userMessage = await addMessage(conversation.id, 'user', text);
    if (!userMessage) {
      console.error('Failed to save user message');
      return;
    }

    // Clear input
    setMessage('');

    // Send to AI
    try {
      console.log('📤 Sending message to AI:', text);
      sendTextInput(text);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  }, [message, currentConversation, isConnected, connect, createConversation, addMessage, setCurrentConversation, sendTextInput, targetLanguage, updateStreak]);

  const handleSignOut = async () => {
    console.log('🚪 LOGOUT BUTTON PRESSED');
    try {
      const { error } = await signOut();
      if (error) {
        console.log('❌ LOGOUT ERROR:', error);
        Alert.alert('Error', error.message);
      } else {
        console.log('✅ LOGOUT SUCCESSFUL - NAVIGATING TO AUTH');
        router.replace('/auth');
      }
    } catch (err) {
      console.log('💥 LOGOUT EXCEPTION:', err);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleResetSession = useCallback(() => {
    try { close(); } catch {}
    setIsConnected(false);
    setLogs([]);
  }, [close]);

  const handleClearChat = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
  }, [setCurrentConversation, setMessages]);

  useSpeechRecognitionEvent('start', () => {
    appendLog('✅ Speech recognition started - speak now!');
    voiceProcessedRef.current = false; // Reset processing flag
    console.log('🎤 VOICE START - reset processed flag to false');
  });

  useSpeechRecognitionEvent('result', (event: any) => {
    const voiceResultTimestamp = Date.now();
    const transcript = event.results[0]?.transcript || '';
    const isFinal = event.results[0]?.isFinal;
    appendLog(`📝 ${isFinal ? 'Final' : 'Interim'}: "${transcript}"`);
    recognizedTextRef.current = transcript;
  });

  useSpeechRecognitionEvent('end', () => {
    const voiceEndTimestamp = Date.now();
    appendLog('⏹ Speech recognition ended');
    setIsRecording(false);
    const finalText = recognizedTextRef.current.trim();

    console.log('🎤 VOICE END - processed flag:', voiceProcessedRef.current, 'text:', finalText);

    // Prevent duplicate processing
    if (voiceProcessedRef.current) {
      appendLog('⚠️ Voice already processed, skipping');
      console.log('⚠️ VOICE DUPLICATE PREVENTED');
      return;
    }

    if (finalText) {
      appendLog(`✉️ Sending voice: "${finalText}"`);
      console.log('🎤 SETTING VOICE PROCESSED FLAG TO TRUE');
      voiceProcessedRef.current = true;
      handleVoiceMessage(finalText);
    } else {
      appendLog('⚠️ No text recognized');
    }
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    const voiceErrorTimestamp = Date.now();
    appendLog(`❌ Speech error: ${event.error} - ${JSON.stringify(event)}`);
    setIsRecording(false);
  });

  const handleToggleSession = useCallback(async () => {
    if (!isConnected) {
      try {
        await connect({
          model: 'gemini-2.5-flash',
          systemInstruction: `You are an AI language coach. Hold concise, friendly voice conversations. Respond in ${targetLanguage}.`,
        });
      } catch (e: any) {
        appendLog('Connect failed: ' + (e?.message ?? String(e)));
      }
    } else {
      close();
    }
  }, [isConnected, connect, close, appendLog, targetLanguage]);

  const handleReview = useCallback(async () => {
    console.log('🎯 REVIEW BUTTON PRESSED');

    const userMessages = messages.filter((msg: any) => msg.role === 'user');
    if (userMessages.length === 0) {
      Alert.alert('No Messages to Review', 'Please send some messages first before requesting a review.');
      return;
    }

    // Auto-connect if not connected
    if (!isConnected) {
      try {
        console.log('🔗 Auto-connecting for review...');
        await connect({
          model: 'gemini-1.5-flash',
          systemInstruction: `You are FluentFlow, an AI language learning assistant. Always respond in ${preferredLanguage}.`,
        });
        appendLog('✅ Auto-connected for review');
      } catch (e: any) {
        appendLog('❌ Review auto-connect failed: ' + (e?.message ?? String(e)));
        return;
      }
    }

    // Create review prompt with all conversation messages
    const conversationText = userMessages.map(m => m.content).join('\n');
    const reviewPrompt = `Analyze this conversation where the user is practicing ${targetLanguage}. Provide:
1. Strengths (what they're doing well)
2. Areas to improve (specific mistakes or weak areas)  
3. 3-5 personalized exercise suggestions

Conversation messages:
${conversationText}

Respond in ${preferredLanguage} with clear, actionable feedback.`;

    // Set review mode and send the review prompt
    isReviewModeRef.current = true;
    try {
      console.log('🤖 Sending review prompt to AI...');
      sendTextInput(reviewPrompt);
    } catch (error: any) {
      console.log('❌ AI review failed, using sample analysis:', error);
      appendLog('❌ AI review failed: ' + (error?.message ?? String(error)));
      isReviewModeRef.current = false; // Reset on error

      // Fallback to sample analysis
      console.log('📝 Using sample review analysis...');
      const conversationTopics = userMessages.map(m => m.content).join(' ').toLowerCase();
      const hasSpanish = conversationTopics.includes('hola') || conversationTopics.includes('gracias') || conversationTopics.includes('español');
      const hasVerbs = conversationTopics.includes('hablo') || conversationTopics.includes('como') || conversationTopics.includes('hablar');
      const hasQuestions = conversationTopics.includes('?') || conversationTopics.includes('qué') || conversationTopics.includes('cómo');

      let sampleResponse = `Sample Review (AI analysis failed - based on your conversation):\n\n`;

      if (hasSpanish) {
        sampleResponse += `**Strengths:**\n• Good use of basic Spanish greetings and vocabulary\n• Attempting to communicate in the target language\n`;
        if (hasQuestions) sampleResponse += `• Using question words appropriately\n`;
        sampleResponse += `\n**Areas to Improve:**\n`;
        if (!hasVerbs) sampleResponse += `• Verb conjugation practice needed\n`;
        sampleResponse += `• Word order in sentences\n• Pronunciation of rolled 'r' sounds\n\n**Examples from your conversation:**\n`;
        if (userMessages.length > 0) {
          sampleResponse += `"${userMessages[0].content.substring(0, 50)}..."`;
        }
        sampleResponse += `\n\n**Suggested Exercises:**\n1. Practice verb conjugations: "I speak" = "Yo hablo"\n2. Work on sentence structure: Subject + Verb + Object\n3. Listen and repeat Spanish phrases`;
      } else {
        sampleResponse += `**Strengths:**\n• Clear communication in English\n• Good grammar structure\n\n**Areas to Improve:**\n• Expand vocabulary for target language\n• Practice pronunciation\n\n**Suggested Exercises:**\n1. Learn 10 new words in target language\n2. Practice pronunciation with audio\n3. Write simple sentences`;
      }

      setReviewResponse(sampleResponse);
      setShowReviewModal(true);
    }
  }, [preferredLanguage, currentConversation, createConversation, isConnected, connect, sendTextInput, appendLog, addMessage, targetLanguage, messages]);

  const handleGenerateExercises = useCallback(async () => {
    // Check if there are any user messages to analyze
    const userMessages = messages.filter((msg: any) => msg.role === 'user');
    if (userMessages.length === 0) {
      Alert.alert('No Messages to Analyze', 'Please send some messages first to generate exercises.');
      return;
    }

    // Auto-connect if not connected
    if (!isConnected) {
      try {
        console.log('🔗 Auto-connecting for exercises...');
        await connect({
          model: 'gemini-2.5-flash',
          systemInstruction: `You are FluentFlow, an AI language learning assistant. Always respond in ${preferredLanguage}.`,
        });
        appendLog('✅ Auto-connected for exercises');
      } catch (e: any) {
        appendLog('❌ Exercise auto-connect failed: ' + (e?.message ?? String(e)));
        return;
      }
    }

    // Generate sample exercises based on conversation
    const conversationTopics = userMessages.map(m => m.content).join(' ').toLowerCase();
    const hasSpanish = conversationTopics.includes('hola') || conversationTopics.includes('gracias') || conversationTopics.includes('español');
    const hasVerbs = conversationTopics.includes('hablo') || conversationTopics.includes('como') || conversationTopics.includes('hablar');

    let exercises = `Personalized Exercises (based on your conversation):\n\n`;

    if (hasSpanish) {
      exercises += `1. **Verb Conjugation Practice**\nConjugate these verbs in present tense:\n- Hablar (to speak): Yo ______, Tú ______, Él ______\n- Comer (to eat): Yo ______, Tú ______, Él ______\n\n`;
      exercises += `2. **Word Order Correction**\nFix the word order in these sentences:\n- "Come el perro" → ______\n- "Habla español yo" → ______\n\n`;
      exercises += `3. **Vocabulary Building**\nLearn and use 5 new Spanish words in sentences.\n\n`;
      exercises += `4. **Pronunciation Practice**\nRecord yourself saying: "La casa roja" (focus on rolled 'r').\n\n`;
      exercises += `5. **Listening Comprehension**\nListen to a Spanish podcast and summarize one main idea.`;
    } else {
      exercises += `1. **Basic Greetings**\nLearn and practice: Hello, Goodbye, Thank you, Please.\n\n`;
      exercises += `2. **Simple Sentences**\nWrite 10 sentences about yourself using basic vocabulary.\n\n`;
      exercises += `3. **Question Formation**\nPractice asking questions: What, Where, When, Who, Why.\n\n`;
      exercises += `4. **Numbers and Time**\nLearn numbers 1-20 and tell time in target language.\n\n`;
      exercises += `5. **Daily Vocabulary**\nLearn 15 words for: Food, Family, Colors, Animals.`;
    }

    setExerciseContent(exercises);
    setShowExerciseModal(true);
  }, [preferredLanguage, targetLanguage, currentConversation, createConversation, isConnected, connect, sendTextInput, appendLog, messages]);

  const handleVoiceMessage = useCallback(async (text: string) => {
    console.log('🎤 HANDLING VOICE MESSAGE:', text);

    // Create conversation if none exists
    let conversation = currentConversation;
    if (!conversation) {
      console.log('🎤 Creating conversation for voice message');
      conversation = await createConversation('Voice Message', text);
      if (!conversation) {
        console.log('❌ Failed to create conversation for voice');
        return;
      }
    }

    // Auto-connect if not connected
    if (!isConnected) {
      try {
        console.log('🔗 Connecting to AI for voice message');
        appendLog('🔗 Auto-connecting for voice message...');
        await connect({
          model: 'gemini-2.5-flash',
          systemInstruction: `You are FluentFlow, an AI language learning assistant. Hold concise, friendly voice conversations. Respond in ${targetLanguage}.`,
        });
        appendLog('✅ Auto-connected for voice');
      } catch (e: any) {
        console.log('❌ Voice connect error:', e);
        appendLog('❌ Voice auto-connect failed: ' + (e?.message ?? String(e)));
        return;
      }
    }

    // Save user message
    console.log('💾 Saving voice message to DB');
    await addMessage(conversation.id, 'user', text);
    recognizedTextRef.current = '';

    // Send to AI
    try {
      console.log('📤 Sending voice text to AI:', text);
      sendTextInput(text);
    } catch (e: any) {
      console.log('❌ Voice send error:', e);
      appendLog('❌ Voice send failed: ' + (e?.message ?? String(e)));
    }
    if (languageChangedRef.current && isConnected) {
      console.log('🌍 Language changed, reconnecting Gemini...');
      close();
      // Wait a bit for close to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      connect();
      languageChangedRef.current = false;
      // Wait for connection to establish
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!text) {
      console.log(`📤 [${Date.now()}] NO TEXT - returning early`);
      return;
    }

    console.log(`📤 [${Date.now()}] TEXT FOUND - proceeding with:`, text);

    // Create conversation if none exists
    let targetConversation = currentConversation;
    if (!targetConversation) {
      console.log('📤 handleSend: no current conversation, creating one');
      targetConversation = await createConversation(text.substring(0, 50) + '...', text);
      if (!targetConversation) {
        console.log('📤 handleSend: failed to create conversation');
        return;
      }
    }

    // Auto-connect if not connected
    if (!isConnected) {
      try {
        appendLog('🔗 Auto-connecting to AI session...');
        await connect({
          model: 'gemini-2.5-flash',
          systemInstruction: `You are FluentFlow, an AI language learning assistant. Hold concise, friendly voice conversations. Respond in ${targetLanguage}.`,
        });
        appendLog('✅ Auto-connected successfully');
      } catch (e: any) {
        appendLog('❌ Auto-connect failed: ' + (e?.message ?? String(e)));
        Alert.alert('Connection Error', 'Failed to connect to AI. Please try again.');
        return;
      }
    }

    // Save user message
    await addMessage(conversation.id, 'user', text);

    // Clear input and send to AI
    setMessage('');
    try {
      const timestamp = Date.now();
      console.log(`📤 [${timestamp}] SENDING TEXT TO AI:`, text);
      sendTextInput(text);
    } catch (e: any) {
      console.log('❌ TEXT SEND ERROR:', e);
      appendLog('❌ Send failed: ' + (e?.message ?? String(e)));
    }
  }, [message, currentConversation, isConnected, createConversation, connect, close, preferredLanguage, appendLog, addMessage, languageChangedRef]);

  const handleSelectConversation = useCallback(async (conversation: any) => {
    console.log('📂 Selecting conversation:', conversation?.title, 'ID:', conversation?.id);
    setCurrentConversation(conversation);
    await loadMessages(conversation.id);
    console.log('📂 Messages loaded for conversation');
  }, [setCurrentConversation, loadMessages]);

  const handleSelectStarterPrompt = useCallback(async (prompt: any) => {
    // Check if language changed and we need to reconnect
    if (languageChangedRef.current && isConnected) {
      console.log('🌍 Language changed, reconnecting Gemini before starter prompt...');
      close();
      await new Promise(resolve => setTimeout(resolve, 300));
      connect();
      languageChangedRef.current = false;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Create conversation with the prompt title
    const conversation = await createConversation(prompt.title);

    if (conversation) {
      // Send context instruction to Gemini to ask questions about the topic
      const contextInstruction = `Let's practice talking about ${prompt.title.toLowerCase()}. Ask the user engaging questions to start a natural conversation about this topic. Be conversational and encouraging.`;

      // Auto-connect and send the context instruction
      if (!isConnected) {
        try {
          appendLog('🔗 Auto-connecting for starter prompt...');
          await connect({
            model: 'gemini-2.5-flash',
            systemInstruction: `You are FluentFlow, an AI language learning assistant. Always respond in ${preferredLanguage || 'English'}. When given a conversation starter, engage the user by asking thoughtful questions and having a natural conversation. Don't just provide information - ask questions to learn about them and practice their language skills. Be friendly, encouraging, and conversational.`,
          });
        } catch (e: any) {
          console.log('❌ Auto-connect error:', e);
          appendLog('❌ Auto-connect failed: ' + (e?.message ?? String(e)));
          return;
        }
      }

      // Save the context instruction as user message and send to Gemini
      await addMessage(conversation.id, 'user', contextInstruction);
      try {
        appendLog(`💬 Starting conversation about: ${prompt.title}`);
        sendTextInput(contextInstruction);
      } catch (e: any) {
        console.log('❌ Starter prompt send error:', e);
        appendLog('❌ Send failed: ' + (e?.message ?? String(e)));
      }
    }
  }, [createConversation, isConnected, connect, close, addMessage, sendTextInput, appendLog, preferredLanguage, targetLanguage, languageChangedRef]);

  const handleVoiceInput = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule) {
      appendLog('ERROR: Speech module not loaded. Try: npx expo start -c');
      Alert.alert('Module Error', 'Speech recognition not available. Restart Metro with: npx expo start -c');
      return;
    }
    if (!isRecording) {
      try {
        appendLog('🎤 Requesting speech permission...');
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        appendLog(`Permission result: ${JSON.stringify(result)}`);
        if (!result.granted) {
          appendLog('❌ Speech recognition permission denied');
          Alert.alert('Permission Denied', 'Please enable speech recognition in Settings');
          return;
        }
        const lang = preferredLanguage === 'Spanish' ? 'es-ES' : preferredLanguage === 'French' ? 'fr-FR' : 'en-US';
        appendLog(`🎙 Starting recognition (${lang})...`);
        await ExpoSpeechRecognitionModule.start({
          lang,
          interimResults: true,
          maxAlternatives: 1,
          continuous: false,
        });
        setIsRecording(true);
        appendLog('🔴 Recording... speak now!');
      } catch (e: any) {
        appendLog('❌ Start error: ' + (e?.message ?? String(e)));
        Alert.alert('Error', 'Failed to start recording: ' + (e?.message ?? String(e)));
      }
    } else {
      try {
        appendLog('⏹ Stopping recognition...');
        ExpoSpeechRecognitionModule.stop();
      } catch (e: any) {
        appendLog('❌ Stop error: ' + (e?.message ?? String(e)));
        setIsRecording(false);
      }
    }
  }, [isRecording, preferredLanguage, appendLog]);

  const handleSubmitReview = useCallback(async () => {
    console.log('🎯 FEEDBACK SUBMIT FUNCTION CALLED');
    console.log('🎯 FEEDBACK SUBMIT STARTED');
    
    // Log what Constants actually contains
    console.log('📋 Constants object:', Constants);
    console.log('📋 expoConfig:', Constants?.expoConfig);
    console.log('📋 extra:', Constants?.expoConfig?.extra);
    
    const url = (Constants?.expoConfig?.extra as any)?.SUPABASE_URL as string | undefined;
    const anon = (Constants?.expoConfig?.extra as any)?.SUPABASE_ANON_KEY as string | undefined;
    
    console.log('🔍 URL value:', url);
    console.log('🔍 KEY value:', anon ? anon.substring(0, 20) + '...' : 'undefined');
    
    appendLog(`🔍 DEBUG - URL loaded: ${url ? 'YES (' + url.substring(0, 30) + '...)' : 'NO'}`);
    appendLog(`🔍 DEBUG - Key loaded: ${anon ? 'YES (' + anon.substring(0, 10) + '...)' : 'NO'}`);
    
    console.log('🔍 URL:', url ? 'LOADED' : 'MISSING');
    console.log('🔍 KEY:', anon ? 'LOADED' : 'MISSING');
    
    if (!url || !anon || url.includes('REPLACE_WITH') || anon.includes('REPLACE_WITH') || url.includes('your_new') || anon.includes('your_new')) {
      appendLog('❌ ERROR: Invalid configuration - keys not properly set in .env');
      console.log('❌ CONFIG ERROR DETECTED');
      Alert.alert('Configuration Error', 'Please set proper API keys in .env file');
      return;
    }
    
    if (!feedbackComment.trim()) {
      Alert.alert('Missing Comment', 'Please add a comment with your feedback');
      return;
    }
    
    const table = 'reviews';
    const payload = {
      rating,
      comment: feedbackComment.trim(),
      created_at: new Date().toISOString(),
    };
    
    appendLog(`📤 Sending feedback: ${rating} stars, "${feedbackComment.substring(0, 30)}..."`);
    
    try {
      const fullUrl = `${url}/rest/v1/${table}`;
      console.log('🌐 FULL REQUEST URL:', fullUrl);
      console.log('📤 REQUEST PAYLOAD:', JSON.stringify(payload, null, 2));
      
      appendLog(`🎯 Target URL: ${fullUrl}`);
      
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon,
          Authorization: `Bearer ${anon}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('📊 RESPONSE STATUS:', res.status);
      console.log('📊 RESPONSE STATUS TEXT:', res.statusText);
      console.log('📊 RESPONSE HEADERS:', Object.fromEntries(res.headers.entries()));
      
      appendLog(`📊 Response status: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        const errText = await res.text();
        console.log('❌ ERROR RESPONSE BODY:', errText);
        appendLog(`❌ Supabase error ${res.status}: ${errText}`);
        Alert.alert('Submission Failed', `Server error ${res.status}: ${errText.substring(0, 100)}`);
      } else {
        console.log('✅ REQUEST SUCCESSFUL');
        appendLog('✅ Feedback submitted successfully!');
        Alert.alert('Success', 'Thank you for your feedback!');
        setShowFeedbackModal(false);
        setRating(5);
        setFeedbackComment('');
      }
    } catch (e: any) {
      console.log('💥 NETWORK ERROR:', e);
      console.log('💥 ERROR MESSAGE:', e?.message);
      console.log('💥 ERROR STACK:', e?.stack);
      appendLog(`❌ Network error: ${e?.message ?? String(e)}`);
      Alert.alert('Network Error', `Failed to connect: ${e?.message ?? 'Check your internet connection'}`);
    }
  }, [rating, feedbackComment, appendLog]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.streakContainer}>
            <View style={styles.streakItem}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={styles.streakLabel}>Day{currentStreak !== 1 ? 's' : ''}</Text>
            </View>
            <View style={[styles.streakItem, { marginLeft: 8 }]}>
              <Text style={styles.streakEmoji}>🏆</Text>
              <Text style={[styles.streakNumber, { color: '#4CAF50' }]}>{longestStreak}</Text>
              <Text style={styles.streakLabel}>Best</Text>
            </View>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.title} numberOfLines={1}>{t('app.name')}</Text>
          </View>
          <Pressable style={styles.menuButton} onPress={() => setShowConversationList(true)}>
            <Text style={styles.menuText}>📋</Text>
          </Pressable>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.settingsButton} onPress={() => {
            setTempPreferredLanguage(preferredLanguage);
            setTempTargetLanguage(targetLanguage);
            setShowSettingsModal(true);
          }}>
            <Text style={styles.settingsText}>⚙️</Text>
          </Pressable>
          <Pressable style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutText}>🚪</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.extraControls}>
        <Pressable style={[styles.smallButton, styles.reviewButton]} onPress={handleReview}>
          <Text style={styles.smallButtonText}>{t('chat.review')}</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={handleResetSession}>
          <Text style={styles.smallButtonText}>{t('chat.reset')}</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={handleClearChat}>
          <Text style={styles.smallButtonText}>{t('chat.clear')}</Text>
        </Pressable>
        <Pressable
          style={[styles.smallButton, ttsEnabled && styles.ttsEnabled]}
          onPress={() => setTtsEnabled(!ttsEnabled)}
        >
          <Text style={styles.smallButtonText}>
            {ttsEnabled ? t('settings.ttsOn') : t('settings.ttsOff')}
          </Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={() => setShowFeedbackModal(true)}>
          <Text style={styles.smallButtonText}>{t('chat.feedback')}</Text>
        </Pressable>
        <Pressable style={[styles.smallButton, styles.exerciseButton]} onPress={handleGenerateExercises}>
          <Text style={styles.smallButtonText}>🏋️ Exercice</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.chatArea, { paddingTop: 20 }]}>
        {messages.length > 0 ? (
          messages.map((msg, i) => (
            <View key={msg.id || i} style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
              <Text style={styles.bubbleText}>{msg.content}</Text>
            </View>
          ))
        ) : (
          console.log('🎯 Showing starter prompts, messages.length:', messages.length, 'messages:', messages) || <StarterPrompts onSelectPrompt={handleSelectStarterPrompt} />
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {/* Session button hidden - auto-connect now */}
        <Pressable style={styles.iconButton} onPress={handleVoiceInput}>
          <Text style={styles.iconText}>{isRecording ? '⏹' : '🎤'}</Text>
        </Pressable>
        <TextInput
          style={styles.chatInput}
          value={message}
          onChangeText={setMessage}
          placeholder={t('chat.typeMessage')}
          placeholderTextColor="#9CA3AF"
          multiline={false}
          blurOnSubmit={false}
        />
        <Pressable style={styles.sendButton} onPress={() => handleSend('button')}>
          <Text style={styles.sendButtonText}>➤</Text>
        </Pressable>
      </View>

      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Your Feedback</Text>
            
            <Text style={styles.ratingLabel}>Rate your experience:</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Text style={styles.starText}>
                    {star <= rating ? '⭐' : '☆'}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            <Text style={styles.commentLabel}>Comments:</Text>
            <TextInput
              style={styles.commentInput}
              value={feedbackComment}
              onChangeText={setFeedbackComment}
              placeholder="Tell us what you think..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitReview}
              >
                <Text style={styles.modalButtonText}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.title')}</Text>

            <ScrollView style={styles.settingsScroll}>
              <LanguageSelection
                title={t('settings.nativeLanguage')}
                selectedLanguage={tempPreferredLanguage}
                onSelectLanguage={setTempPreferredLanguage}
              />

              <LanguageSelection
                title={t('settings.targetLanguage')}
                selectedLanguage={tempTargetLanguage}
                onSelectLanguage={setTempTargetLanguage}
              />

              {/* Notification Settings */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Daily Reminder</Text>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleNotificationToggle}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
                  />
                </View>
                
                {notificationsEnabled && (
                  <View style={styles.timePickerContainer}>
                    <Text style={styles.timeLabel}>Reminder Time</Text>
                    <Pressable 
                      style={styles.timePickerButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={styles.timeText}>
                        {notificationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Pressable>
                    {showTimePicker && (
                      <DateTimePicker
                        value={notificationTime}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleTimeChange}
                      />
                    )}
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('settings.textToSpeech')}</Text>
                <Pressable
                  style={[styles.ttsButton, ttsEnabled && styles.ttsEnabled]}
                  onPress={() => setTtsEnabled(!ttsEnabled)}
                >
                  <Text style={styles.ttsButtonText}>
                    {ttsEnabled ? t('settings.ttsOn') : t('settings.ttsOff')}
                  </Text>
                </Pressable>

                </View>

              {/* Notification Settings */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
                
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{t('settings.dailyReminder')}</Text>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={toggleNotifications}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
                  />
                </View>

                {notificationsEnabled && (
                  <View style={styles.timePickerContainer}>
                    <Text style={styles.timePickerLabel}>{t('settings.reminderTime')}</Text>
                    <Pressable 
                      style={styles.timePickerButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={styles.timePickerText}>
                        {notificationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Pressable>
                    {showTimePicker && (
                      <DateTimePicker
                        value={notificationTime}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleTimeChange}
                      />
                    )}
                  </View>
                )}
              </View>

              {/* Debug button */}
              <View style={styles.settingsSection}>
                <Pressable
                  style={[styles.ttsButton, { backgroundColor: '#F59E0B', marginTop: 10 }]}
                  onPress={async () => {
                    console.log('🔍 TESTING DATABASE CONNECTION');
                    try {
                      const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
                      console.log('📊 Database test result:', { data, error });
                      Alert.alert('Database Test', error ? `Error: ${error.message}` : 'Database connected successfully!');
                    } catch (err) {
                      console.log('💥 Database test error:', err);
                      Alert.alert('Database Test Failed', `Error: ${err}`);
                    }
                  }}
                >
                  <Text style={styles.ttsButtonText}>🔍 Test DB</Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.modalButtonText}>{t('settings.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={async () => {
                  console.log('💾 SAVE BUTTON PRESSED');
                  console.log('📊 Current values:', { tempPreferredLanguage, tempTargetLanguage });
                  console.log('🔗 updateLanguages function:', !!updateLanguages);

                  if (updateLanguages) {
                    try {
                      const result = await updateLanguages(tempPreferredLanguage, tempTargetLanguage);
                      console.log('🔄 updateLanguages result:', result);

                      if (result.error) {
                        console.log('❌ Update failed:', result.error);
                        Alert.alert(t('settings.updateFailed'), `Error: ${result.error}\n\nCheck console logs for details.`);
                      } else {
                        console.log('✅ Update successful');
                        Alert.alert(t('settings.languagesUpdated'), t('settings.languagesUpdated'));
                        setShowSettingsModal(false);
                      }
                    } catch (error) {
                      console.log('💥 Unexpected error in save:', error);
                      Alert.alert(t('settings.updateFailed'), `Something went wrong: ${error}`);
                    }
                  } else {
                    console.log('❌ updateLanguages function not available');
                    Alert.alert(t('settings.updateFailed'), 'Update function not available');
                  }
                }}
              >
                <Text style={styles.modalButtonText}>{t('settings.saveChanges')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
