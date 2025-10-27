/**
 * History Component
 * 
 * Affiche l'historique des discussions et analyses précédentes
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './History.module.css';

export function History({ onClose, onViewSessionDetails }) {
    // L'historique commence vide et se remplira avec les vraies sessions
    const [historyData, setHistoryData] = useState([]);

    // Charger l'historique depuis le localStorage ou une base de données
    useEffect(() => {
        const loadHistory = () => {
            const savedHistory = localStorage.getItem('chatHistory');
            if (savedHistory) {
                setHistoryData(JSON.parse(savedHistory));
            }
        };
        
        loadHistory();
        
        // Écouter les changements dans localStorage
        const handleStorageChange = () => {
            loadHistory();
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // Vérifier les changements toutes les secondes (pour les changements dans la même fenêtre)
        const interval = setInterval(loadHistory, 1000);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    // Fonction pour supprimer une session de l'historique
    const handleDeleteSession = (sessionId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette session de l\'historique ?')) {
            const updatedHistory = historyData.filter(session => session.id !== sessionId);
            setHistoryData(updatedHistory);
            localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
        }
    };

    return createPortal(
        <div className={styles.history} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999
        }}>
            <div className={styles.header}>
                <h2>📚 Historique des Sessions</h2>
                <button onClick={onClose} className={styles.closeButton}>
                    ✕
                </button>
            </div>

            <div className={styles.content}>
                <div className={styles.sessionsList}>
                    {historyData.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📝</div>
                            <h3>Aucune session enregistrée</h3>
                            <p>Commencez une nouvelle conversation pour voir votre historique ici.</p>
                        </div>
                    ) : (
                        historyData.map((session) => (
                            <div key={session.id} className={styles.sessionCard}>
                                <div className={styles.sessionHeader}>
                                    <h3 className={styles.sessionTitle}>
                                        {session.conversationName}
                                    </h3>
                                    <span className={styles.sessionDate}>
                                        {session.date}
                                    </span>
                                </div>
                                
                                <div className={styles.sessionDetails}>
                                    <span className={styles.duration}>
                                        ⏱️ {session.duration}
                                    </span>
                                    <span className={styles.rating}>
                                        {'⭐'.repeat(session.rating)}
                                    </span>
                                </div>
                                
                                <p className={styles.sessionSummary}>
                                    {session.summary}
                                </p>
                                
                                <div className={styles.sessionActions}>
                                    <button 
                                        className={styles.viewDetailsButton}
                                        onClick={() => onViewSessionDetails && onViewSessionDetails(session)}
                                    >
                                        Voir les détails
                                    </button>
                                    <button 
                                        className={styles.deleteButton}
                                        onClick={() => handleDeleteSession(session.id)}
                                        title="Supprimer cette session"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
