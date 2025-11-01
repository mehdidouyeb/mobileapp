import { useCallback, useRef } from 'react';
import Constants from 'expo-constants';

export function useGemini(
  onMessage?: (event: any) => void,
  onError?: (error: any) => void,
  onClose?: () => void,
  onOpen?: () => void
) {
  const sessionRef = useRef<any>(null);
  const clientRef = useRef<any>(null);

  const connect = useCallback(async (options?: { model?: string; systemInstruction?: string }) => {
    const apiKey = (Constants?.expoConfig?.extra as any)?.GEMINI_API_KEY || (process.env as any)?.EXPO_PUBLIC_GEMINI_API_KEY || '';
    if (!apiKey) throw new Error('Missing Gemini API key. Set expo.extra.GEMINI_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY.');

    // Store simple REST config in clientRef for subsequent calls
    clientRef.current = {
      apiKey,
      model: options?.model ?? 'gemini-2.5-flash',
      systemInstruction: options?.systemInstruction ?? 'You are an AI language coach. Hold concise, friendly voice conversations.',
    };
    sessionRef.current = { connected: true };
    if (onOpen) onOpen();
    return sessionRef.current;
  }, [onOpen]);


  const sendTextInput = useCallback(async (text: string) => {
    if (!sessionRef.current || !clientRef.current) return;
    const { apiKey, model, systemInstruction } = clientRef.current as any;
    const modelCandidates = [
      model,
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ].filter((m, i, a) => !!m && a.indexOf(m) === i);

    // Prepend system instruction to user text since v1beta doesn't support system role
    let userText = text;
    if (systemInstruction) {
      userText = `${systemInstruction}\n\nUser: ${text}`;
    }
    const body: any = {
      contents: [{ role: 'user', parts: [{ text: userText }] }],
    };

    let lastErr: any = null;
    for (const candidate of modelCandidates) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          // If model not found or unsupported for endpoint, try next candidate
          if (res.status === 404 || /not found|unsupported/i.test(txt)) {
            lastErr = new Error(`Model ${candidate} unavailable: ${txt}`);
            continue;
          }
          throw new Error(`Gemini HTTP ${res.status}: ${txt}`);
        }
        const json = await res.json();
        const parts = json?.candidates?.[0]?.content?.parts ?? [];
        const combined = parts.map((p: any) => p?.text).filter(Boolean).join('\n');
        if (onMessage) onMessage(combined || JSON.stringify(json));
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    if (onError && lastErr) onError(lastErr);
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
