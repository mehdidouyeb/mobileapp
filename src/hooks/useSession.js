/**
 * Custom React Hook for Session Management
 * 
 * Orchestrates the voice chat session by coordinating:
 * - Audio processing
 * - Gemini API client
 * - Transcription management
 * - Session lifecycle
 */

import { useCallback, useRef } from 'react';
import { useAudio } from './useAudio.js';
import { useGemini } from './useGemini.js';
import { useVoiceChat } from '../context/VoiceChatContext';
import { discussionStorage } from '../utils/discussionStorage.js';
import { useExerciseSuggestions } from './useExerciseSuggestions.js';

export function useSession() {
  const {
    setStatus,
    setActive,
    addMessage,
    updateUserText,
    updateAIText,
    finalizeUserMessage,
    finalizeAIMessage,
    setError,
    clearError,
    resetSession,
    clearMessages,
    sendTextMessage,
    isActive,
    languages,
  } = useVoiceChat();

  // Hook pour les exercices suggérés
  const { generateOpeningMessage, markExercisesAsCompleted } = useExerciseSuggestions();

  // Use refs to avoid circular dependencies and track accumulated text
  const playAudioResponseRef = useRef(null);
  const sendAudioInputRef = useRef(null);
  const accumulatedUserTextRef = useRef('');
  const accumulatedAITextRef = useRef('');
  const userTurnFinalizedRef = useRef(false);
  const aiTurnActiveRef = useRef(false);
  const aiMessageTimeoutRef = useRef(null);

  /**
   * Handles incoming messages from Gemini API
   */
  const handleMessage = useCallback(async (message) => {
    const content = message.serverContent;

    if (!content) return;

    console.log('===== Received message =====');
    console.log('Full content:', JSON.stringify(content, null, 2));

    // Handle audio playback
    const audioData = content.modelTurn?.parts[0]?.inlineData?.data;
    if (audioData && playAudioResponseRef.current) {
      await playAudioResponseRef.current(audioData);
    }

    // Handle user speech transcription - API sends word-by-word updates
    if (content.inputTranscription) {
      const text = content.inputTranscription.text || '';
      console.log('User transcription chunk:', text);
      // Append the new text chunk to accumulated text
      accumulatedUserTextRef.current += text;
      console.log('Accumulated user text:', accumulatedUserTextRef.current);
      updateUserText(accumulatedUserTextRef.current);
      userTurnFinalizedRef.current = false; // Reset flag when new user speech detected
    }

    // When model starts responding, finalize user's message
    if (content.modelTurn && !userTurnFinalizedRef.current && accumulatedUserTextRef.current.trim()) {
      console.log('Model turn detected - finalizing user message');
      aiTurnActiveRef.current = true;

      // Save user message to discussion
      await discussionStorage.addMessage(accumulatedUserTextRef.current.trim(), true);

      finalizeUserMessage();
      accumulatedUserTextRef.current = '';
      userTurnFinalizedRef.current = true;
    }

    // Handle AI response transcription - API sends word-by-word updates
    if (content.outputTranscription) {
      const text = content.outputTranscription.text || '';
      console.log('AI transcription chunk:', text);
      // Append the new text chunk to accumulated text
      accumulatedAITextRef.current += text;
      console.log('Accumulated AI text:', accumulatedAITextRef.current);
      updateAIText(accumulatedAITextRef.current);
      
      // Set a timeout to finalize AI message if no more chunks arrive
      // This helps with text messages that might not trigger turnComplete properly
      if (aiTurnActiveRef.current) {
        clearTimeout(aiMessageTimeoutRef.current);
        aiMessageTimeoutRef.current = setTimeout(async () => {
          if (accumulatedAITextRef.current.trim() && aiTurnActiveRef.current) {
            console.log('AI message timeout - finalizing message');
            await discussionStorage.addMessage(accumulatedAITextRef.current.trim(), false);
            finalizeAIMessage();
            accumulatedAITextRef.current = '';
            aiTurnActiveRef.current = false;
          }
        }, 300); // Reduced to 300ms for faster response
      }
      
      // Also check if the message seems complete (ends with punctuation)
      if (aiTurnActiveRef.current && accumulatedAITextRef.current.trim()) {
        const lastChar = accumulatedAITextRef.current.trim().slice(-1);
        if (['.', '!', '?', ':', ';'].includes(lastChar)) {
          // Message seems complete, set a shorter timeout
          clearTimeout(aiMessageTimeoutRef.current);
          aiMessageTimeoutRef.current = setTimeout(async () => {
            if (accumulatedAITextRef.current.trim() && aiTurnActiveRef.current) {
              console.log('AI message complete - finalizing message');
              await discussionStorage.addMessage(accumulatedAITextRef.current.trim(), false);
              finalizeAIMessage();
              accumulatedAITextRef.current = '';
              aiTurnActiveRef.current = false;
            }
          }, 100); // Very short timeout for complete messages
        }
      }
    }

    // Handle turn completion - finalize AI's message if AI was speaking
    if (content.turnComplete && aiTurnActiveRef.current) {
      console.log('Turn complete - finalizing AI message');
      // Clear the timeout since we're handling the completion normally
      clearTimeout(aiMessageTimeoutRef.current);
      
      if (accumulatedAITextRef.current.trim()) {
        // Save AI message to discussion
        await discussionStorage.addMessage(accumulatedAITextRef.current.trim(), false);

        finalizeAIMessage();
        accumulatedAITextRef.current = '';
      }
      aiTurnActiveRef.current = false;
    }
  }, [updateUserText, updateAIText, finalizeUserMessage, finalizeAIMessage]);

  /**
   * Handles session errors
   */
  const handleError = useCallback((error) => {
    console.error('Session error:', error);
    setError(error.message || 'Unknown error');
    setActive(false);
    setStatus('error');
  }, [setError, setActive, setStatus]);

  /**
   * Handles session close
   */
  const handleClose = useCallback(() => {
    console.log('Session closed');
    setActive(false);
    setStatus('idle');
  }, [setActive, setStatus]);

  /**
   * Handles session open
   */
  const handleOpen = useCallback(() => {
    console.log('Session opened');
    setStatus('listening');
  }, [setStatus]);

  // Initialize Gemini with callbacks
  const { connect, sendAudioInput, sendTextInput, close, isConnected } = useGemini(
    handleMessage,
    handleError,
    handleClose,
    handleOpen,
    languages || { native: null, target: null, level: null }
  );

  // Store sendAudioInput in ref
  sendAudioInputRef.current = sendAudioInput;

  // Audio processing hook - passes audio data to Gemini via ref
  const { startMicrophoneCapture, playAudioResponse, cleanup: cleanupAudio } = useAudio((audioData) => {
    if (sendAudioInputRef.current) {
      sendAudioInputRef.current(audioData);
    }
  });

  // Store playAudioResponse in ref
  playAudioResponseRef.current = playAudioResponse;

  /**
   * Starts a new voice chat session with conversation name
   */
  const startSession = useCallback(async (conversationName = 'Unnamed Conversation', customOpeningMessage = null, chatMode = 'voice') => {
    try {
      setStatus('connecting');
      setActive(true);
      clearError();

      // Close any existing session first
      try {
        close();
      } catch (error) {
        console.log('No existing session to close');
      }

      // Clear previous messages when starting a new session
      clearMessages();

      // Start a new discussion with conversation name
      await discussionStorage.startNewDiscussion(conversationName);

      // Clear any pending AI responses before starting
      clearTimeout(aiMessageTimeoutRef.current);
      if (aiTurnActiveRef.current) {
        console.log('Clearing pending AI response for new session');
        aiTurnActiveRef.current = false;
        accumulatedAITextRef.current = '';
        updateAIText('');
      }

      // Connect to Gemini API first
      await connect();

      // Handle different chat modes
      if (chatMode === 'voice') {
        // Start microphone capture for voice mode
        const micSuccess = await startMicrophoneCapture();
        if (!micSuccess) {
          throw new Error('Failed to start microphone');
        }
      } else {
        // For text mode, ensure microphone is stopped
        console.log('Starting text-only session - stopping microphone');
        cleanupAudio(); // Stop any active microphone
      }

      // Ajouter un message d'ouverture adapté au mode
      const openingMessage = customOpeningMessage || (chatMode === 'text' ? 
        "Hello! I'm your AI language coach. You can now practice your writing skills by typing messages. I'll help you improve your spelling, grammar, and vocabulary!" :
        generateOpeningMessage()
      );
      
      if (openingMessage) {
        // Ajouter le message d'ouverture comme message de l'IA
        addMessage({
          id: Date.now(),
          text: openingMessage,
          isUser: false
        });
        
        // Sauvegarder le message d'ouverture dans la discussion
        await discussionStorage.addMessage(openingMessage, false);
      }

    } catch (error) {
      console.error('Failed to start session:', error);
      setError(error.message);
      setStatus('error');
      setActive(false);
    }
  }, [setStatus, setActive, clearError, clearMessages, startMicrophoneCapture, connect, setError, generateOpeningMessage, addMessage]);

  /**
   * Stops the current session and cleans up resources
   */
  const stopSession = useCallback(async () => {
    setActive(false);
    setStatus('idle');

    // Close Gemini connection
    close();

    // Stop audio processing
    cleanupAudio();

    // End the current discussion
    const endedDiscussion = await discussionStorage.endCurrentDiscussion();

      // Reset transcription state
      updateUserText('');
      updateAIText('');
      accumulatedUserTextRef.current = '';
      accumulatedAITextRef.current = '';
      userTurnFinalizedRef.current = false;
      aiTurnActiveRef.current = false;
      
      // Clear any pending timeouts
      clearTimeout(aiMessageTimeoutRef.current);
      
      // Clear any pending audio responses
      if (playAudioResponseRef.current) {
        playAudioResponseRef.current = null;
      }

    return endedDiscussion;
  }, [setActive, setStatus, close, cleanupAudio, updateUserText, updateAIText]);

  /**
   * Demande à l'IA de générer une analyse de la session
   */
  const requestSessionAnalysis = useCallback(async () => {
    try {
      const analysisPrompt = `
        Please provide a detailed analysis of this language learning session in the following JSON format:
        {
          "positive_points": [
            "Specific examples of what the learner did well",
            "Vocabulary improvements observed",
            "Fluency improvements",
            "Participation quality"
          ],
          "progress": [
            "Specific improvements from previous sessions",
            "New skills demonstrated",
            "Confidence building"
          ],
          "improvement_areas": [
            "Specific grammar points to work on",
            "Pronunciation focus",
            "Vocabulary expansion"
          ],
          "recurring_errors": [
            "Specific errors observed multiple times",
            "Patterns to address"
          ],
          "suggested_exercises": [
            {
              "title": "Specific exercise name",
              "description": "Detailed description",
              "difficulty": "Appropriate level",
              "duration": "Realistic time",
              "openingMessage": "Specific opening message"
            }
          ]
        }
        
        Base your analysis on the actual conversation content. Be specific with examples.
      `;
      
      // Envoyer la demande d'analyse à l'IA
      // Note: Cette fonctionnalité nécessiterait une modification plus profonde du système
      // pour envoyer des messages spéciaux à l'IA en dehors du flux normal
      console.log('Demande d\'analyse de session:', analysisPrompt);
      
    } catch (error) {
      console.error('Erreur lors de la demande d\'analyse:', error);
    }
  }, []);

  /**
   * Sends a text message and gets AI response
   */
  const sendTextMessageToAI = useCallback(async (text) => {
    try {
      // Clear any pending AI responses to avoid overlap
      clearTimeout(aiMessageTimeoutRef.current);
      if (aiTurnActiveRef.current) {
        console.log('Clearing pending AI response for text message');
        aiTurnActiveRef.current = false;
        accumulatedAITextRef.current = '';
        updateAIText('');
      }

      // Finalize any pending user message first
      if (accumulatedUserTextRef.current.trim()) {
        console.log('Finalizing pending user message before text input');
        await discussionStorage.addMessage(accumulatedUserTextRef.current.trim(), true);
        finalizeUserMessage();
        accumulatedUserTextRef.current = '';
        userTurnFinalizedRef.current = true;
      }

      // Add user message to chat immediately
      const userMessage = {
        id: Date.now(),
        text: text,
        isUser: true
      };
      sendTextMessage(userMessage);

      // Save user message to discussion
      await discussionStorage.addMessage(text, true);

      // If not connected, start a session for text-only communication
      if (!isConnected()) {
        console.log('Starting session for text communication...');
        await startSession('Text Conversation', null, 'text');
      }

      // Send the text message to Gemini AI for a natural response
      if (isConnected()) {
        console.log('Sending text message to AI:', text);
        // Mark that AI turn is starting
        aiTurnActiveRef.current = true;
        sendTextInput(text);
        // The AI response will come through the normal message handling
      } else {
        console.error('Failed to connect to AI');
        setError('Failed to connect to AI');
      }
    } catch (error) {
      console.error('Error sending text message:', error);
      setError('Failed to send message');
    }
  }, [sendTextMessage, setError, isConnected, sendTextInput, startSession, updateAIText, finalizeUserMessage]);

  /**
   * Resets the entire session
   */
  const reset = useCallback(() => {
    stopSession();
    resetSession();
    // Marquer les exercices comme complétés lors du reset
    markExercisesAsCompleted();
  }, [stopSession, resetSession, markExercisesAsCompleted]);

  return {
    startSession,
    stopSession,
    reset,
    requestSessionAnalysis,
    sendTextMessageToAI,
    isActive,
    isConnected: isConnected(),
  };
}