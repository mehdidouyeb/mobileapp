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
import { supabase } from '../utils/supabase';
import { createUserStorage } from '../utils/userStorage';
import styles from './VoiceChat.module.css';

export function VoiceChat({ user }) {
    console.log('VoiceChat component rendering...');
    
    try {
        const { isActive, messages, clearMessages, languages, setLanguages, sendTextMessage, onLogout } = useVoiceChat();
        const { startExercise, getExerciseOpeningMessage } = useExerciseManager();
        const { startSession, sendTextMessageToAI } = useSession();
        const [showDashboard, setShowDashboard] = useState(false);
        const [showHistory, setShowHistory] = useState(false);
        const [showLanguageSelector, setShowLanguageSelector] = useState(false); // Commencer par false, sera mis à jour après chargement
        const [isLoadingLanguages, setIsLoadingLanguages] = useState(true); // Flag pour indiquer le chargement
        const [currentDiscussionId, setCurrentDiscussionId] = useState(null);
        const [currentConversationName, setCurrentConversationName] = useState(null);
        const [hasShownDashboard, setHasShownDashboard] = useState(false);
        const [viewingSessionDetails, setViewingSessionDetails] = useState(null);
        const [currentDashboardAnalysis, setCurrentDashboardAnalysis] = useState(null);
        const [currentChatMode, setCurrentChatMode] = useState('voice'); // 'voice' or 'text'

        // Charger les paramètres de langue depuis le storage approprié
        useEffect(() => {
            const loadLanguageSettings = async () => {
                setIsLoadingLanguages(true);
                
                // Attendre un court délai pour s'assurer que App.jsx a terminé le chargement
                await new Promise(resolve => setTimeout(resolve, 100));
                
                let languageData = null;
                
                if (user && user.id) {
                    // Utiliser UserStorage pour l'utilisateur connecté
                    const userStorage = createUserStorage(user.id);
                    
                    // Vérifier dans localStorage d'abord
                    languageData = userStorage.getItem('language_settings', null);
                    
                    // Si pas dans localStorage, essayer de charger depuis Supabase
                    if (!languageData) {
                        console.log('Aucun paramètre trouvé dans localStorage, chargement depuis Supabase...');
                        languageData = await userStorage.loadLanguageSettings();
                        if (languageData) {
                            console.log('✅ Paramètres chargés depuis Supabase');
                        }
                    } else {
                        console.log('✅ Paramètres trouvés dans localStorage');
                    }
                } else {
                    // Mode invité - charger depuis la clé générique
                    const savedLanguageSettings = localStorage.getItem('languageSettings');
                    if (savedLanguageSettings) {
                        try {
                            languageData = JSON.parse(savedLanguageSettings);
                            console.log('✅ Paramètres trouvés pour le mode invité');
                        } catch (error) {
                            console.error('Erreur lors du chargement des paramètres de langue:', error);
                        }
                    }
                }
                
                // Vérifier si les paramètres sont complets
                if (languageData && languageData.native && languageData.target && languageData.level) {
                    // Paramètres existants : les charger et masquer le sélecteur
                    // Vérifier si les paramètres ont réellement changé pour éviter la boucle infinie
                    const hasChanged = !languages || 
                        JSON.stringify(languages) !== JSON.stringify(languageData);
                    
                    if (hasChanged) {
                        setLanguages(languageData);
                        console.log('✅ Paramètres de langue chargés dans le contexte:', {
                            native: languageData.native?.name,
                            target: languageData.target?.name,
                            level: languageData.level?.code
                        });
                    }
                    setShowLanguageSelector(false);
                } else {
                    // Aucun paramètre : afficher le sélecteur
                    console.log('⚠️ Aucun paramètre de langue trouvé');
                    console.log('Contenu de languageData:', languageData);
                    setShowLanguageSelector(true);
                }
                
                setIsLoadingLanguages(false);
                console.log('✅ Chargement des paramètres terminé');
            };
            
            loadLanguageSettings();
        }, [user]); // Re-exécuter quand l'utilisateur change

        // Réinitialiser hasShownDashboard quand une nouvelle session démarre
        React.useEffect(() => {
            if (isActive && hasShownDashboard) {
                // Une nouvelle session démarre, réinitialiser le flag du dashboard
                setHasShownDashboard(false);
            }
        }, [isActive]);



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

        const handleCloseDashboard = async () => {
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
            const sessionId = currentDiscussionId || Date.now();
            // Utiliser le nom de conversation fourni par l'utilisateur ou un nom par défaut
            const conversationName = currentConversationName || 'Nouvelle session';
            
            const sessionData = {
                id: sessionId,
                date: new Date().toISOString().split('T')[0],
                conversationName: conversationName,
                duration: 'Session terminée',
                rating: 0,
                summary: 'Session d\'apprentissage terminée',
                dashboardAnalysis: currentDashboardAnalysis
            };
            
            if (user && user.id) {
                // Utiliser UserStorage pour sauvegarder
                try {
                    const userStorage = createUserStorage(user.id);
                    
                    // Récupérer l'historique actuel depuis le storage namespaced
                    const existingHistory = userStorage.getItem('chat_history', []);
                    
                    // Vérifier si la session n'existe pas déjà
                    const sessionExists = existingHistory.some(session => session.id === sessionId);
                    
                    if (!sessionExists) {
                        // Ajouter la nouvelle session
                        const updatedHistory = [sessionData, ...existingHistory];
                        userStorage.setItem('chat_history', updatedHistory);
                        
                        // Sauvegarder dans Supabase
                        await userStorage.saveSession(sessionData);
                    }
                } catch (error) {
                    console.error('Erreur lors de la sauvegarde de la session:', error);
                }
            } else {
                // Mode invité - utiliser localStorage générique
                const existingHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
                const sessionExists = existingHistory.some(session => session.id === sessionId);
                
                if (!sessionExists) {
                    const updatedHistory = [sessionData, ...existingHistory];
                    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
                }
            }
            
            setCurrentDiscussionId(null);
            setCurrentConversationName(null);
            // Rediriger vers la page historique
            setShowHistory(true);
        };

        const handleSessionEnd = (discussionData) => {
            if (discussionData?.id) {
                setCurrentDiscussionId(discussionData.id);
            }
            if (discussionData?.conversation_name) {
                console.log('📝 Nom de conversation reçu:', discussionData.conversation_name);
                setCurrentConversationName(discussionData.conversation_name);
            }
            
            // La session sera ajoutée à l'historique quand le dashboard sera fermé
            // Pas de sauvegarde automatique ici
        };

        const handleCloseHistory = () => {
            setShowHistory(false);
            // Ne pas reset hasShownDashboard pour éviter que le dashboard se rouvre
            // setHasShownDashboard(false); // Commenté pour éviter la réouverture automatique
        };

        const handleLanguageSelect = async (languageData) => {
            if (languageData && languageData.native && languageData.target && languageData.level) {
                console.log('Language selected:', languageData);
                setLanguages(languageData);
                setShowLanguageSelector(false);
                
                // Sauvegarder les paramètres
                if (user && user.id) {
                    // Utiliser UserStorage pour sauvegarder
                    try {
                        const userStorage = createUserStorage(user.id);
                        await userStorage.saveLanguageSettings(languageData);
                        console.log('✅ Paramètres de langue sauvegardés avec succès');
                    } catch (error) {
                        console.error('Erreur lors de la sauvegarde des paramètres:', error);
                    }
                } else {
                    // Mode invité
                    localStorage.setItem('languageSettings', JSON.stringify(languageData));
                }
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

        const handleConversationNameSet = (conversationName) => {
            console.log('📝 Nom de conversation défini:', conversationName);
            setCurrentConversationName(conversationName);
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

        // Afficher un écran de chargement pendant la vérification des paramètres
        if (isLoadingLanguages) {
            return (
                <div className={styles.container}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100vh',
                        flexDirection: 'column'
                    }}>
                        <div className={styles.loading} style={{ fontSize: '1.2em', marginBottom: '20px' }}>
                            Chargement de vos paramètres...
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>AI Coach</h1>
                    {user && onLogout && (
                        <button 
                            className={styles.logoutButton}
                            onClick={onLogout}
                            title="Se déconnecter"
                        >
                            Se déconnecter
                        </button>
                    )}
                </header>

                <main className={styles.main}>
                    <div className={styles.mainContent}>
                        <div className={styles.chatWrapper}>
                            <ChatArea 
                                onSendTextMessage={handleSendTextMessage}
                                isActive={isActive}
                                chatMode={currentChatMode}
                            />
                        </div>
                        
                        {/* Affichage des paramètres de langue à droite */}
                        <div className={styles.sidebar}>
                            <LanguageDisplay 
                                languages={languages}
                                onEditLanguages={handleEditLanguages}
                                chatMode={currentChatMode}
                            />
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <ControlButton 
                            onSessionEnd={handleSessionEnd} 
                            onChatModeChange={handleChatModeChange}
                            onConversationNameSet={handleConversationNameSet}
                        />
                        <StatusDisplay />
                        <Feedback />
                        
                        {/* Boutons permanents */}
                        <div className={styles.permanentButtons}>
                            <button 
                                className={styles.historyButton}
                                onClick={handleShowHistory}
                            >
                                📚 Historique
                            </button>
                            <ExerciseSuggestions onStartExercise={handleStartExercise} user={user} />
                        </div>
                    </div>
                </main>

                {/* Dashboard d'analyse */}
                {showDashboard && (
                    <Dashboard 
                        discussionId={currentDiscussionId}
                        onClose={handleCloseDashboard}
                        onStartExercise={handleStartExercise}
                        sessionDetails={viewingSessionDetails}
                        onAnalysisUpdate={handleAnalysisUpdate}
                        user={user}
                    />
                )}

                {/* Page historique */}
                {showHistory && (
                    <History 
                        onClose={handleCloseHistory}
                        onViewSessionDetails={handleViewSessionDetails}
                        user={user}
                    />
                )}

                {/* Sélecteur de langues - ne pas afficher pendant le chargement */}
                {!isLoadingLanguages && (
                    <LanguageSelector 
                        isVisible={showLanguageSelector}
                        onLanguageSelect={handleLanguageSelect}
                        onClose={handleCloseLanguageSelector}
                    />
                )}

            </div>
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
