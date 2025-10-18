/**
 * Status Display Component
 * 
 * Shows current session status and error messages
 */

import React from 'react';
import { useVoiceChat } from '../context/VoiceChatContext';
import { CONFIG } from '../utils/config.js';
import styles from './StatusDisplay.module.css';

export function StatusDisplay() {
    const { status, error } = useVoiceChat();

    const getStatusMessage = () => {
        if (error) return error;

        const statusMessages = {
            'idle': CONFIG.MESSAGES.READY,
            'connecting': CONFIG.MESSAGES.CONNECTING,
            'listening': CONFIG.MESSAGES.LISTENING,
            'error': CONFIG.MESSAGES.ERROR,
        };

        return statusMessages[status] || status;
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'connecting':
                return '🔄';
            case 'listening':
                return '🎤';
            case 'error':
                return '❌';
            default:
                return '💬';
        }
    };

    return (
        <div className={`${styles.status} ${error ? styles.error : styles[status]}`}>
            <span className={styles.icon}>{getStatusIcon()}</span>
            <span className={styles.text}>{getStatusMessage()}</span>
        </div>
    );
}
