import { useCallback, useRef } from 'react';
import AudioRecord from 'react-native-audio-record';
import { Platform } from 'react-native';

// PCM 16-bit, mono, 16kHz configuration for speech
const RECORD_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  wavFile: 'recording.wav',
};

interface UseAudioOptions {
  onPcmChunk?: (base64PcmChunk: string) => void;
  onPlaybackLog?: (msg: string) => void;
}

export function useAudio(opts: UseAudioOptions = {}) {
  const isRecordingRef = useRef(false);
  const startedRef = useRef(false);

  const ensureInit = useCallback(() => {
    if (startedRef.current) return;
    if (!AudioRecord || typeof (AudioRecord as any).init !== 'function') {
      if (opts.onPlaybackLog) {
        opts.onPlaybackLog('Audio recording not available. Use a Dev Build (expo prebuild + run) or switch to expo-av.');
      }
      return;
    }
    AudioRecord.init(RECORD_CONFIG as any);
    startedRef.current = true;
  }, [opts]);

  const startRecording = useCallback(async () => {
    ensureInit();
    if (isRecordingRef.current) return;

    if (!AudioRecord || typeof (AudioRecord as any).on !== 'function' || typeof (AudioRecord as any).start !== 'function') {
      if (opts.onPlaybackLog) {
        opts.onPlaybackLog('Cannot start recording: native audio module unavailable in Expo Go.');
      }
      return;
    }
    // onFrame is called with base64-encoded PCM frames
    AudioRecord.on('data', (data: string) => {
      // iOS delivers larger chunks; Android smaller and more frequent
      if (opts.onPcmChunk) opts.onPcmChunk(data);
    });

    await AudioRecord.start();
    isRecordingRef.current = true;
  }, [ensureInit, opts]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!isRecordingRef.current) return null;
    try {
      if (AudioRecord && typeof (AudioRecord as any).stop === 'function') {
        const filePath = await AudioRecord.stop();
        if (opts.onPlaybackLog) opts.onPlaybackLog(`Saved recording: ${filePath}`);
        return filePath;
      } else {
        if (opts.onPlaybackLog) opts.onPlaybackLog('Stopped (no native recorder active).');
        return null;
      }
    } finally {
      isRecordingRef.current = false;
    }
  }, [opts]);

  return {
    startRecording,
    stopRecording,
  };
}
