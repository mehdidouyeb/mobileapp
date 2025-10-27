/**
 * ExerciseSuggestions Component
 * 
 * Affiche les suggestions d'exercices permanentes
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useVoiceChat } from '../context/VoiceChatContext';
import styles from './ExerciseSuggestions.module.css';

export function ExerciseSuggestions({ onStartExercise }) {
    const [isOpen, setIsOpen] = useState(false);
    const [completedExercises, setCompletedExercises] = useState([]);
    const { languages } = useVoiceChat();

    // Charger les exercices complétés depuis l'historique
    useEffect(() => {
        const loadCompletedExercises = () => {
            const savedHistory = localStorage.getItem('chatHistory');
            if (savedHistory) {
                const history = JSON.parse(savedHistory);
                const completed = history
                    .filter(session => session.conversationName && 
                        exercises.some(ex => ex.title === session.conversationName))
                    .map(session => session.conversationName);
                setCompletedExercises(completed);
            }
        };
        
        loadCompletedExercises();
        
        // Écouter les changements dans localStorage
        const handleStorageChange = () => {
            loadCompletedExercises();
        };
        
        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(loadCompletedExercises, 1000); // Pour les changements dans la même fenêtre
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    // Générer des exercices adaptés aux langues sélectionnées
    const generateExercises = () => {
        const nativeLang = languages?.native?.name || 'votre langue maternelle';
        const targetLang = languages?.target?.name || 'la langue cible';
        const level = languages?.level?.code || 'A1';
        
        return [
            {
                title: "Présentation",
                description: "Apprendre à se présenter",
                openingMessage: `Nous allons nous entraîner à la présentation personnelle en ${targetLang} (Niveau ${level}). Je vais te poser des questions sur toi et tu devras répondre. Restons focalisés sur la présentation personnelle. Commence par me dire ton prénom et ton âge.`,
                difficulty: "Facile",
                duration: level === 'A1' || level === 'A2' ? "3-5 minutes" : "5-10 minutes"
            },
            {
                title: "Restaurant",
                description: "Mise en situation : je suis dans un restaurant",
                openingMessage: `Tu es dans un restaurant et tu souhaites commander un burger avec des frites. Comment t'y prendrais-tu ? Je vais jouer le rôle du serveur et toi celui du client. Restons focalisés sur cette situation de restaurant. Nous allons pratiquer en ${targetLang} (Niveau ${level}). Commençons !`,
                difficulty: level === 'A1' || level === 'A2' ? "Facile" : "Intermédiaire",
                duration: level === 'A1' || level === 'A2' ? "5-8 minutes" : "10-15 minutes"
            },
            {
                title: "Vocabulaire Animal",
                description: "Apprendre le vocabulaire des animaux",
                openingMessage: `EXERCICE DE VOCABULAIRE ANIMAL (Niveau ${level}) : Nous allons apprendre le vocabulaire des animaux. Je vais te donner des noms d'animaux en ${targetLang}, et tu dois me donner la traduction en ${nativeLang}. IMPORTANT : Je ne proposerai QUE des noms d'animaux pendant tout cet exercice. Aucun autre vocabulaire ne sera utilisé. Commençons par le premier animal : "cat". Que réponds-tu ? (Réponds en ${nativeLang})`,
                difficulty: level === 'A1' || level === 'A2' ? "Facile" : "Intermédiaire",
                duration: level === 'A1' || level === 'A2' ? "5-8 minutes" : "8-12 minutes"
            },
            {
                title: "Conversation Quotidienne",
                description: "Pratiquer les conversations de tous les jours",
                openingMessage: `Nous allons pratiquer une conversation quotidienne en ${targetLang} (Niveau ${level}). Commençons par me dire comment s'est passée ta journée aujourd'hui`,
                difficulty: level === 'A1' || level === 'A2' ? "Facile" : "Intermédiaire",
                duration: level === 'A1' || level === 'A2' ? "5-8 minutes" : "12-18 minutes"
            },
            {
                title: "Vocabulaire Travail",
                description: "Apprendre le vocabulaire professionnel",
                openingMessage: `Nous allons travailler le vocabulaire professionnel en ${targetLang} (Niveau ${level}). Dis-moi quel est ton métier et nous allons explorer le vocabulaire lié à ton domaine`,
                difficulty: level === 'A1' || level === 'A2' ? "Facile" : "Intermédiaire",
                duration: level === 'A1' || level === 'A2' ? "8-12 minutes" : "15-20 minutes"
            }
        ];
    };

    const exercises = languages ? generateExercises() : [];

    const handleExerciseClick = (exercise) => {
        onStartExercise(exercise);
        setIsOpen(false);
    };

    // Fonction pour supprimer un exercice complété
    const handleDeleteCompletedExercise = (exerciseTitle) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${exerciseTitle}" de vos exercices complétés ?`)) {
            // Supprimer l'exercice de l'historique
            const savedHistory = localStorage.getItem('chatHistory');
            if (savedHistory) {
                const history = JSON.parse(savedHistory);
                const updatedHistory = history.filter(session => session.conversationName !== exerciseTitle);
                localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
                
                // Mettre à jour l'état local
                setCompletedExercises(prev => prev.filter(title => title !== exerciseTitle));
            }
        }
    };

    // Séparer les exercices entre ceux à faire et ceux déjà faits
    const availableExercises = exercises.filter(exercise => !completedExercises.includes(exercise.title));
    const doneExercises = exercises.filter(exercise => completedExercises.includes(exercise.title));

    return (
        <>
            <button 
                className={styles.toggleButton}
                onClick={() => setIsOpen(!isOpen)}
            >
                💡 Suggestions d'exercices
            </button>

            {isOpen && createPortal(
                <div className={styles.overlay} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99999
                }}>
                    <div className={styles.container}>
                        <div className={styles.header}>
                            <h2>💡 Suggestions d'Exercices</h2>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className={styles.closeButton}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.exercises}>
                            {/* Exercices à faire */}
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>🎯 Exercices à faire</h3>
                                {availableExercises.length > 0 ? (
                                    availableExercises.map((exercise, index) => (
                                        <div 
                                            key={index}
                                            className={styles.exercise}
                                            onClick={() => handleExerciseClick(exercise)}
                                        >
                                            <h4 className={styles.exerciseTitle}>
                                                {exercise.title}
                                            </h4>
                                            <p className={styles.exerciseDescription}>
                                                {exercise.description}
                                            </p>
                                            <div className={styles.exerciseDetails}>
                                                <span className={styles.difficulty}>
                                                    {exercise.difficulty}
                                                </span>
                                                <span className={styles.duration}>
                                                    {exercise.duration}
                                                </span>
                                            </div>
                                            <div className={styles.clickHint}>
                                                👆 Cliquez pour commencer cet exercice
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className={styles.noExercises}>🎉 Tous les exercices ont été complétés !</p>
                                )}
                            </div>

                            {/* Exercices déjà faits */}
                            {doneExercises.length > 0 && (
                                <div className={styles.section}>
                                    <h3 className={styles.sectionTitle}>✅ Exercices complétés</h3>
                                    {doneExercises.map((exercise, index) => (
                                        <div 
                                            key={`done-${index}`}
                                            className={`${styles.exercise} ${styles.completedExercise}`}
                                        >
                                            <div 
                                                className={styles.exerciseContent}
                                                onClick={() => handleExerciseClick(exercise)}
                                            >
                                                <h4 className={styles.exerciseTitle}>
                                                    {exercise.title}
                                                </h4>
                                                <p className={styles.exerciseDescription}>
                                                    {exercise.description}
                                                </p>
                                                <div className={styles.exerciseDetails}>
                                                    <span className={styles.difficulty}>
                                                        {exercise.difficulty}
                                                    </span>
                                                    <span className={styles.duration}>
                                                        {exercise.duration}
                                                    </span>
                                                </div>
                                                <div className={styles.clickHint}>
                                                    👆 Cliquez pour refaire cet exercice
                                                </div>
                                            </div>
                                            <button 
                                                className={styles.deleteExerciseButton}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCompletedExercise(exercise.title);
                                                }}
                                                title="Supprimer cet exercice complété"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
