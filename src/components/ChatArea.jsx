/**
 * Chat Area Component
 * 
 * Displays the conversation history and live transcriptions
 */

import React, { useEffect, useRef } from 'react';
import { Message } from './Message.jsx';
import { TextInput } from './TextInput.jsx';
import { useVoiceChat } from '../context/VoiceChatContext';
import styles from './ChatArea.module.css';

export function ChatArea({ onSendTextMessage, isActive = false, chatMode = 'voice' }) {
    const { messages, currentUserText, currentAIText } = useVoiceChat();
    const chatAreaRef = useRef(null);
    
    console.log('ChatArea received chatMode:', chatMode);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [messages, currentUserText, currentAIText]);

    return (
        <div className={styles.chatArea} ref={chatAreaRef}>
            {/* Welcome message */}
            {messages.length === 0 && !currentUserText && !currentAIText && (
                <Message
                    message={{ text: '👋 Hi! Click "Start Chat" to begin talking with me.', isUser: false }}
                />
            )}

            {/* Message history */}
            {messages.map((message) => (
                <Message key={message.id} message={message} />
            ))}

            {/* Live user transcription */}
            {currentUserText && (
                <Message
                    message={{ text: currentUserText, isUser: true }}
                    isLive={true}
                />
            )}

            {/* Live AI transcription */}
            {currentAIText && (
                <Message
                    message={{ text: currentAIText, isUser: false }}
                    isLive={true}
                />
            )}

            {/* Text input for writing practice - only show in text mode */}
            {chatMode === 'text' && (
                <TextInput
                    onSendMessage={onSendTextMessage}
                    disabled={false}
                    placeholder="Tapez votre message pour pratiquer l'écriture..."
                />
            )}
        </div>
    );
}
