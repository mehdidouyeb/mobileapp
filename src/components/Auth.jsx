import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import styles from './Auth.module.css';

export function Auth({ onAuthSuccess, onSkip }) {
    const [isLogin, setIsLogin] = useState(true); // true = login, false = signup
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let result;
            if (isLogin) {
                // Connexion
                result = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (result.error) throw result.error;

                // Sauvegarder la session si "Se souvenir de moi" est coché
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                }
            } else {
                // Inscription
                result = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (result.error) throw result.error;

                // Si inscription réussie, l'utilisateur doit vérifier son email
                if (result.data.user && !result.data.session) {
                    setError('Vérifiez votre email pour confirmer votre inscription.');
                    setLoading(false);
                    return;
                }
            }

            // Appeler le callback avec les données de l'utilisateur
            if (result.data?.user) {
                onAuthSuccess(result.data.user);
            }
        } catch (error) {
            console.error('Erreur d\'authentification:', error);
            setError(error.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError('Veuillez entrer votre email pour réinitialiser votre mot de passe');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setError('Un email de réinitialisation a été envoyé à votre adresse.');
        } catch (error) {
            console.error('Erreur de réinitialisation:', error);
            setError(error.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authBox}>
                <div className={styles.header}>
                    <h1>🌟 AI Coach</h1>
                    <p className={styles.subtitle}>
                        {isLogin ? 'Connectez-vous pour continuer' : 'Créez votre compte'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre@email.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Mot de passe</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            minLength={6}
                        />
                    </div>

                    {isLogin && (
                        <div className={styles.options}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Se souvenir de moi</span>
                            </label>
                            <button
                                type="button"
                                className={styles.forgotPassword}
                                onClick={handlePasswordReset}
                                disabled={loading}
                            >
                                Mot de passe oublié ?
                            </button>
                        </div>
                    )}

                    {error && <div className={styles.error}>{error}</div>}

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'S\'inscrire'}
                    </button>
                </form>

                <div className={styles.switch}>
                    <p>
                        {isLogin ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
                        <button
                            type="button"
                            className={styles.switchButton}
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            disabled={loading}
                        >
                            {isLogin ? 'S\'inscrire' : 'Se connecter'}
                        </button>
                    </p>
                </div>

                {onSkip && (
                    <div className={styles.skipSection}>
                        <button
                            type="button"
                            className={styles.skipButton}
                            onClick={onSkip}
                            disabled={loading}
                        >
                            Continuer sans compte
                        </button>
                        <p className={styles.skipNote}>
                            Vous pourrez créer un compte plus tard pour sauvegarder vos progrès
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
