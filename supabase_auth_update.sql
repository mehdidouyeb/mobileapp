-- Vérifier si la colonne user_id existe et corriger son type si nécessaire
DO $$ 
BEGIN
    -- Vérifier si la colonne user_id existe déjà
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'discussions' 
        AND column_name = 'user_id'
    ) THEN
        -- Si elle existe avec le mauvais type (text), la recréer
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'discussions' 
            AND column_name = 'user_id'
            AND data_type = 'text'
        ) THEN
            -- Supprimer l'ancienne colonne text
            ALTER TABLE discussions DROP COLUMN user_id;
            -- Créer la nouvelle colonne UUID
            ALTER TABLE discussions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
    ELSE
        -- Si elle n'existe pas du tout, la créer
        ALTER TABLE discussions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Création de la table user_settings pour stocker les paramètres de l'utilisateur
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    language_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table suggested_exercises pour stocker les exercices personnalisés
CREATE TABLE IF NOT EXISTS suggested_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    exercises JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_suggested_exercises_user_id ON suggested_exercises(user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Politique RLS pour user_settings (les utilisateurs ne peuvent accéder qu'à leurs propres paramètres)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
CREATE POLICY "Users can insert their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
CREATE POLICY "Users can update their own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Activer RLS pour discussions
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour discussions (les utilisateurs ne peuvent accéder qu'à leurs propres discussions)
DROP POLICY IF EXISTS "Users can view their own discussions" ON discussions;
CREATE POLICY "Users can view their own discussions"
    ON discussions FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own discussions" ON discussions;
CREATE POLICY "Users can insert their own discussions"
    ON discussions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own discussions" ON discussions;
CREATE POLICY "Users can update their own discussions"
    ON discussions FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own discussions" ON discussions;
CREATE POLICY "Users can delete their own discussions"
    ON discussions FOR DELETE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Activer RLS pour suggested_exercises
ALTER TABLE suggested_exercises ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour suggested_exercises
DROP POLICY IF EXISTS "Users can view their own exercises" ON suggested_exercises;
CREATE POLICY "Users can view their own exercises"
    ON suggested_exercises FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own exercises" ON suggested_exercises;
CREATE POLICY "Users can insert their own exercises"
    ON suggested_exercises FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own exercises" ON suggested_exercises;
CREATE POLICY "Users can update their own exercises"
    ON suggested_exercises FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own exercises" ON suggested_exercises;
CREATE POLICY "Users can delete their own exercises"
    ON suggested_exercises FOR DELETE
    USING (auth.uid() = user_id);
