-- Mise à jour de la base de données pour le système de dashboard et d'analyse

-- Ajouter la colonne analysis à la table discussions
ALTER TABLE discussions 
ADD COLUMN IF NOT EXISTS analysis JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Créer la table pour les exercices suggérés
CREATE TABLE IF NOT EXISTS suggested_exercises (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'anonymous',
    exercises JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    completed_at TIMESTAMPTZ
);

-- Activer RLS sur la nouvelle table
ALTER TABLE suggested_exercises ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre l'accès anonyme
CREATE POLICY IF NOT EXISTS "Allow anonymous access to suggested_exercises" 
ON suggested_exercises FOR ALL USING (true);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_suggested_exercises_user_active 
ON suggested_exercises(user_id, is_active, created_at);

-- Créer un index pour les discussions avec analyse
CREATE INDEX IF NOT EXISTS idx_discussions_analysis 
ON discussions USING GIN(analysis);

-- Fonction pour nettoyer les anciens exercices (optionnel)
CREATE OR REPLACE FUNCTION cleanup_old_exercises()
RETURNS void AS $$
BEGIN
    -- Marquer comme inactifs les exercices de plus de 30 jours
    UPDATE suggested_exercises 
    SET is_active = false 
    WHERE created_at < NOW() - INTERVAL '30 days' 
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour la documentation
COMMENT ON TABLE suggested_exercises IS 'Stocke les exercices suggérés par l''IA pour les sessions futures';
COMMENT ON COLUMN suggested_exercises.exercises IS 'JSON contenant la liste des exercices suggérés';
COMMENT ON COLUMN suggested_exercises.is_active IS 'Indique si les exercices sont encore actifs pour la prochaine session';
COMMENT ON COLUMN discussions.analysis IS 'JSON contenant l''analyse complète de la discussion générée par l''IA';
