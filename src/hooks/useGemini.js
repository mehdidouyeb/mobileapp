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
import { CONFIG } from '../utils/config.js';

export function useGemini(onMessage, onError, onClose, onOpen) {
    const sessionRef = useRef(null);
    const clientRef = useRef(null);

    /**
     * Connects to the Gemini Live API with configured callbacks
     */
    const connect = useCallback(async () => {
        try {
            // Initialize Gemini AI client
            clientRef.current = new GoogleGenAI({ apiKey: CONFIG.API_KEY });

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
                    systemInstruction: CONFIG.SYSTEM_INSTRUCTION,
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
        close,
        isConnected,
    };
}
