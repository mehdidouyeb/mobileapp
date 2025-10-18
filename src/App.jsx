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
    return (
        <VoiceChatProvider>
            <div className={styles.app}>
                <VoiceChat />
            </div>
        </VoiceChatProvider>
    );
}

export default App;
