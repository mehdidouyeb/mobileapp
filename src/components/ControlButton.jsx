/**
 * Control Button Component
 * 
 * Handles session start/stop functionality with conversation naming
 */

import React, { useState } from 'react';
import { useSession } from '../hooks/useSession.js';
import { useVoiceChat } from '../context/VoiceChatContext';
import { ConversationNameInput } from './ConversationNameInput.jsx';
import styles from './ControlButton.module.css';

export function ControlButton() {
    const { startSession, stopSession, reset, isActive } = useSession();
    const { status } = useVoiceChat();
    const [showNameInput, setShowNameInput] = useState(false);

    const handleStartConversation = async (conversationName) => {
        await startSession(conversationName);
    };

    const handleClick = () => {
        if (isActive) {
            stopSession();
        } else {
            setShowNameInput(true);
        }
    };

    const handleReset = () => {
        reset();
    };

    const isDisabled = status === 'connecting';

    return (
        <>
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

            <ConversationNameInput
                onStartConversation={handleStartConversation}
                isVisible={showNameInput}
                onClose={() => setShowNameInput(false)}
            />
        </>
    );
}
