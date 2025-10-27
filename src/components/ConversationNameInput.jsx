import React, { useState } from 'react';
import styles from './ConversationNameInput.module.css';

export function ConversationNameInput({ onStartConversation, isVisible, onClose }) {
    const [conversationName, setConversationName] = useState('');
    const [chatMode, setChatMode] = useState('voice'); // 'voice' or 'text'

    const handleSubmit = (e) => {
        e.preventDefault();
        if (conversationName.trim()) {
            onStartConversation(conversationName.trim(), chatMode);
            setConversationName('');
            setChatMode('voice');
            onClose(); // Close the modal
        }
    };


    if (!isVisible) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>🎤 Start New Conversation</h2>
                <p>Choose your conversation mode and give it a name:</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Chat Mode Selection */}
                    <div className={styles.modeSelection}>
                        <h3>Conversation Mode:</h3>
                        <div className={styles.modeButtons}>
                            <button
                                type="button"
                                className={`${styles.modeButton} ${chatMode === 'voice' ? styles.active : ''}`}
                                onClick={() => setChatMode('voice')}
                            >
                                🎤 Voice Chat
                            </button>
                            <button
                                type="button"
                                className={`${styles.modeButton} ${chatMode === 'text' ? styles.active : ''}`}
                                onClick={() => setChatMode('text')}
                            >
                                ✍️ Text Chat
                            </button>
                        </div>
                    </div>

                    {/* Conversation Name Input */}
                    <div className={styles.nameInput}>
                        <label htmlFor="conversationName">Conversation Name:</label>
                        <input
                            id="conversationName"
                            type="text"
                            value={conversationName}
                            onChange={(e) => setConversationName(e.target.value)}
                            placeholder="e.g., John's English Practice, Meeting with Sarah..."
                            className={styles.input}
                            autoFocus
                            maxLength={50}
                        />
                    </div>

                    <div className={styles.buttons}>
                        <button
                            type="submit"
                            className={styles.startButton}
                            disabled={!conversationName.trim()}
                        >
                            {chatMode === 'voice' ? '🎤 Start Voice Chat' : '✍️ Start Text Chat'}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.cancelButton}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
