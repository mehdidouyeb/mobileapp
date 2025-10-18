/**
 * Custom React Hook for Audio Processing
 * 
 * Manages all audio input/output operations:
 * - Microphone capture and processing
 * - Audio playback from AI responses
 * - Audio context lifecycle management
 */

import { useRef, useCallback, useEffect } from 'react';
import { CONFIG } from '../utils/config.js';
import { createPCMBlob, decodeAudioData, decode } from '../utils/audioUtils.js';

export function useAudio(onAudioData) {
    // Audio contexts for input and output
    const inputAudioContextRef = useRef(null);
    const outputAudioContextRef = useRef(null);

    // Media stream from microphone
    const mediaStreamRef = useRef(null);

    // Audio processing node
    const scriptProcessorRef = useRef(null);

    // Audio playback management
    const audioSourcesRef = useRef(new Set());
    const nextStartTimeRef = useRef(0);

    /**
     * Initializes microphone capture and audio processing
     */
    const startMicrophoneCapture = useCallback(async () => {
        try {
            // Request microphone access
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            // Create audio context for input processing
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            inputAudioContextRef.current = new AudioContextClass({
                sampleRate: CONFIG.AUDIO.INPUT_SAMPLE_RATE
            });

            // Create audio source from microphone stream
            const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);

            // Create script processor for audio data
            scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(
                CONFIG.AUDIO.BUFFER_SIZE,
                CONFIG.AUDIO.CHANNELS,
                CONFIG.AUDIO.CHANNELS
            );

            // Process audio data in real-time
            scriptProcessorRef.current.onaudioprocess = (event) => {
                const inputData = event.inputBuffer.getChannelData(0);
                const pcmBlob = createPCMBlob(inputData, CONFIG.AUDIO.INPUT_SAMPLE_RATE);

                if (onAudioData) {
                    onAudioData(pcmBlob);
                }
            };

            // Connect audio nodes (muted to avoid feedback)
            const gainNode = inputAudioContextRef.current.createGain();
            gainNode.gain.setValueAtTime(0, inputAudioContextRef.current.currentTime);
            source.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(gainNode);
            gainNode.connect(inputAudioContextRef.current.destination);

            return true;
        } catch (error) {
            console.error('Error starting microphone capture:', error);
            return false;
        }
    }, [onAudioData]);

    /**
     * Plays audio response from Gemini
     */
    const playAudioResponse = useCallback(async (base64Audio) => {
        try {
            // Create output audio context if needed
            if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                outputAudioContextRef.current = new AudioContextClass({
                    sampleRate: CONFIG.AUDIO.OUTPUT_SAMPLE_RATE
                });
            }

            // Decode and create audio buffer
            const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputAudioContextRef.current,
                CONFIG.AUDIO.OUTPUT_SAMPLE_RATE,
                CONFIG.AUDIO.CHANNELS
            );

            // Create buffer source for playback
            const source = outputAudioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContextRef.current.destination);

            // Schedule playback for gapless audio
            const startTime = Math.max(
                outputAudioContextRef.current.currentTime,
                nextStartTimeRef.current
            );
            source.start(startTime);
            nextStartTimeRef.current = startTime + audioBuffer.duration;

            // Track active audio sources
            audioSourcesRef.current.add(source);
            source.onended = () => {
                audioSourcesRef.current.delete(source);
            };

            return true;
        } catch (error) {
            console.error('Error playing audio response:', error);
            return false;
        }
    }, []);

    /**
     * Stops all audio processing and releases resources
     */
    const cleanup = useCallback(() => {
        // Stop microphone
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        // Disconnect audio processor
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current.onaudioprocess = null;
            scriptProcessorRef.current = null;
        }

        // Close input audio context
        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }

        // Close output audio context
        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }

        // Stop all playing audio
        audioSourcesRef.current.forEach(source => {
            try {
                source.stop();
                source.disconnect();
            } catch (e) {
                // Already stopped
            }
        });
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        startMicrophoneCapture,
        playAudioResponse,
        cleanup,
    };
}
