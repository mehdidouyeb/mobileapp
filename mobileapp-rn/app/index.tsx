import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, TextInput, Platform, Alert, Modal } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import * as Speech from 'expo-speech';
import { useGemini } from '../hooks/useGemini';
import { useAuth } from '../contexts/AuthContext';
import { useConversations } from '../hooks/useConversations';
import { ConversationList } from '../components/ConversationList';
import { StarterPrompts } from '../components/StarterPrompts';
import { LanguageSelection } from '../components/LanguageSelection';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempPreferredLanguage, setTempPreferredLanguage] = useState('');
  const [tempTargetLanguage, setTempTargetLanguage] = useState('');
  const recognizedTextRef = useRef('');
  const voiceProcessedRef = useRef(false);

  const { signOut, preferredLanguage, targetLanguage, updateLanguages } = useAuth();
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

  // Define callbacks with refs
  const onAIMessage = useCallback(async (evt: any) => {
    const timestamp = Date.now();
    console.log(`🤖 [${timestamp}] AI MESSAGE RECEIVED:`, evt);
    console.log(`🤖 [${timestamp}] Current conversation:`, currentConversationRef.current?.id);
    appendLog('AI message received');
    const text = typeof evt === 'string' ? evt : (evt?.text ?? JSON.stringify(evt));

    if (currentConversationRef.current && addMessageRef.current) {
      console.log(`🤖 [${timestamp}] Adding message to conversation:`, currentConversationRef.current.id);
      await addMessageRef.current(currentConversationRef.current.id, 'assistant', text);
      console.log(`🤖 [${timestamp}] Message added successfully`);

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
      console.log(`🤖 [${timestamp}] Refs not ready - conversation:`, !!currentConversationRef.current, 'addMessage:', !!addMessageRef.current);
    }
  }, [appendLog, ttsEnabled, preferredLanguage]);

  const onAIError = useCallback((err: any) => {
    const timestamp = Date.now();
    console.log(`❌ [${timestamp}] AI ERROR:`, err);
    const msg = 'AI error: ' + (err?.message ?? String(err));
    appendLog(msg);
    if (currentConversationRef.current && addMessageRef.current) {
      addMessageRef.current(currentConversationRef.current.id, 'system', msg);
    }
  }, [appendLog]);

  const onAIClose = useCallback(() => {
    const timestamp = Date.now();
    console.log(`🔌 [${timestamp}] AI CONNECTION CLOSED`);
    setIsConnected(false);
    appendLog('AI session closed');
  }, [appendLog]);

  const onAIOpen = useCallback(() => {
    const timestamp = Date.now();
    console.log(`🔌 [${timestamp}] AI CONNECTION OPENED`);
    setIsConnected(true);
    appendLog('AI session open');
  }, [appendLog]);

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
    const transcript = event.results[0]?.transcript || '';
    const isFinal = event.results[0]?.isFinal;
    appendLog(`📝 ${isFinal ? 'Final' : 'Interim'}: "${transcript}"`);
    recognizedTextRef.current = transcript;
  });

  useSpeechRecognitionEvent('end', () => {
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
    const prompt = `Please review my last utterance in ${preferredLanguage}. Identify mistakes and suggest corrections with brief explanations.`;

    // Create conversation if none exists
    let conversation = currentConversation;
    if (!conversation) {
      conversation = await createConversation('Review Session', prompt);
      if (!conversation) return;
    }

    // Auto-connect if not connected
    if (!isConnected) {
      try {
        appendLog('🔗 Auto-connecting for review...');
        await connect({
          model: 'gemini-2.5-flash',
          systemInstruction: `You are Fluent Flo, an AI language learning assistant. Hold concise, friendly voice conversations. Respond in ${targetLanguage}.`,
        });
        appendLog('✅ Auto-connected for review');
      } catch (e: any) {
        appendLog('❌ Review auto-connect failed: ' + (e?.message ?? String(e)));
        return;
      }
    }

    // Save and send the review prompt
    await addMessage(conversation.id, 'user', prompt);
    try {
      sendTextInput(prompt);
    } catch (e: any) {
      appendLog('❌ Review send failed: ' + (e?.message ?? String(e)));
    }
  }, [preferredLanguage, currentConversation, createConversation, isConnected, connect, sendTextInput, appendLog, addMessage, targetLanguage]);

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
          systemInstruction: `You are Fluent Flo, an AI language learning assistant. Hold concise, friendly voice conversations. Respond in ${targetLanguage}.`,
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
  }, [currentConversation, isConnected, createConversation, connect, sendTextInput, preferredLanguage, appendLog, addMessage, targetLanguage]);

  const handleSend = useCallback(async (source = 'unknown') => {
    const timestamp = Date.now();
    console.log(`📤 [${timestamp}] handleSend called from: ${source}`);
    console.log(`📤 [${timestamp}] Current message state:`, message);
    console.log(`📤 [${timestamp}] Message length:`, message.length);

    const text = message.trim();
    console.log(`📤 [${timestamp}] Trimmed text:`, text);

    // Check if language changed and we need to reconnect
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
      console.log(`📤 [${timestamp}] NO TEXT - returning early`);
      return;
    }

    console.log(`📤 [${timestamp}] TEXT FOUND - proceeding with:`, text);

    // Create conversation if none exists
    let conversation = currentConversation;
    if (!conversation) {
      console.log('📤 handleSend: no current conversation, creating one');
      conversation = await createConversation(text.substring(0, 50) + '...', text);
      if (!conversation) {
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
          systemInstruction: `You are Fluent Flo, an AI language learning assistant. Hold concise, friendly voice conversations. Respond in ${targetLanguage}.`,
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
            systemInstruction: `You are Fluent Flo, an AI language learning assistant. Always respond in ${preferredLanguage || 'English'}. When given a conversation starter, engage the user by asking thoughtful questions and having a natural conversation. Don't just provide information - ask questions to learn about them and practice their language skills. Be friendly, encouraging, and conversational.`,
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
          <Pressable style={styles.menuButton} onPress={() => setShowConversationList(true)}>
            <Text style={styles.menuText}>📋</Text>
          </Pressable>
          <Text style={styles.title}>{t('app.name')}</Text>
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
        <Pressable style={styles.smallButton} onPress={handleReview}>
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
      </View>

      <ScrollView contentContainerStyle={styles.chatArea}>
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

              <View style={styles.ttsSection}>
                <Text style={styles.ttsTitle}>{t('settings.textToSpeech')}</Text>
                <Pressable
                  style={[styles.ttsButton, ttsEnabled && styles.ttsEnabled]}
                  onPress={() => setTtsEnabled(!ttsEnabled)}
                >
                  <Text style={styles.ttsButtonText}>
                    {ttsEnabled ? t('settings.ttsOn') : t('settings.ttsOff')}
                  </Text>
                </Pressable>

                {/* Debug button */}
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

      <ConversationList
        visible={showConversationList}
        onClose={() => {
          console.log('🟥 CONVERSATION LIST onClose called - setting showConversationList to false');
          setShowConversationList(false);
        }}
        onSelectConversation={handleSelectConversation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b1020' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1a1f3a', borderBottomWidth: 1, borderBottomColor: '#2a2f4a' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuButton: { padding: 8 },
  menuText: { fontSize: 18 },
  title: { fontSize: 20, fontWeight: '700', color: 'white' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsButton: { padding: 8 },
  settingsText: { fontSize: 18 },
  logoutButton: { padding: 8 },
  logoutText: { fontSize: 18 },
  chatArea: { padding: 16, gap: 8 },
  bubble: { maxWidth: '80%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: '#2563EB' },
  bubbleAI: { alignSelf: 'flex-start', backgroundColor: '#374151' },
  bubbleText: { color: 'white', fontSize: 15 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#1a1f3a', borderTopWidth: 1, borderTopColor: '#2a2f4a', gap: 8 },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#374151', borderRadius: 20 },
  iconText: { fontSize: 20 },
  chatInput: { flex: 1, backgroundColor: '#111827', color: 'white', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, fontSize: 15 },
  sendButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 20 },
  sendButtonText: { color: 'white', fontSize: 20, fontWeight: '700' },
  extraControls: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8, backgroundColor: '#0b1020' },
  smallButton: { flex: 1, paddingVertical: 8, backgroundColor: '#374151', borderRadius: 8, alignItems: 'center' },
  smallButtonText: { color: 'white', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1a1f3a', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: 'white', marginBottom: 20, textAlign: 'center' },
  ratingLabel: { fontSize: 16, color: '#D1D5DB', marginBottom: 12, fontWeight: '600' },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  starButton: { padding: 4 },
  starText: { fontSize: 36 },
  commentLabel: { fontSize: 16, color: '#D1D5DB', marginBottom: 8, fontWeight: '600' },
  commentInput: { backgroundColor: '#0b1020', color: 'white', borderRadius: 8, padding: 12, fontSize: 15, minHeight: 100, borderWidth: 1, borderColor: '#374151', marginBottom: 24 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#374151' },
  submitButton: { backgroundColor: '#2563EB' },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  settingsScroll: { maxHeight: 400 },
  ttsSection: { marginTop: 20, paddingHorizontal: 20 },
  ttsTitle: { fontSize: 18, fontWeight: '600', color: '#D1D5DB', marginBottom: 12, textAlign: 'center' },
  ttsButton: { backgroundColor: '#374151', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  ttsButtonText: { color: '#D1D5DB', fontSize: 16, fontWeight: '600' },
  saveButton: { backgroundColor: '#10B981' },
  ttsEnabled: {
    backgroundColor: '#10B981', // Green when enabled
  },
});
