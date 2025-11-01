import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, TextInput, Platform, Alert, Modal } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useGemini } from '../hooks/useGemini';

export default function HomeScreen() {
  console.log('🚀 APP STARTED - Constants available:', !!Constants);
  console.log('🚀 ExpoConfig:', Constants?.expoConfig);
  console.log('🚀 Extra:', Constants?.expoConfig?.extra);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const languages = ['English', 'Spanish', 'French'];
  const [history, setHistory] = useState<{ role: 'user' | 'ai' | 'system' | 'log'; text: string; ts: number }[]>([]);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const recognizedTextRef = useRef('');

  const appendLog = useCallback((msg: string) => {
    setLogs(prev => [new Date().toLocaleTimeString() + ' ' + msg, ...prev].slice(0, 200));
  }, []);

  const handleResetSession = useCallback(() => {
    try { close(); } catch {}
    setIsConnected(false);
    setLogs([]);
  }, [close]);

  const handleClearChat = useCallback(() => {
    setHistory([]);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('history');
        if (stored) setHistory(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('history', JSON.stringify(history.slice(0, 200)));
      } catch {}
    })();
  }, [history]);

  const onAIMessage = useCallback((evt: any) => {
    appendLog('AI message received');
    const text = typeof evt === 'string' ? evt : (evt?.text ?? JSON.stringify(evt));
    setHistory(prev => [{ role: 'ai', text, ts: Date.now() }, ...prev].slice(0, 200));
  }, [appendLog]);

  const onAIError = useCallback((err: any) => {
    const msg = 'AI error: ' + (err?.message ?? String(err));
    appendLog(msg);
    setHistory(prev => [{ role: 'log', text: msg, ts: Date.now() }, ...prev].slice(0, 200));
  }, [appendLog]);

  const onAIClose = useCallback(() => {
    setIsConnected(false);
    appendLog('AI session closed');
  }, [appendLog]);

  const onAIOpen = useCallback(() => {
    setIsConnected(true);
    appendLog('AI session open');
  }, [appendLog]);

  const { connect, sendTextInput, close } = useGemini(onAIMessage, onAIError, onAIClose, onAIOpen);

  useSpeechRecognitionEvent('start', () => {
    appendLog('✅ Speech recognition started - speak now!');
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
    if (finalText) {
      appendLog(`✉️ Sending: "${finalText}"`);
      setHistory(prev => [{ role: 'user', text: finalText, ts: Date.now() }, ...prev].slice(0, 200));
      sendTextInput(finalText);
      recognizedTextRef.current = '';
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

  const handleReview = useCallback(() => {
    const prompt = `Please review my last utterance in ${selectedLanguage}. Identify mistakes and suggest corrections with brief explanations.`;
    setHistory(prev => [{ role: 'user', text: prompt, ts: Date.now() }, ...prev].slice(0, 200));
    try {
      sendTextInput(prompt);
    } catch (e) {}
  }, [selectedLanguage, sendTextInput]);

  const handleSend = useCallback(() => {
    const text = message.trim();
    if (!text) return;
    setHistory(prev => [{ role: 'user', text, ts: Date.now() }, ...prev].slice(0, 200));
    setMessage('');
    try { sendTextInput(text); } catch {}
  }, [message, sendTextInput]);

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
        <Text style={styles.title}>AI Coach</Text>
        <View style={styles.langRow}>
          {languages.map((lang) => (
            <Pressable key={lang} style={[styles.chipSmall, selectedLanguage === lang && styles.chipSelected]} onPress={() => setSelectedLanguage(lang)}>
              <Text style={styles.chipText}>{lang.slice(0,2)}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.chatArea}>
        {history.slice(0, 100).reverse().map((m, i) => (
          <View key={i} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
            <Text style={styles.bubbleText}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.iconButton} onPress={handleToggleSession}>
          <Text style={styles.iconText}>{isConnected ? '🔴' : '🟢'}</Text>
        </Pressable>
        <Pressable style={styles.iconButton} onPress={handleVoiceInput}>
          <Text style={styles.iconText}>{isRecording ? '⏹' : '🎤'}</Text>
        </Pressable>
        <TextInput
          style={styles.chatInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={handleSend}
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b1020' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1a1f3a', borderBottomWidth: 1, borderBottomColor: '#2a2f4a' },
  title: { fontSize: 20, fontWeight: '700', color: 'white' },
  langRow: { flexDirection: 'row', gap: 6 },
  chipSmall: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 9999, backgroundColor: '#374151' },
  chipSelected: { backgroundColor: '#2563EB' },
  chipText: { color: 'white', fontSize: 12, fontWeight: '600' },
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
