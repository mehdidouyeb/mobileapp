/**
 * Main Voice Chat Component
 * 
 * Combines all components into the complete voice chat interface
 */

import React, { useState, useEffect } from 'react';
import { ChatArea } from './ChatArea.jsx';
import { ControlButton } from './ControlButton.jsx';
import { StatusDisplay } from './StatusDisplay.jsx';
import { Feedback } from './Feedback.jsx';
import { Dashboard } from './Dashboard.jsx';
import { History } from './History.jsx';
import { ExerciseSuggestions } from './ExerciseSuggestions.jsx';
import { LanguageSelector } from './LanguageSelector.jsx';
import { LanguageDisplay } from './LanguageDisplay.jsx';
import { useVoiceChat } from '../context/VoiceChatContext';
import { useExerciseManager } from '../hooks/useExerciseManager';
import { useSession } from '../hooks/useSession';
import { discussionStorage } from '../utils/discussionStorage';
import styles from './VoiceChat.module.css';

export function VoiceChat() {
    console.log('VoiceChat component rendering...');
    
    try {
        const { isActive, messages, clearMessages, languages, setLanguages, sendTextMessage } = useVoiceChat();
        const { startExercise, getExerciseOpeningMessage } = useExerciseManager();
        const { startSession, sendTextMessageToAI } = useSession();
        const [showDashboard, setShowDashboard] = useState(false);
        const [showHistory, setShowHistory] = useState(false);
        const [showLanguageSelector, setShowLanguageSelector] = useState(!languages?.native || !languages?.target || !languages?.level);
        const [currentDiscussionId, setCurrentDiscussionId] = useState(null);
        const [currentConversationName, setCurrentConversationName] = useState(null);
        const [hasShownDashboard, setHasShownDashboard] = useState(false);
        const [viewingSessionDetails, setViewingSessionDetails] = useState(null);
        const [currentDashboardAnalysis, setCurrentDashboardAnalysis] = useState(null);
        const [currentChatMode, setCurrentChatMode] = useState('voice'); // 'voice' or 'text'

        // Charger les paramètres de langue depuis localStorage (une seule fois au chargement)
        useEffect(() => {
            const savedLanguageSettings = localStorage.getItem('languageSettings');
            if (savedLanguageSettings) {
                try {
                    const languageData = JSON.parse(savedLanguageSettings);
                    if (languageData.native && languageData.target && languageData.level) {
                        setLanguages(languageData);
                        setShowLanguageSelector(false);
                    } else {
                        setShowLanguageSelector(true);
                    }
                } catch (error) {
                    console.error('Erreur lors du chargement des paramètres de langue:', error);
                    // Réinitialiser les paramètres si ils sont corrompus
                    localStorage.removeItem('languageSettings');
                    setShowLanguageSelector(true);
                }
            } else {
                // Si aucun paramètre n'est sauvegardé, afficher le sélecteur
                setShowLanguageSelector(true);
            }
        }, []); // Dépendances vides = exécution unique au montage

        // Réinitialiser hasShownDashboard quand une nouvelle session démarre
        React.useEffect(() => {
            if (isActive && hasShownDashboard) {
                // Une nouvelle session démarre, réinitialiser le flag du dashboard
                setHasShownDashboard(false);
            }
        }, [isActive]);

        // Stocker le nom de conversation quand une nouvelle session démarre
        React.useEffect(() => {
            if (isActive && messages.length === 1) {
                // Une nouvelle session vient de démarrer, récupérer le nom de conversation
                const currentDiscussion = discussionStorage.getCurrentDiscussion();
                if (currentDiscussion?.conversation_name) {
                    setCurrentConversationName(currentDiscussion.conversation_name);
                }
            }
        }, [isActive, messages.length]);

        // Afficher le dashboard quand la session se termine et qu'il y a des messages
        React.useEffect(() => {
            if (!isActive && messages.length > 0 && !showDashboard && !hasShownDashboard) {
                // Attendre un peu pour que l'utilisateur voie la fin de session
                const timer = setTimeout(() => {
                    setShowDashboard(true);
                    setHasShownDashboard(true);
                }, 2000);
                
                return () => clearTimeout(timer);
            }
        }, [isActive, messages.length, showDashboard, hasShownDashboard]);

        const handleCloseDashboard = () => {
            setShowDashboard(false);
            // Empêcher le dashboard de se rouvrir automatiquement
            setHasShownDashboard(true);
            
            // Si on visualisait les détails d'une session, juste fermer le dashboard
            if (viewingSessionDetails) {
                setViewingSessionDetails(null);
                setShowHistory(true);
                return;
            }
            
            // Ajouter la session à l'historique
            const sessionId = currentDiscussionId || Date.now(); // Utiliser l'ID existant ou créer un nouveau
            
            // Utiliser le nom de conversation stocké ou un nom par défaut
            const conversationName = currentConversationName || `Session du ${new Date().toLocaleDateString('fr-FR')}`;
            
            
            const sessionData = {
                id: sessionId,
                date: new Date().toISOString().split('T')[0],
                conversationName: conversationName,
                duration: 'Session terminée',
                rating: 0,
                summary: 'Session d\'apprentissage terminée',
                dashboardAnalysis: currentDashboardAnalysis // Sauvegarder l'analyse du dashboard
            };
            
            // Récupérer l'historique existant
            const existingHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
            
            // Vérifier si la session n'est pas déjà dans l'historique
            const sessionExists = existingHistory.some(session => session.id === sessionId);
            
            if (!sessionExists) {
                // Ajouter la nouvelle session au début de la liste
                const updatedHistory = [sessionData, ...existingHistory];
                
                // Sauvegarder dans localStorage
                localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
            }
            
            setCurrentDiscussionId(null);
            setCurrentConversationName(null);
            // Rediriger vers la page historique
            setShowHistory(true);
        };

        const handleSessionEnd = (discussionData) => {
            setCurrentDiscussionId(discussionData?.id);
            setCurrentConversationName(discussionData?.conversation_name);
            
            // La session sera ajoutée à l'historique quand le dashboard sera fermé
            // Pas de sauvegarde automatique ici
        };

        const handleCloseHistory = () => {
            setShowHistory(false);
            // Ne pas reset hasShownDashboard pour éviter que le dashboard se rouvre
            // setHasShownDashboard(false); // Commenté pour éviter la réouverture automatique
        };

        const handleLanguageSelect = (languageData) => {
            if (languageData && languageData.native && languageData.target && languageData.level) {
                console.log('Language selected:', languageData);
                setLanguages(languageData);
                setShowLanguageSelector(false);
                // Save to localStorage for persistence
                localStorage.setItem('languageSettings', JSON.stringify(languageData));
            } else {
                console.error('Données de langue invalides:', languageData);
            }
        };

        const handleStartExercise = (exercise) => {
            setShowDashboard(false);
            setShowHistory(false);
            // Clear previous messages when starting an exercise
            clearMessages();
            // Reset dashboard state for new session
            setHasShownDashboard(false);
            // Set the exercise name as conversation name
            setCurrentConversationName(exercise.title);
            // Reset viewing session details
            setViewingSessionDetails(null);
            setCurrentDashboardAnalysis(null);
            // Démarrer une nouvelle session avec l'exercice sélectionné
            console.log('Démarrage de l\'exercice:', exercise);
            // Démarrer une vraie session avec le nom de l'exercice et son message d'ouverture
            startSession(exercise.title, exercise.openingMessage);
        };

        const handleSendTextMessage = async (text) => {
            await sendTextMessageToAI(text);
        };

        const handleChatModeChange = (chatMode) => {
            console.log('Chat mode changed to:', chatMode);
            setCurrentChatMode(chatMode);
        };

        const handleEditLanguages = () => {
            console.log('Opening language selector...');
            setShowLanguageSelector(true);
        };

        const handleCloseLanguageSelector = () => {
            console.log('Closing language selector...');
            setShowLanguageSelector(false);
        };

        const handleStartNewChat = () => {
            setShowDashboard(false);
            setShowHistory(false);
            // Clear previous messages when starting a new chat
            clearMessages();
            // Reset dashboard state for new session
            setHasShownDashboard(false);
            // Reset conversation name
            setCurrentConversationName(null);
            // Reset viewing session details
            setViewingSessionDetails(null);
            setCurrentDashboardAnalysis(null);
            // Reset chat mode to default
            setCurrentChatMode('voice');
            // Start a new general chat session
            startSession('Nouvelle Conversation');
        };

        const handleShowHistory = () => {
            setShowHistory(true);
        };

        const handleViewSessionDetails = (session) => {
            console.log('Visualisation des détails de session:', session);
            // Fermer l'historique
            setShowHistory(false);
            // Charger les détails de la session
            setViewingSessionDetails(session);
            // Afficher le dashboard avec les détails de la session
            setShowDashboard(true);
        };

        const handleAnalysisUpdate = (analysis) => {
            setCurrentDashboardAnalysis(analysis);
        };

        return (
            <>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>AI Coach</h1>
                    </header>

                    <main className={styles.main}>
                        {/* Left side - Chat Area */}
                        <div className={styles.chatContainer}>
                            <LanguageDisplay 
                                languages={languages}
                                onEditLanguages={handleEditLanguages}
                                chatMode={currentChatMode}
                            />
                            
                            <ChatArea 
                                onSendTextMessage={handleSendTextMessage}
                                isActive={isActive}
                                chatMode={currentChatMode}
                            />
                        </div>

                        {/* Right side - Controls and Buttons */}
                        <div className={styles.controlsContainer}>
                            <div className={styles.controlGroup}>
                                <ControlButton onSessionEnd={handleSessionEnd} onChatModeChange={handleChatModeChange} />
                            </div>
                            
                            <div className={styles.controlGroup}>
                                <StatusDisplay />
                            </div>
                            
                            <div className={styles.controlGroup}>
                                <Feedback />
                            </div>
                            
                            {/* Permanent buttons */}
                            <div className={styles.controlGroup}>
                                <div className={styles.permanentButtons}>
                                    <button 
                                        className={styles.historyButton}
                                        onClick={handleShowHistory}
                                    >
                                        📚 Historique
                                    </button>
                                    <ExerciseSuggestions onStartExercise={handleStartExercise} />
                                </div>
                            </div>
                        </div>
                    </main>
                </div>

                {/* Dashboard d'analyse */}
                {showDashboard && (
                    <Dashboard 
                        discussionId={currentDiscussionId}
                        onClose={handleCloseDashboard}
                        onStartExercise={handleStartExercise}
                        sessionDetails={viewingSessionDetails}
                        onAnalysisUpdate={handleAnalysisUpdate}
                    />
                )}

                {/* Page historique */}
                {showHistory && (
                    <History 
                        onClose={handleCloseHistory}
                        onViewSessionDetails={handleViewSessionDetails}
                    />
                )}

                {/* Sélecteur de langues */}
                <LanguageSelector 
                    isVisible={showLanguageSelector}
                    onLanguageSelect={handleLanguageSelect}
                    onClose={handleCloseLanguageSelector}
                />
            </>
        );
    } catch (error) {
        console.error('Error in VoiceChat component:', error);
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                <h1>Erreur dans VoiceChat</h1>
                <p>{error.message}</p>
            </div>
        );
    }
}
