/**
 * Composant pour la saisie de texte dans le chat
 * Permet à l'utilisateur d'écrire des messages pour améliorer ses compétences d'écriture
 */

import React, { useState, useRef, useEffect } from 'react';
import styles from './TextInput.module.css';

export function TextInput({ onSendMessage, disabled = false, placeholder = "Tapez votre message..." }) {
    const [message, setMessage] = useState('');
    const textareaRef = useRef(null);

    // Auto-resize du textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [message]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message.trim());
            setMessage('');
            // Reset la hauteur du textarea
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form className={styles.textInputContainer} onSubmit={handleSubmit}>
            <div className={styles.inputWrapper}>
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={styles.textInput}
                    rows={1}
                />
                <button
                    type="submit"
                    disabled={!message.trim() || disabled}
                    className={styles.sendButton}
                    title="Envoyer le message"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
                    </svg>
                </button>
            </div>
        </form>
    );
}
