/**
 * Message Component
 * 
 * Displays individual chat messages with proper styling
 */

import React from 'react';
import styles from './Message.module.css';

export function Message({ message, isLive = false }) {
    const { text, isUser } = message;

    return (
        <div className={`${styles.message} ${isUser ? styles.userMessage : styles.aiMessage} ${isLive ? styles.liveMessage : ''}`}>
            <div className={styles.messageContent}>
                <p>{text}</p>
                {isLive && <span className={styles.typingIndicator}>...</span>}
            </div>
        </div>
    );
}
