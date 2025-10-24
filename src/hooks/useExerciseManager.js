/**
 * useExerciseManager Hook
 * 
 * Gère les exercices et leurs messages de démarrage
 */

import { useState, useCallback } from 'react';
import { useVoiceChat } from '../context/VoiceChatContext';

export function useExerciseManager() {
    const { addMessage } = useVoiceChat();
    const [currentExercise, setCurrentExercise] = useState(null);

    const startExercise = useCallback((exercise) => {
        setCurrentExercise(exercise);
        
        // Ajouter le message de démarrage de l'IA
        addMessage({
            id: Date.now(),
            text: exercise.openingMessage,
            isUser: false,
            isExerciseStart: true
        });
    }, [addMessage]);

    const clearExercise = useCallback(() => {
        setCurrentExercise(null);
    }, []);

    const getExerciseOpeningMessage = useCallback((exerciseTitle) => {
        const exercises = {
            "Présentation": "nous allons nous entrainer à se présenter, commences par me donner ton prénom",
            "Restaurant": "tu es dans un restaurant et tu souhaites passer une commande de burger frites, comment t'y prendrais tu, je vais agir comme un restaureur et toi tu agiras comme le client de mon restaurant",
            "Vocabulaire Animal": "nous allons apprendre le vocabulaire des animaux, pour chaque animal que je vais te donner, tu vas donner sa traduction : chat",
            "Conversation Quotidienne": "nous allons pratiquer une conversation quotidienne. Commençons par me dire comment s'est passée ta journée aujourd'hui",
            "Vocabulaire Travail": "nous allons travailler le vocabulaire professionnel. Dis-moi quel est ton métier et nous allons explorer le vocabulaire lié à ton domaine"
        };
        
        return exercises[exerciseTitle] || "Bonjour ! Commençons cette nouvelle session d'apprentissage.";
    }, []);

    return {
        currentExercise,
        startExercise,
        clearExercise,
        getExerciseOpeningMessage
    };
}
