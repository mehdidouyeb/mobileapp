import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, TextInput, Platform, Alert, Modal } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useGemini } from '../hooks/useGemini';
import { useAuth } from '../contexts/AuthContext';
import { useConversations } from '../hooks/useConversations';
import { ConversationList } from '../components/ConversationList';
import { StarterPrompts } from '../components/StarterPrompts';
import { router } from 'expo-router';

export default function HomeScreen() {
  console.log('🚀 APP STARTED - Constants available:', !!Constants);
  console.log('🚀 ExpoConfig:', Constants?.expoConfig);
  console.log('🚀 Extra:', Constants?.expoConfig?.extra);

  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const languages = ['English', 'Spanish', 'French'];
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showConversationList, setShowConversationList] = useState(false);
  const recognizedTextRef = useRef('');
  const voiceProcessedRef = useRef(false);

  const { signOut } = useAuth();

  const appendLog = useCallback((msg: string) => {
    setLogs(prev => [new Date().toLocaleTimeString() + ' ' + msg, ...prev].slice(0, 200));
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
    } else {
      console.log(`🤖 [${timestamp}] Refs not ready - conversation:`, !!currentConversationRef.current, 'addMessage:', !!addMessageRef.current);
    }
  }, [appendLog]);

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

  const { connect, sendTextInput, close } = useGemini(onAIMessage, onAIError, onAIClose, onAIOpen);
  const {
    currentConversation,
    messages,
    createConversation,
    addMessage,
    loadMessages,
    setCurrentConversation,
    setMessages
  } = useConversations();

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
          systemInstruction: `You are an AI language coach. Hold concise, friendly voice conversations. Respond in ${selectedLanguage}.`,
        });
      } catch (e: any) {
        appendLog('Connect failed: ' + (e?.message ?? String(e)));
      }
    } else {
      close();
    }
  }, [isConnected, connect, close, appendLog, selectedLanguage]);

  const handleReview = useCallback(async () => {
    const prompt = `Please review my last utterance in ${selectedLanguage}. Identify mistakes and suggest corrections with brief explanations.`;

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
          systemInstruction: `You are Fluent Flo, an AI language learning assistant. Hold concise, friendly voice conversations. Respond in ${selectedLanguage}.`,
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
  }, [selectedLanguage, currentConversation, createConversation, isConnected, connect, sendTextInput, appendLog, addMessage]);

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
          systemInstruction: `You are Fluent Flo, an AI language learning assistant. Hold concise, friendly voice conversations. Respond in ${selectedLanguage}.`,
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
  }, [currentConversation, isConnected, createConversation, connect, sendTextInput, selectedLanguage, appendLog, addMessage]);

  const handleSend = useCallback(async (source = 'unknown') => {
    const timestamp = Date.now();
    console.log(`📤 [${timestamp}] handleSend called from: ${source}`);
    console.log(`📤 [${timestamp}] Current message state:`, message);
    console.log(`📤 [${timestamp}] Message length:`, message.length);

    const text = message.trim();
    console.log(`📤 [${timestamp}] Trimmed text:`, text);

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
          systemInstruction: `You are Fluent Flo, an AI language learning assistant. Hold concise, friendly voice conversations. Respond in ${selectedLanguage}.`,
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
  }, [message, currentConversation, isConnected, createConversation, connect, sendTextInput, selectedLanguage, appendLog, addMessage]);

  const handleSelectConversation = useCallback(async (conversation: any) => {
    console.log('📂 Selecting conversation:', conversation?.title, 'ID:', conversation?.id);
    setCurrentConversation(conversation);
    await loadMessages(conversation.id);
    console.log('📂 Messages loaded for conversation');
  }, [setCurrentConversation, loadMessages]);

  const handleSelectStarterPrompt = useCallback(async (prompt: any) => {
    // Create conversation with the prompt
    const conversation = await createConversation(prompt.title, prompt.prompt);
    if (conversation) {
      // Auto-connect and send the prompt
      if (!isConnected) {
        try {
          appendLog('🔗 Auto-connecting for starter prompt...');
          await connect({
            model: 'gemini-2.5-flash',
            systemInstruction: `You are Fluent Flo, an AI language learning assistant. Hold concise, friendly voice conversations. Respond in ${selectedLanguage}.`,
          });
          appendLog('✅ Auto-connected for starter prompt');
        } catch (e: any) {
          appendLog('❌ Starter prompt auto-connect failed: ' + (e?.message ?? String(e)));
          return;
        }
      }

      // Send the starter prompt to AI
      try {
        sendTextInput(prompt.prompt);
      } catch (e: any) {
        appendLog('❌ Starter prompt send failed: ' + (e?.message ?? String(e)));
      }
    }
  }, [createConversation, isConnected, connect, sendTextInput, selectedLanguage, appendLog]);

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
        const lang = selectedLanguage === 'Spanish' ? 'es-ES' : selectedLanguage === 'French' ? 'fr-FR' : 'en-US';
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
  }, [isRecording, selectedLanguage, appendLog]);

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
          <Text style={styles.title}>Fluent Flo</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.langRow}>
            {languages.map((lang) => (
              <Pressable key={lang} style={[styles.chipSmall, selectedLanguage === lang && styles.chipSelected]} onPress={() => setSelectedLanguage(lang)}>
                <Text style={styles.chipText}>{lang.slice(0,2)}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutText}>🚪</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.chatArea}>
        {messages.length > 0 ? (
          messages.map((msg, i) => (
            <View key={msg.id || i} style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
              <Text style={styles.bubbleText}>{msg.content}</Text>
            </View>
          ))
        ) : (
          console.log('🎯 Showing starter prompts, messages.length:', messages.length) || <StarterPrompts onSelectPrompt={handleSelectStarterPrompt} />
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
          placeholder="Type your message..."
          placeholderTextColor="#9CA3AF"
          multiline={false}
          blurOnSubmit={false}
        />
        <Pressable style={styles.sendButton} onPress={() => handleSend('button')}>
          <Text style={styles.sendButtonText}>➤</Text>
        </Pressable>
      </View>

      <View style={styles.extraControls}>
        <Pressable style={styles.smallButton} onPress={handleReview}>
          <Text style={styles.smallButtonText}>Review</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={handleResetSession}>
          <Text style={styles.smallButtonText}>Reset</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={handleClearChat}>
          <Text style={styles.smallButtonText}>Clear</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={() => setShowFeedbackModal(true)}>
          <Text style={styles.smallButtonText}>💬 Feedback</Text>
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
  langRow: { flexDirection: 'row', gap: 6 },
  chipSmall: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 9999, backgroundColor: '#374151' },
  chipSelected: { backgroundColor: '#2563EB' },
  chipText: { color: 'white', fontSize: 12, fontWeight: '600' },
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
});
