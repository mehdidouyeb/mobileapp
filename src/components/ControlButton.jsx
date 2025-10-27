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

export function ControlButton({ onSessionEnd, onChatModeChange, onConversationNameSet }) {
    const { startSession, stopSession, reset, isActive } = useSession();
    const { status } = useVoiceChat();
    const [showNameInput, setShowNameInput] = useState(false);

    const handleStartConversation = async (conversationName, chatMode = 'voice') => {
        // Notifier le parent du nom de conversation avant de démarrer
        if (onConversationNameSet) {
            onConversationNameSet(conversationName);
        }
        
        await startSession(conversationName, null, chatMode);
        // Notify parent component of the chat mode change
        if (onChatModeChange) {
            onChatModeChange(chatMode);
        }
        setShowNameInput(false); // Close the modal after starting
    };

    const handleClick = async () => {
        if (isActive) {
            const endedDiscussion = await stopSession();
            if (onSessionEnd && endedDiscussion) {
                onSessionEnd(endedDiscussion);
            }
        } else {
            setShowNameInput(true);
        }
    };

    const handleReset = () => {
        reset();
        // Forcer le reset complet de la session
        window.location.reload();
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
                        {isDisabled ? 'Connecting...' : (isActive ? 'Stop Chat' : 'Start New Chat')}
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
