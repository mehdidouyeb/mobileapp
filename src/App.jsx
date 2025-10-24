/**
 * Main App Component
 * 
 * Root component that provides context and renders the voice chat interface
 */

import React from 'react';
import { VoiceChatProvider } from './context/VoiceChatContext';
import { VoiceChat } from './components/VoiceChat.jsx';
import styles from './App.module.css';

function App() {
    console.log('App component rendering...');
    
    try {
        return (
            <VoiceChatProvider>
                <div className={styles.app}>
                    <VoiceChat />
                </div>
            </VoiceChatProvider>
        );
    } catch (error) {
        console.error('Error in App component:', error);
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                <h1>Erreur dans l'application</h1>
                <p>{error.message}</p>
            </div>
        );
    }
}

export default App;
