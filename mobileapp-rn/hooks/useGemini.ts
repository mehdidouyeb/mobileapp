import { useCallback, useRef, useEffect } from 'react';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';

interface GeminiMessage {
  role: 'user' | 'model' | 'assistant';
  parts: { text: string }[];
}

interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

interface UseGeminiOptions {
  model?: string;
  systemInstruction?: string;
  onOpen?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
}

const GEMINI_API_KEY_STORAGE = 'gemini_api_key';

export function useGemini(options?: UseGeminiOptions) {
  const { targetLanguage } = useAuth();
  const { onOpen, onMessage, onError, onClose } = options || {};
  const sessionRef = useRef<{ connected: boolean } | null>(null);
  const clientRef = useRef<{
    apiKey: string;
    model: string;
    systemInstruction: string;
  } | null>(null);

  // Load API key from secure storage on mount
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const savedKey = await SecureStore.getItemAsync(GEMINI_API_KEY_STORAGE);
        if (savedKey) {
          console.log('🔑 Loaded API key from secure storage');
          if (clientRef.current) {
            clientRef.current.apiKey = savedKey;
          }
        }
      } catch (error) {
        console.error('Failed to load API key:', error);
      }
    };
    loadApiKey();
  }, []);

  const connect = useCallback(async (options?: { model?: string; systemInstruction?: string }) => {
    try {
      console.log('🔌 GEMINI CONNECT called with options:', options);
      console.log('🌍 Current targetLanguage:', targetLanguage);

      // Get API key from various sources
      const sources = [
        { name: 'SecureStore', value: await SecureStore.getItemAsync(GEMINI_API_KEY_STORAGE).catch(() => '') },
        { name: 'Expo Config', value: (Constants?.expoConfig?.extra as any)?.GEMINI_API_KEY },
        { name: 'Environment', value: process.env?.EXPO_PUBLIC_GEMINI_API_KEY },
      ];

      // Find the first valid API key
      const validSource = sources.find(source => source.value);
      const apiKey = validSource?.value || '';

      console.log(`🔑 Using API key from ${validSource?.name || 'no valid source'}`);
      console.log('🔑 API Key present:', !!apiKey);
      console.log('🔑 API Key length:', apiKey?.length || 0);
        
      // If we got the key from config/env, save it to SecureStore
      if (validSource?.name !== 'SecureStore' && apiKey) {
        try {
          await SecureStore.setItemAsync(GEMINI_API_KEY_STORAGE, apiKey);
        } catch (error) {
          console.warn('Failed to save API key to SecureStore:', error);
        }
      }

      if (!apiKey) {
        const errorMsg = 'No valid Gemini API key found. Please set EXPO_PUBLIC_GEMINI_API_KEY in your environment or provide it in the app settings.';
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      const systemInstruction = options?.systemInstruction ?? `You are FluentFlow, an AI language learning assistant. Always respond in ${targetLanguage || 'English'}. When given a conversation starter, engage the user by asking thoughtful questions and having a natural conversation. Don't just provide information - ask questions to learn about them and practice their language skills. Be friendly, encouraging, and conversational.`;

      console.log('🤖 Using systemInstruction:', systemInstruction);
      
      // Store simple REST config in clientRef with default model
      clientRef.current = {
        apiKey,
        model: options?.model || 'gemini-2.5-flash',  // Using gemini-2.5-flash as default for latest capabilities
        systemInstruction,
      };
      sessionRef.current = { connected: true };

      console.log('✅ Gemini connected successfully');

      if (onOpen) {
        console.log('🔄 Calling onOpen callback');
        onOpen();
      }
      return { success: true, apiKey };
    } catch (error) {
      console.error('❌ Error in connect:', error);
      if (onError) onError(error);
      throw error;
    }
  }, [onOpen, onError, targetLanguage]);


  const sendTextInput = useCallback(async (text: string, options?: { conversationId?: string }) => {
    console.log('📤 sendTextInput called with text:', text);
    
    // Input validation
    if (!text || typeof text !== 'string' || text.trim() === '') {
      const error = new Error('Invalid input: Text cannot be empty');
      console.error('❌', error.message);
      if (onError) onError(error);
      return;
    }

    // Check session and client
    if (!sessionRef.current || !clientRef.current) {
      const error = new Error('No active session or client available. Please connect first.');
      console.error('❌', error.message);
      if (onError) onError(error);
      return;
    }

    const { apiKey, model, systemInstruction } = clientRef.current;
    
    // Validate API key
    if (!apiKey) {
      const error = new Error('Missing Gemini API key. Please check your configuration.');
      console.error('❌', error.message);
      if (onError) onError(error);
      return;
    }

    console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');
    console.log('🤖 Model:', model);
    console.log('📝 System Instruction:', systemInstruction ? 'Present' : 'None');

    // Model candidates in order of preference - using latest available models
    const modelCandidates = [
      'gemini-2.5-flash',        // Latest flash model with thinking capabilities
      'gemini-2.0-flash',        // Multimodal performance model
      'gemini-1.5-flash',        // Fallback to 1.5 flash if needed
    ].filter(Boolean);

    console.log('🎯 Trying models in order:', modelCandidates);

    const errors: Array<{ model: string; error: string; status?: number; response?: any }> = [];

    for (const modelName of modelCandidates) {
      let response: Response | null = null;
      let responseData: any = null;
      
      try {
        console.log(`\n🔄 Attempting to use model: ${modelName}`);
        
        // Prepare the request body
        const requestBody: GeminiRequest = {
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemInstruction ? `${systemInstruction}\n\nUser: ${text}` : text }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_NONE'
            }
          ]
        };

        console.log('📤 Sending request to Gemini API...');
        
        // Use v1 for all models
        const apiVersion = 'v1';
        const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;
        
        console.log('🌐 API URL:', apiUrl);
        console.log('📝 Request Body:', JSON.stringify({
          ...requestBody,
          contents: [{
            ...requestBody.contents[0],
            parts: [{ text: requestBody.contents[0].parts[0].text.substring(0, 50) + '...' }]
          }]
        }, null, 2));
        
        try {
          const startTime = Date.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          console.log('🌐 Sending request to Gemini API...');
          console.log('📡 Model:', modelName);
          console.log('🔗 Endpoint:', apiUrl.split('?')[0]);
          
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));
          
          const responseTime = Date.now() - startTime;
          console.log(`⏱️ Response received in ${responseTime}ms`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ API Error Response:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
              url: apiUrl
            });
            
            // Handle common error statuses
            if (response.status === 400) {
              throw new Error('Bad request - check your request parameters');
            } else if (response.status === 401) {
              throw new Error('Invalid API key - please check your configuration');
            } else if (response.status === 404) {
              throw new Error('Model not found - the specified model may not be available');
            } else if (response.status >= 500) {
              throw new Error('Server error - please try again later');
            } else {
              throw new Error(`API request failed with status ${response.status}`);
            }
          }
          
          responseData = await response.json().catch(error => {
            console.error('❌ Failed to parse JSON response:', error);
            throw new Error('Invalid response from server');
          });
          
          console.log('📥 Response received. First 100 chars:', 
            responseData?.candidates?.[0]?.content?.parts?.[0]?.text 
              ? responseData.candidates[0].content.parts[0].text.substring(0, 100) + '...'
              : 'No text in response');
        } catch (fetchError) {
          console.error('❌ Fetch Error:', fetchError);
          throw fetchError;
        }
        
        if (!response.ok) {
          const errorMessage = responseData?.error?.message || `HTTP error! status: ${response.status}`;
          const errorDetails = {
            status: response.status,
            statusText: response.statusText,
            error: responseData?.error,
            requestBody: requestBody.contents[0].parts[0].text.substring(0, 200) + '...',
          };
          
          console.error(`❌ API Error (${modelName} ${response.status}):`, errorDetails);
          throw new Error(`API error: ${errorMessage}`);
        }
        
        // Extract and return the generated text
        const generatedText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!generatedText) {
          throw new Error('No generated text in response');
        }
        
        console.log('✅ Successfully got response from', modelName);
        if (onMessage) {
          onMessage(generatedText);
        }
        return;
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error with ${modelName}:`, error);
        
        // Check if it's a network-related error
        if (errorMessage.includes('Network request failed') || 
            errorMessage.includes('fetch') || 
            errorMessage.includes('timeout') ||
            errorMessage.includes('AbortError')) {
          console.log('🌐 Network error detected, trying next model...');
          errors.push({
            model: modelName,
            error: 'Network connection issue',
            status: response?.status,
            response: 'Network error - check internet connection'
          });
          continue;
        }
        
        errors.push({
          model: modelName,
          error: errorMessage,
          status: response?.status,
          response: responseData || (error instanceof Error ? error.message : 'No response data')
        });
        
        // If we have a 404, this model might not exist, try the next one
        if (response?.status === 404) {
          console.log(`⚠️ Model ${modelName} not found, trying next model...`);
          continue;
        }
        
        // For other errors, we'll continue to the next model
        continue;
      }
    }

    // If all models failed, try a simple direct call as last resort
    if (errors.length === modelCandidates.length) {
      console.log('🚨 All models failed, trying simple direct call...');
      try {
        const simpleResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
          }),
          signal: AbortSignal.timeout(15000)
        });
        
        if (simpleResponse.ok) {
          const simpleData = await simpleResponse.json();
          const simpleText = simpleData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (simpleText) {
            console.log('✅ Simple direct call succeeded!');
            if (onMessage) onMessage(simpleText);
            return;
          }
        }
      } catch (simpleError) {
        console.log('❌ Simple direct call also failed:', simpleError);
      }
    }
    const errorDetails = {
      message: 'All Gemini models failed to respond',
      errors: errors.map(e => ({
        model: e.model,
        status: e.status,
        error: e.error,
        response: e.response ? 'Response available (check logs)' : 'No response',
        timestamp: new Date().toISOString()
      })),
      lastError: errors[errors.length - 1]?.error,
      timestamp: new Date().toISOString(),
      suggestion: 'Check your API key and internet connection. Ensure the model names are correct and you have sufficient quota.'
    };

    console.error('❌ All models failed with details:', JSON.stringify(errorDetails, null, 2));
    
    if (onError) {
      const error = new Error('All Gemini models failed to respond');
      (error as any).details = errorDetails;
      onError(error);
    }
    
    // Additional troubleshooting for common issues
    const storedApiKey = await SecureStore.getItemAsync(GEMINI_API_KEY_STORAGE);
    if (!storedApiKey) {
      console.error('🔑 No API key found in SecureStore');
    } else {
      console.log('🔑 Found API key in SecureStore');
    }
    
    // Simple network check - just try the Gemini API directly
    console.log('🔍 Testing Gemini API connectivity...');
    
    try {
      // Test Gemini API endpoint with proper error handling
      const apiResponse = await fetch('https://generativelanguage.googleapis.com/v1/models', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': clientRef.current?.apiKey || ''
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (apiResponse.status === 403) {
        console.error('❌ Invalid or missing API key');
        throw new Error('Please check your Gemini API key in settings.');
      }
      
      if (!apiResponse.ok) {
        console.error('❌ Gemini API error:', apiResponse.status, apiResponse.statusText);
        throw new Error(`API error: ${apiResponse.status} - ${apiResponse.statusText}`);
      }
      
      console.log('✅ Gemini API is responding');
      return; // Success!
      
    } catch (error) {
      // Handle network errors
      if (error.name === 'AbortError') {
        console.error('⌛ Connection timed out');
        throw new Error('Connection to server timed out. Please try again.');
      }
      
      // Handle specific error cases
      if (error.message.includes('Network request failed')) {
        console.error('❌ No internet connection');
        throw new Error('Cannot connect to the internet. Please check your connection.');
      }
      
      // Re-throw any other errors with their original messages
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }, [onMessage, onError]);

  const close = useCallback(async () => {
    console.log('🔌 Closing Gemini connection');
    try {
      // Clear any active sessions or timeouts
      if (sessionRef.current) {
        sessionRef.current.connected = false;
        sessionRef.current = null;
      }
      
      // Don't clear the API key from storage, just from memory
      clientRef.current = null;
      
      console.log('✅ Gemini connection closed');
      if (onClose) onClose();
    } catch (error) {
      console.error('❌ Error closing connection:', error);
      if (onError) onError(error);
    }
  }, [onClose, onError]);

  const isConnected = useCallback(() => !!sessionRef.current, []);

  return { connect, sendTextInput, close, isConnected };
}
