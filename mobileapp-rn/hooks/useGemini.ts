import { useCallback, useRef } from 'react';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

interface UseGeminiOptions {
  model?: string;
  systemInstruction?: string;
  onOpen?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
}

export function useGemini(options?: UseGeminiOptions) {
  const { targetLanguage } = useAuth();
  const { onOpen, onMessage, onError, onClose } = options || {};
  const sessionRef = useRef<any>(null);
  const clientRef = useRef<any>(null);

  const connect = useCallback(async (options?: { model?: string; systemInstruction?: string }) => {
    console.log('🔌 GEMINI CONNECT called with options:', options);
    console.log('🌍 Current targetLanguage:', targetLanguage);

    const apiKey = (Constants?.expoConfig?.extra as any)?.GEMINI_API_KEY || (process.env as any)?.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyC-Dh45i2BPrUV5ifB7GjF1Pha-BWKP91E';
    if (!apiKey) throw new Error('Missing Gemini API key. Set expo.extra.GEMINI_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY.');

    const systemInstruction = options?.systemInstruction ?? `You are Fluent Flo, an AI language learning assistant. Always respond in ${targetLanguage || 'English'}. When given a conversation starter, engage the user by asking thoughtful questions and having a natural conversation. Don't just provide information - ask questions to learn about them and practice their language skills. Be friendly, encouraging, and conversational.`;

    console.log('🤖 Using systemInstruction:', systemInstruction);

    // Store simple REST config in clientRef for subsequent calls
    clientRef.current = {
      apiKey,
      model: options?.model ?? 'gemini-1.5-flash', // Try 1.5-flash first
      systemInstruction,
    };
    sessionRef.current = { connected: true };

    console.log('✅ Gemini connected successfully');
    if (onOpen) {
      console.log('🔄 Calling onOpen callback');
      onOpen();
    }
    return sessionRef.current;
  }, [onOpen, targetLanguage]);


  const sendTextInput = useCallback(async (text: string) => {
    console.log('📤 sendTextInput called with text:', text);
    if (!sessionRef.current || !clientRef.current) {
      console.log('❌ No session or client available');
      return;
    }

    const { apiKey, model, systemInstruction } = clientRef.current as any;
    console.log('🔑 Using API config:', { hasApiKey: !!apiKey, model, hasSystemInstruction: !!systemInstruction });

    const modelCandidates = [
      'gemini-1.5-flash',  // Most available
      'gemini-1.5-pro',    // Second most available
      'gemini-2.5-flash',  // Newer but may not be available
    ].filter((m, i, a) => !!m && a.indexOf(m) === i);

    console.log('🎯 Trying models in order:', modelCandidates);

    for (const modelName of modelCandidates) {
      try {
        console.log(`🚀 Trying model: ${modelName}`);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: systemInstruction ? `${systemInstruction}\n\nUser: ${text}` : text
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          }),
        });

        console.log(`📡 API response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ API error for ${modelName}:`, errorText);
          continue; // Try next model
        }

        const data = await response.json();
        console.log(`✅ Successful response from ${modelName}:`, data);

        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('📝 Generated text:', generatedText);

        if (generatedText && onMessage) {
          console.log('🔄 Calling onMessage callback');
          onMessage(generatedText);
        } else {
          console.log('❌ No generated text or no onMessage callback');
        }

        return; // Success, don't try other models

      } catch (error) {
        console.log(`💥 Error with model ${modelName}:`, error);
        continue; // Try next model
      }
    }

    console.log('❌ All models failed');
    if (onError) {
      console.log('🔄 Calling onError callback');
      onError(new Error('All Gemini models failed'));
    }
  }, [onMessage, onError]);

  const close = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current = null;
    }
    if (onClose) onClose();
  }, [onClose]);

  const isConnected = useCallback(() => !!sessionRef.current, []);

  return { connect, sendTextInput, close, isConnected };
}
