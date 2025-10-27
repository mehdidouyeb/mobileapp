/**
 * Language Selector Component
 * 
 * Permet à l'utilisateur de sélectionner sa langue maternelle et la langue cible
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './LanguageSelector.module.css';

const LANGUAGES = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
];

const LANGUAGE_LEVELS = [
    { code: 'A1', name: 'A1 - Débutant', description: 'Peut comprendre et utiliser des expressions familières et quotidiennes' },
    { code: 'A2', name: 'A2 - Élémentaire', description: 'Peut comprendre des phrases et expressions fréquemment utilisées' },
    { code: 'B1', name: 'B1 - Intermédiaire', description: 'Peut comprendre les points essentiels d\'un discours clair' },
    { code: 'B2', name: 'B2 - Intermédiaire avancé', description: 'Peut comprendre le contenu essentiel de sujets concrets' },
    { code: 'C1', name: 'C1', description: 'Peut comprendre une grande gamme de textes longs et exigeants' },
    { code: 'C2', name: 'C2', description: 'Peut comprendre pratiquement tout sans effort' }
];

export function LanguageSelector({ onLanguageSelect, isVisible, onClose }) {
    const [nativeLanguage, setNativeLanguage] = useState('');
    const [targetLanguage, setTargetLanguage] = useState('');
    const [languageLevel, setLanguageLevel] = useState('');
    const [step, setStep] = useState(1); // 1: native, 2: target, 3: level, 4: confirm

    const handleNativeLanguageSelect = (language) => {
        setNativeLanguage(language);
        setStep(2);
    };

    const handleTargetLanguageSelect = (language) => {
        setTargetLanguage(language);
        setStep(3);
    };

    const handleLanguageLevelSelect = (level) => {
        setLanguageLevel(level);
        setStep(4);
    };

    const handleConfirm = () => {
        onLanguageSelect({
            native: nativeLanguage,
            target: targetLanguage,
            level: languageLevel
        });
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
            setNativeLanguage('');
        } else if (step === 3) {
            setStep(2);
            setTargetLanguage('');
        } else if (step === 4) {
            setStep(3);
            setLanguageLevel('');
        }
    };

    if (!isVisible) return null;

    return createPortal(
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
                    <h2>Configuration des Langues</h2>
                    <p>Choisissez votre langue maternelle et la langue que vous souhaitez apprendre</p>
                </div>

                <div className={styles.steps}>
                    <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
                        <span className={styles.stepNumber}>1</span>
                        <span>Langue maternelle</span>
                    </div>
                    <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
                        <span className={styles.stepNumber}>2</span>
                        <span>Langue cible</span>
                    </div>
                    <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
                        <span className={styles.stepNumber}>3</span>
                        <span>Niveau</span>
                    </div>
                    <div className={`${styles.step} ${step >= 4 ? styles.active : ''}`}>
                        <span className={styles.stepNumber}>4</span>
                        <span>Confirmation</span>
                    </div>
                </div>

                <div className={styles.content}>
                    {step === 1 && (
                        <div className={styles.stepContent}>
                            <h3>Quelle est votre langue maternelle ?</h3>
                            <div className={styles.languageGrid}>
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        className={styles.languageButton}
                                        onClick={() => handleNativeLanguageSelect(lang)}
                                    >
                                        <span className={styles.flag}>{lang.flag}</span>
                                        <span className={styles.name}>{lang.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className={styles.stepContent}>
                            <h3>Quelle langue souhaitez-vous apprendre ?</h3>
                            <div className={styles.languageGrid}>
                                {LANGUAGES.filter(lang => lang.code !== nativeLanguage.code).map(lang => (
                                    <button
                                        key={lang.code}
                                        className={styles.languageButton}
                                        onClick={() => handleTargetLanguageSelect(lang)}
                                    >
                                        <span className={styles.flag}>{lang.flag}</span>
                                        <span className={styles.name}>{lang.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className={styles.stepContent}>
                            <h3>Quel est votre niveau en {targetLanguage.name} ?</h3>
                            <div className={styles.languageGrid}>
                                {LANGUAGE_LEVELS.map(level => (
                                    <button
                                        key={level.code}
                                        className={styles.languageButton}
                                        onClick={() => handleLanguageLevelSelect(level)}
                                    >
                                        <span className={styles.name}>{level.name}</span>
                                        <span className={styles.description}>{level.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className={styles.stepContent}>
                            <h3>Confirmation de votre sélection</h3>
                            <div className={styles.confirmation}>
                                <div className={styles.languagePair}>
                                    <div className={styles.languageItem}>
                                        <span className={styles.flag}>{nativeLanguage.flag}</span>
                                        <span className={styles.name}>{nativeLanguage.name}</span>
                                        <span className={styles.label}>Langue maternelle</span>
                                    </div>
                                    <div className={styles.arrow}>→</div>
                                    <div className={styles.languageItem}>
                                        <span className={styles.flag}>{targetLanguage.flag}</span>
                                        <span className={styles.name}>{targetLanguage.name}</span>
                                        <span className={styles.label}>Langue cible</span>
                                    </div>
                                </div>
                                <div className={styles.levelInfo}>
                                    <span className={styles.levelLabel}>Niveau :</span>
                                    <span className={styles.levelValue}>{languageLevel.name}</span>
                                </div>
                                <p className={styles.description}>
                                    L'IA vous parlera en {targetLanguage.name} et vous pourrez répondre en {nativeLanguage.name} ou {targetLanguage.name}.
                                    Les exercices seront adaptés à votre niveau {languageLevel.code}.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Annuler
                    </button>
                    {step > 1 && (
                        <button className={styles.backButton} onClick={handleBack}>
                            ← Retour
                        </button>
                    )}
                    {step === 4 && (
                        <button className={styles.confirmButton} onClick={handleConfirm}>
                            Confirmer et commencer
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
