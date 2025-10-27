/**
 * Custom React Hook for Gemini API Client
 * 
 * Handles all interactions with the Gemini AI API:
 * - Session initialization and configuration
 * - WebSocket connection management
 * - Message handling and event callbacks
 */

import { useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { CONFIG, generateSystemInstructions } from '../utils/config.js';

export function useGemini(onMessage, onError, onClose, onOpen, languages = null) {
    const sessionRef = useRef(null);
    const clientRef = useRef(null);

    /**
     * Connects to the Gemini Live API with configured callbacks
     */
    const connect = useCallback(async () => {
        try {
            // Check if API key is configured
            if (!CONFIG.API_KEY || CONFIG.API_KEY === 'MISSING_API_KEY' || CONFIG.API_KEY === 'demo_key') {
                throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
            }

            // Close any existing session first
            if (clientRef.current) {
                try {
                    await clientRef.current.close();
                } catch (error) {
                    console.log('No existing session to close');
                }
            }
            
            // Initialize Gemini AI client
            clientRef.current = new GoogleGenAI({ apiKey: CONFIG.API_KEY });

            // Generate system instructions based on selected languages
        const systemInstruction = (languages && languages.native && languages.target) ?
            generateSystemInstructions(languages.native, languages.target, languages.level) :
            CONFIG.SYSTEM_INSTRUCTION;

            // Configure session settings
            const sessionConfig = {
                model: CONFIG.MODEL,
                callbacks: {
                    onopen: onOpen,
                    onmessage: onMessage,
                    onerror: onError,
                    onclose: onClose,
                },
                config: {
                    // Response will be in audio format
                    responseModalities: [Modality.AUDIO],

                    // Enable transcription for both input and output
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},

                    // System instructions for AI behavior
                    systemInstruction: systemInstruction,
                },
            };

            // Establish WebSocket connection
            sessionRef.current = await clientRef.current.live.connect(sessionConfig);
            return sessionRef.current;
        } catch (error) {
            console.error('Error connecting to Gemini API:', error);
            throw error;
        }
    }, [onMessage, onError, onClose, onOpen]);

    /**
     * Sends real-time audio input to the AI
     */
    const sendAudioInput = useCallback((audioBlob) => {
        if (sessionRef.current) {
            sessionRef.current.sendRealtimeInput({ media: audioBlob });
        }
    }, []);

    /**
     * Sends text input to the AI
     */
    const sendTextInput = useCallback((text) => {
        if (sessionRef.current) {
            sessionRef.current.sendRealtimeInput({ text: text });
        }
    }, []);

    /**
     * Closes the current session
     */
    const close = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
    }, []);

    /**
     * Checks if a session is currently active
     */
    const isConnected = useCallback(() => {
        return sessionRef.current !== null;
    }, []);

    return {
        connect,
        sendAudioInput,
        sendTextInput,
        close,
        isConnected,
    };
}
