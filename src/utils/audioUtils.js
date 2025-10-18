/**
 * Audio Utilities for React Voice Chat
 * 
 * Provides encoding/decoding functions for audio data conversion.
 * Handles conversion between Float32, Int16, and Base64 formats.
 */

/**
 * Encodes an ArrayBuffer to a Base64 string
 * @param {ArrayBuffer} buffer - The buffer to encode
 * @returns {string} Base64 encoded string
 */
export function encode(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Decodes a Base64 string to a Uint8Array
 * @param {string} base64 - The Base64 string to decode
 * @returns {Uint8Array} Decoded byte array
 */
export function decode(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Converts PCM audio data from Int16 to AudioBuffer for playback
 * @param {Uint8Array} data - PCM audio data
 * @param {AudioContext} ctx - Web Audio API context
 * @param {number} sampleRate - Sample rate of the audio
 * @param {number} numChannels - Number of audio channels
 * @returns {Promise<AudioBuffer>} Audio buffer ready for playback
 */
export async function decodeAudioData(data, ctx, sampleRate, numChannels) {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            // Convert Int16 to Float32 range [-1, 1]
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }

    return buffer;
}

/**
 * Creates a PCM blob from Float32 audio data for sending to the API
 * @param {Float32Array} float32Array - Audio data from microphone
 * @param {number} sampleRate - Sample rate of the audio
 * @returns {Object} PCM blob object with data and mimeType
 */
export function createPCMBlob(float32Array, sampleRate) {
    const length = float32Array.length;
    const int16 = new Int16Array(length);

    // Convert Float32 to Int16
    for (let i = 0; i < length; i++) {
        int16[i] = float32Array[i] * 32768;
    }

    return {
        data: encode(int16.buffer),
        mimeType: `audio/pcm;rate=${sampleRate}`,
    };
}
