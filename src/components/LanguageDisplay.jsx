import React from 'react';
import styles from './LanguageDisplay.module.css';

export function LanguageDisplay({ languages, onEditLanguages, chatMode = 'voice' }) {
    if (!languages || !languages.native || !languages.target || !languages.level) {
        return null;
    }

    const { native, target, level } = languages;

    return (
        <div className={styles.languageDisplay}>
            <div className={styles.languageInfo}>
                <div className={styles.languagePair}>
                    <div className={styles.languageItem}>
                        <span className={styles.flag}>{native.flag}</span>
                        <span className={styles.name}>{native.name}</span>
                        <span className={styles.label}>Langue maternelle</span>
                    </div>
                    <div className={styles.arrow}>→</div>
                    <div className={styles.languageItem}>
                        <span className={styles.flag}>{target.flag}</span>
                        <span className={styles.name}>{target.name}</span>
                        <span className={styles.label}>Langue cible</span>
                    </div>
                </div>
                <div className={styles.levelInfo}>
                    <span className={styles.levelLabel}>Niveau :</span>
                    <span className={styles.levelValue}>{level.name}</span>
                </div>
                <div className={styles.chatModeInfo}>
                    <span className={styles.modeLabel}>Mode :</span>
                    <span className={`${styles.modeValue} ${chatMode === 'voice' ? styles.voiceMode : styles.textMode}`}>
                        {chatMode === 'voice' ? '🎤 Vocal' : '✍️ Écrit'}
                    </span>
                </div>
            </div>
            <button 
                className={styles.editButton}
                onClick={onEditLanguages}
                title="Modifier les paramètres de langue"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Modifier
            </button>
        </div>
    );
}
