/**
 * Custom React Hook for Exercise Suggestions
 * 
 * Gère la récupération et l'affichage des exercices suggérés
 * au début des nouvelles sessions
 */

import { useState, useEffect, useCallback } from 'react';

export function useExerciseSuggestions() {
    const [suggestedExercises, setSuggestedExercises] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Charge les exercices suggérés pour la session
     */
    const loadSuggestedExercises = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Version simplifiée pour le test
            setSuggestedExercises(null);
        } catch (err) {
            console.error('Erreur lors du chargement des exercices suggérés:', err);
            setError('Impossible de charger les exercices suggérés');
            setSuggestedExercises(null);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Marque les exercices comme complétés
     */
    const markExercisesAsCompleted = useCallback(async () => {
        try {
            // Version simplifiée pour le test
            setSuggestedExercises(null);
        } catch (err) {
            console.error('Erreur lors de la marque des exercices comme complétés:', err);
        }
    }, []);

    /**
     * Génère un message d'ouverture avec les exercices suggérés
     */
    const generateOpeningMessage = useCallback(() => {
        return "Hello! I'm your AI language coach. What would you like to practice today?";
    }, []);

    // Charger les exercices au montage du composant
    useEffect(() => {
        loadSuggestedExercises();
    }, [loadSuggestedExercises]);

    return {
        suggestedExercises,
        loading,
        error,
        loadSuggestedExercises,
        markExercisesAsCompleted,
        generateOpeningMessage
    };
}
