/**
 * User Storage Service
 * 
 * Service centralisé pour la gestion du stockage des données utilisateur
 * avec isolation complète entre les comptes
 */

import { supabase } from './supabase';

/**
 * Classe pour gérer le stockage namespaced par utilisateur
 */
export class UserStorage {
    constructor(userId) {
        if (!userId) {
            throw new Error('UserStorage requires a userId');
        }
        this.userId = userId;
    }

    /**
     * Génère une clé namespaced pour localStorage
     */
    getKey(key) {
        return `${this.userId}:${key}`;
    }

    /**
     * Récupère une valeur depuis localStorage
     */
    getItem(key, defaultValue = null) {
        try {
            const namespacedKey = this.getKey(key);
            const item = localStorage.getItem(namespacedKey);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Erreur lors de la lecture de ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Sauvegarde une valeur dans localStorage
     */
    setItem(key, value) {
        try {
            const namespacedKey = this.getKey(key);
            localStorage.setItem(namespacedKey, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Erreur lors de l'écriture de ${key}:`, error);
            return false;
        }
    }

    /**
     * Supprime une valeur de localStorage
     */
    removeItem(key) {
        try {
            const namespacedKey = this.getKey(key);
            localStorage.removeItem(namespacedKey);
            return true;
        } catch (error) {
            console.error(`Erreur lors de la suppression de ${key}:`, error);
            return false;
        }
    }

    /**
     * Vérifie si une clé existe dans localStorage
     */
    hasItem(key) {
        const namespacedKey = this.getKey(key);
        return localStorage.getItem(namespacedKey) !== null;
    }

    /**
     * Charge les paramètres de langue depuis Supabase
     */
    async loadLanguageSettings() {
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('language_settings')
                .eq('user_id', this.userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Erreur lors du chargement des paramètres:', error);
                return null;
            }

            if (data?.language_settings) {
                const settings = data.language_settings;
                // Sauvegarder localement pour un accès rapide
                this.setItem('language_settings', settings);
                return settings;
            }

            return null;
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
            return null;
        }
    }

    /**
     * Sauvegarde les paramètres de langue dans Supabase
     */
    async saveLanguageSettings(settings) {
        try {
            // Sauvegarder localement d'abord
            this.setItem('language_settings', settings);

            // Sauvegarder dans Supabase
            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: this.userId,
                    language_settings: settings,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });

            if (error) {
                console.error('Erreur lors de la sauvegarde des paramètres:', error);
                return false;
            }

            console.log('Paramètres de langue sauvegardés pour l\'utilisateur:', this.userId);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
            return false;
        }
    }

    /**
     * Charge l'historique depuis Supabase
     */
    async loadHistory() {
        try {
            const { data, error } = await supabase
                .from('discussions')
                .select('*')
                .eq('user_id', this.userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Erreur lors du chargement de l\'historique:', error);
                return [];
            }

            if (data && data.length > 0) {
                const formatted = data.map(disc => ({
                    id: disc.id,
                    date: disc.created_at.split('T')[0],
                    conversationName: disc.conversation_name,
                    duration: 'Session terminée',
                    rating: 0,
                    summary: 'Session d\'apprentissage terminée',
                    dashboardAnalysis: disc.analysis
                }));

                // Sauvegarder localement
                this.setItem('chat_history', formatted);
                console.log(`Historique chargé: ${formatted.length} sessions pour l'utilisateur`, this.userId);
                return formatted;
            }

            console.log('Aucun historique trouvé pour l\'utilisateur:', this.userId);
            return [];
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
            return [];
        }
    }

    /**
     * Sauvegarde une session dans Supabase
     */
    async saveSession(sessionData) {
        try {
            const { error } = await supabase
                .from('discussions')
                .insert({
                    id: sessionData.id,
                    user_id: this.userId,
                    conversation_name: sessionData.conversationName,
                    analysis: sessionData.dashboardAnalysis,
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Erreur lors de la sauvegarde de la session:', error);
                return false;
            }

            console.log('Session sauvegardée pour l\'utilisateur:', this.userId);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la session:', error);
            return false;
        }
    }

    /**
     * Charge les exercices personnalisés depuis Supabase
     */
    async loadCustomExercises() {
        try {
            const { data, error } = await supabase
                .from('suggested_exercises')
                .select('exercises')
                .eq('user_id', this.userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) {
                console.error('Erreur lors du chargement des exercices:', error);
                return [];
            }

            // Récupérer la première entrée si elle existe
            if (data && data.length > 0 && data[0]?.exercises && Array.isArray(data[0].exercises)) {
                // Sauvegarder localement
                this.setItem('custom_exercises', data[0].exercises);
                console.log(`Exercices chargés: ${data[0].exercises.length} pour l'utilisateur`, this.userId);
                return data[0].exercises;
            }

            console.log('Aucun exercice personnalisé trouvé pour l\'utilisateur:', this.userId);
            return [];
        } catch (error) {
            console.error('Erreur lors du chargement des exercices:', error);
            return [];
        }
    }

    /**
     * Sauvegarde les exercices personnalisés dans Supabase
     */
    async saveCustomExercises(exercises) {
        try {
            // Sauvegarder localement
            this.setItem('custom_exercises', exercises);

            // Marquer les anciennes entrées comme inactives
            await supabase
                .from('suggested_exercises')
                .update({ is_active: false })
                .eq('user_id', this.userId)
                .eq('is_active', true);

            // Créer une nouvelle entrée
            const { error } = await supabase
                .from('suggested_exercises')
                .insert({
                    user_id: this.userId,
                    exercises: exercises,
                    is_active: true,
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Erreur lors de la sauvegarde des exercices:', error);
                return false;
            }

            console.log('Exercices sauvegardés pour l\'utilisateur:', this.userId);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des exercices:', error);
            return false;
        }
    }

    /**
     * Supprime une session de l'historique
     */
    async deleteSession(sessionId) {
        try {
            const { error } = await supabase
                .from('discussions')
                .delete()
                .eq('id', sessionId)
                .eq('user_id', this.userId); // Double vérification de sécurité

            if (error) {
                console.error('Erreur lors de la suppression de la session:', error);
                return false;
            }

            console.log('Session supprimée pour l\'utilisateur:', this.userId);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression de la session:', error);
            return false;
        }
    }

    /**
     * Nettoie toutes les données de l'utilisateur (utile pour la suppression de compte)
     */
    async clearAllUserData() {
        try {
            // Supprimer toutes les sessions
            await supabase
                .from('discussions')
                .delete()
                .eq('user_id', this.userId);

            // Supprimer les exercices personnalisés
            await supabase
                .from('suggested_exercises')
                .delete()
                .eq('user_id', this.userId);

            // Supprimer les paramètres
            await supabase
                .from('user_settings')
                .delete()
                .eq('user_id', this.userId);

            // Nettoyer localStorage
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(`${this.userId}:`)) {
                    localStorage.removeItem(key);
                }
            });

            console.log('Toutes les données ont été supprimées pour l\'utilisateur:', this.userId);
            return true;
        } catch (error) {
            console.error('Erreur lors du nettoyage des données:', error);
            return false;
        }
    }
}

/**
 * Factory function pour créer une instance UserStorage
 */
export function createUserStorage(userId) {
    if (!userId) {
        throw new Error('userId is required');
    }
    return new UserStorage(userId);
}

/**
 * Utilitaire pour obtenir le stockage de l'utilisateur actuel
 */
export function getUserStorage() {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) {
        console.warn('Aucun userId trouvé dans localStorage');
        return null;
    }
    return new UserStorage(userId);
}
