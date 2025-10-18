import React, { useState } from 'react';
import styles from './ConversationNameInput.module.css';

export function ConversationNameInput({ onStartConversation, isVisible }) {
    const [conversationName, setConversationName] = useState('');
    const [showInput, setShowInput] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (conversationName.trim()) {
            onStartConversation(conversationName.trim());
            setConversationName('');
            setShowInput(false);
        }
    };

    const handleQuickStart = () => {
        const timestamp = new Date().toLocaleString();
        onStartConversation(`Conversation ${timestamp}`);
        setShowInput(false);
    };

    if (!isVisible) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>🎤 Start New Conversation</h2>
                <p>Give your conversation a name to easily identify it later:</p>
                
                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        type="text"
                        value={conversationName}
                        onChange={(e) => setConversationName(e.target.value)}
                        placeholder="e.g., John's English Practice, Meeting with Sarah..."
                        className={styles.input}
                        autoFocus
                        maxLength={50}
                    />
                    
                    <div className={styles.buttons}>
                        <button 
                            type="submit" 
                            className={styles.startButton}
                            disabled={!conversationName.trim()}
                        >
                            Start Conversation
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={handleQuickStart}
                            className={styles.quickStartButton}
                        >
                            Quick Start (with timestamp)
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={() => setShowInput(false)}
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
