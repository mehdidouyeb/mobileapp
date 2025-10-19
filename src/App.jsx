/**
 * Main App Component
 * 
 * Root component that provides context and renders the voice chat interface
 */

import React from 'react';
import { VoiceChatProvider } from './context/VoiceChatContext';
import { VoiceChat } from './components/VoiceChat.jsx';
import { CONFIG } from './utils/config.js';
import styles from './App.module.css';

function App() {
    console.log('App component rendering...');
    
    // Check if API key is configured
    if (!CONFIG.API_KEY || CONFIG.API_KEY === 'MISSING_API_KEY' || CONFIG.API_KEY === 'demo_key') {
        return (
            <div className={styles.app}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
                }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: '700' }}>
                        🔑 API Key Required
                    </h1>
                    <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: '0.9', maxWidth: '600px' }}>
                        To use this voice chat app, you need to configure your Gemini API key.
                    </p>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '1rem',
                        padding: '2rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        maxWidth: '500px',
                        width: '100%'
                    }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Setup Instructions:</h3>
                        <ol style={{ textAlign: 'left', lineHeight: '1.6' }}>
                            <li>Create a <code>.env</code> file in your project root</li>
                            <li>Add: <code>VITE_GEMINI_API_KEY=your_api_key_here</code></li>
                            <li>Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF50', textDecoration: 'underline' }}>Google AI Studio</a></li>
                            <li>Restart the development server</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }
    
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
