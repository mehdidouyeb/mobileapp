/**
 * Dashboard Component
 * 
 * Affiche l'analyse complète de la discussion avec feedbacks constructifs
 */

import React, { useState, useEffect } from 'react';
import { useVoiceChat } from '../context/VoiceChatContext';
import { extractAnalysisFromResponse, generateDefaultAnalysis, analyzeMessages } from '../utils/analysisService';
import { discussionStorage } from '../utils/discussionStorage';
import { supabase } from '../utils/supabase';
import { createUserStorage } from '../utils/userStorage';
import styles from './Dashboard.module.css';

export function Dashboard({ discussionId, onClose, onStartExercise, sessionDetails, onAnalysisUpdate, user }) {
    const { messages } = useVoiceChat();
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exercisesSaved, setExercisesSaved] = useState(false);

    const handleSaveExercises = async () => {
        if (!analysis || !analysis.suggestedExercises || analysis.suggestedExercises.length === 0) {
            alert('Aucun exercice à sauvegarder');
            return;
        }

        try {
            if (user && user.id) {
                // Utiliser UserStorage pour gérer les exercices
                const userStorage = createUserStorage(user.id);
                
                // Charger les exercices existants
                const savedCustomExercises = await userStorage.loadCustomExercises();
                
                // Ajouter les nouveaux exercices (éviter les doublons)
                const newExercises = analysis.suggestedExercises.filter(newEx => 
                    !savedCustomExercises.some(ex => ex.title === newEx.title)
                );
                
                const updatedExercises = [...savedCustomExercises, ...newExercises];
                
                // Sauvegarder via UserStorage
                await userStorage.saveCustomExercises(updatedExercises);
                
                alert(`✅ ${newExercises.length} exercice(s) sauvegardé(s) avec succès !`);
            } else {
                // Mode invité
                const savedCustomExercises = JSON.parse(localStorage.getItem('customExercises') || '[]');
                const newExercises = analysis.suggestedExercises.filter(newEx => 
                    !savedCustomExercises.some(ex => ex.title === newEx.title)
                );
                const updatedExercises = [...savedCustomExercises, ...newExercises];
                localStorage.setItem('customExercises', JSON.stringify(updatedExercises));
                
                alert(`✅ ${newExercises.length} exercice(s) sauvegardé(s) avec succès !`);
            }
            
            setExercisesSaved(true);
            
            // Réinitialiser après 2 secondes
            setTimeout(() => {
                setExercisesSaved(false);
            }, 2000);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des exercices:', error);
            alert('Erreur lors de la sauvegarde des exercices');
        }
    };

    useEffect(() => {
        // Si on visualise les détails d'une session passée, utiliser ses données sauvegardées
        if (sessionDetails) {
            if (sessionDetails.dashboardAnalysis) {
                // Utiliser l'analyse sauvegardée de la session
                setAnalysis(sessionDetails.dashboardAnalysis);
            } else {
                // Fallback si pas d'analyse sauvegardée
                setAnalysis({
                    positivePoints: [
                        "Session terminée avec succès",
                        "Conversation fluide et engageante",
                        "Bonne participation de l'utilisateur"
                    ],
                    progress: [
                        "Amélioration continue observée",
                        "Progression dans l'apprentissage",
                        "Développement des compétences linguistiques"
                    ],
                    improvementAreas: [
                        "Continuer à pratiquer régulièrement",
                        "Travailler sur les points faibles identifiés",
                        "Diversifier les sujets de conversation"
                    ],
                    recurringErrors: [
                        "Aucune erreur récurrente majeure détectée",
                        "Quelques hésitations normales",
                        "Opportunités d'amélioration identifiées"
                    ],
                    suggestedExercises: [
                        {
                            title: "Session de révision",
                            description: "Révision des concepts abordés lors de cette session",
                            difficulty: "Intermédiaire",
                            duration: "15 minutes",
                            openingMessage: "Nous allons réviser les concepts abordés lors de votre session précédente."
                        },
                        {
                            title: "Exercice de consolidation",
                            description: "Consolidation des acquis de cette session",
                            difficulty: "Intermédiaire",
                            duration: "20 minutes",
                            openingMessage: "Consolidons les acquis de votre dernière session. Que souhaitez-vous approfondir ?"
                        }
                    ]
                });
            }
            setLoading(false);
        } else {
            // Analyser la session en cours
            const timer = setTimeout(() => {
                // Essayer d'extraire l'analyse des messages de l'IA
                let extractedAnalysis = null;
                
                // Chercher dans les messages de l'IA une analyse JSON
                const aiMessages = messages.filter(msg => !msg.isUser);
                for (const aiMessage of aiMessages) {
                    if (aiMessage.text) {
                        extractedAnalysis = extractAnalysisFromResponse(aiMessage.text);
                        if (extractedAnalysis) break;
                    }
                }
                
                // Si pas d'analyse extraite, générer une analyse par défaut basée sur les messages
                if (!extractedAnalysis) {
                    extractedAnalysis = generateDefaultAnalysis(messages);
                }
                
                // Convertir le format pour le dashboard
                const dashboardAnalysis = {
                    positivePoints: extractedAnalysis.positive_points || extractedAnalysis.positivePoints || [],
                    progress: extractedAnalysis.progress || [],
                    improvementAreas: extractedAnalysis.improvement_areas || extractedAnalysis.improvementAreas || [],
                    recurringErrors: extractedAnalysis.recurring_errors || extractedAnalysis.recurringErrors || [],
                    suggestedExercises: extractedAnalysis.suggested_exercises || extractedAnalysis.suggestedExercises || []
                };
                
                setAnalysis(dashboardAnalysis);
                setLoading(false);
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [discussionId, sessionDetails]);

    // Notifier le parent quand l'analyse est mise à jour
    useEffect(() => {
        if (analysis && onAnalysisUpdate && !sessionDetails) {
            onAnalysisUpdate(analysis);
        }
    }, [analysis, onAnalysisUpdate, sessionDetails]);

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Analyse de votre discussion en cours...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <h2>📊 Rapport de Progression</h2>
                <button onClick={onClose} className={styles.closeButton}>
                    ✕
                </button>
            </div>

            <div className={styles.content}>
                {/* Points positifs */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <span className={styles.icon}>✅</span>
                        Points positifs
                    </h3>
                    <ul className={styles.list}>
                        {analysis.positivePoints.map((point, index) => (
                            <li key={index} className={styles.listItem} style={{ color: '#333' }}>
                                {point}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Progrès réalisés */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <span className={styles.icon}>📈</span>
                        Progrès réalisés
                    </h3>
                    <ul className={styles.list}>
                        {analysis.progress.map((progress, index) => (
                            <li key={index} className={styles.listItem} style={{ color: '#333' }}>
                                {progress}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Pistes d'amélioration */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <span className={styles.icon}>🎯</span>
                        Pistes d'amélioration
                    </h3>
                    <ul className={styles.list}>
                        {analysis.improvementAreas.map((area, index) => (
                            <li key={index} className={styles.listItem} style={{ color: '#333' }}>
                                {area}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Erreurs récurrentes */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <span className={styles.icon}>⚠️</span>
                        Erreurs récurrentes
                    </h3>
                    <ul className={styles.list}>
                        {analysis.recurringErrors.map((error, index) => (
                            <li key={index} className={styles.listItem} style={{ color: '#333' }}>
                                {error}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Exercices suggérés */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <span className={styles.icon}>💪</span>
                        Suggestions d'exercices et mises en situation
                    </h3>
                    <div className={styles.exercises}>
                        {analysis.suggestedExercises.map((exercise, index) => (
                            <div 
                                key={index} 
                                className={styles.exercise}
                                onClick={() => onStartExercise && onStartExercise(exercise)}
                                style={{ cursor: 'pointer', color: '#333' }}
                            >
                                <h4 className={styles.exerciseTitle}>
                                    {exercise.title}
                                </h4>
                                <p className={styles.exerciseDescription}>
                                    {exercise.description}
                                </p>
                                <div className={styles.exerciseDetails}>
                                    <span className={styles.difficulty}>
                                        Difficulté: {exercise.difficulty}
                                    </span>
                                    <span className={styles.duration}>
                                        Durée: {exercise.duration}
                                    </span>
                                </div>
                                <div className={styles.exerciseAction}>
                                    <span className={styles.clickHint}>
                                        👆 Cliquez pour commencer cet exercice
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Actions */}
                <div className={styles.actions}>
                    <button 
                        onClick={handleSaveExercises}
                        className={styles.saveButton}
                        disabled={exercisesSaved}
                        style={exercisesSaved ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                    >
                        {exercisesSaved ? '✅ Exercices sauvegardés !' : '💾 Sauvegarder les exercices'}
                    </button>
                    <button onClick={onClose} className={styles.closeButton}>
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
