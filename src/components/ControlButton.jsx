/**
 * Control Button Component
 * 
 * Handles session start/stop functionality
 */

import React from 'react';
import { useSession } from '../hooks/useSession.js';
import { useVoiceChat } from '../context/VoiceChatContext';
import styles from './ControlButton.module.css';

export function ControlButton() {
    const { startSession, stopSession, reset, isActive } = useSession();
    const { status } = useVoiceChat();

    const handleClick = () => {
        if (isActive) {
            stopSession();
        } else {
            startSession();
        }
    };

    const handleReset = () => {
        reset();
    };

    const isDisabled = status === 'connecting';

    return (
        <div className={styles.controls}>
            <button
                className={`${styles.controlButton} ${isActive ? styles.stopButton : styles.startButton}`}
                onClick={handleClick}
                disabled={isDisabled}
            >
                {isDisabled ? 'Connecting...' : (isActive ? 'Stop Chat' : 'Start Chat')}
            </button>

            <button
                className={`${styles.controlButton} ${styles.resetButton}`}
                onClick={handleReset}
                disabled={isActive}
            >
                Reset
            </button>
        </div>
    );
}
