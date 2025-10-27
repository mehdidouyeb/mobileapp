/**
 * Main App Component
 * 
 * Root component that provides context and renders the voice chat interface
 */

import React, { useState, useEffect } from 'react';
import { VoiceChatProvider } from './context/VoiceChatContext';
import { VoiceChat } from './components/VoiceChat.jsx';
import { Auth } from './components/Auth.jsx';
import { supabase } from './utils/supabase';
import { createUserStorage } from './utils/userStorage';
import styles from './App.module.css';

function App() {
    console.log('App component rendering...');
    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [skipAuth, setSkipAuth] = useState(false);

    // Vérifier si l'utilisateur a déjà une session active
    useEffect(() => {
        let isMounted = true;
        
        const checkSession = async () => {
            try {
                console.log('Vérification de la session...');
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Erreur lors de la vérification de la session:', error);
                    if (isMounted) setLoading(false);
                    return;
                }
                
                if (session?.user) {
                    console.log('Session existante trouvée:', session.user);
                    if (isMounted) {
                        setUser(session.user);
                        try {
                            await loadUserData(session.user.id);
                        } catch (loadError) {
                            console.error('Erreur lors du chargement des données:', loadError);
                        }
                    }
                } else {
                    console.log('Aucune session active');
                }
                
                if (isMounted) setLoading(false);
            } catch (error) {
                console.error('Erreur lors de la vérification de la session:', error);
                if (isMounted) setLoading(false);
            }
        };

        checkSession();

        // Timeout de sécurité au cas où loadUserData serait bloqué
        const timeout = setTimeout(() => {
            if (isMounted && loading) {
                console.warn('Timeout: libération du chargement');
                setLoading(false);
            }
        }, 5000);

        return () => {
            isMounted = false;
            clearTimeout(timeout);
        };

        // Écouter les changements d'authentification
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event, session);
                if (session?.user) {
                    setUser(session.user);
                    await loadUserData(session.user.id);
                } else {
                    setUser(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const handleAuthSuccess = async (userData) => {
        console.log('Authentification réussie:', userData);
        setUser(userData);
        
        // Charger les données de l'utilisateur depuis Supabase
        await loadUserData(userData.id);
        
        // Si c'est une nouvelle inscription, créer les paramètres par défaut
        const { data: existingSettings } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userData.id)
            .single();
            
        if (!existingSettings) {
            // Créer les paramètres par défaut pour le nouvel utilisateur
            await supabase
                .from('user_settings')
                .insert({
                    user_id: userData.id,
                    language_settings: {
                        native: null,
                        target: null,
                        level: null
                    }
                });
        }
    };

    const handleSkipAuth = () => {
        console.log('Utilisateur choisit de continuer sans compte');
        setSkipAuth(true);
        localStorage.setItem('wasGuest', 'true');
    };

    const loadUserData = async (userId) => {
        try {
            console.log('Chargement des données pour l\'utilisateur:', userId);
            
            // Créer une instance UserStorage pour cet utilisateur
            const userStorage = createUserStorage(userId);
            
            // Stocker l'ID de l'utilisateur actuel
            localStorage.setItem('currentUserId', userId);
            
            // Charger les paramètres de langue (sauvegardés dans UserStorage)
            const languageSettings = await userStorage.loadLanguageSettings();
            if (languageSettings && languageSettings.native && languageSettings.target && languageSettings.level) {
                console.log('✅ Paramètres de langue chargés:', languageSettings);
            }
            
            // Charger l'historique (le service gère automatiquement le localStorage)
            await userStorage.loadHistory();
            
            // Charger les exercices personnalisés (le service gère automatiquement le localStorage)
            await userStorage.loadCustomExercises();
            
            console.log('✅ Données chargées avec succès pour l\'utilisateur:', userId);
        } catch (error) {
            console.error('Erreur lors du chargement des données utilisateur:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setSkipAuth(false);
            // Ne supprimer localStorage que si l'utilisateur était en mode guest
            // Les données sont déjà sauvegardées dans Supabase pour les utilisateurs connectés
            const wasGuest = localStorage.getItem('wasGuest') === 'true';
            if (wasGuest) {
                localStorage.removeItem('chatHistory');
                localStorage.removeItem('languageSettings');
                localStorage.removeItem('customExercises');
                localStorage.removeItem('wasGuest');
            }
            console.log('Déconnexion réussie');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    };

    // Afficher un écran de chargement pendant la vérification de la session
    if (loading) {
        return (
            <div className={styles.app}>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '20px'
                }}>
                    <div style={{ 
                        color: 'white', 
                        fontSize: '1.5em',
                        textAlign: 'center',
                        marginBottom: '20px'
                    }}>
                        Chargement...
                    </div>
                    <div style={{ 
                        color: 'rgba(255,255,255,0.7)', 
                        fontSize: '0.9em',
                        textAlign: 'center'
                    }}>
                        Si cette page ne se charge pas, vérifiez la console pour les erreurs.
                    </div>
                </div>
            </div>
        );
    }

    // Afficher la page d'authentification si l'utilisateur n'est pas connecté et n'a pas choisi de passer
    if (!user && !skipAuth) {
        return (
            <div className={styles.app}>
                <Auth onAuthSuccess={handleAuthSuccess} onSkip={handleSkipAuth} />
            </div>
        );
    }

    // Afficher l'application principale
    try {
        return (
            <VoiceChatProvider user={user} onLogout={handleLogout}>
                <div className={styles.app}>
                    <VoiceChat user={user} />
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
