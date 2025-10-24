# Configuration de l'application React Voice Chat

## Problème résolu : Page blanche

Le problème de page blanche était causé par l'absence des variables d'environnement nécessaires pour les clés API.

## Configuration requise

### 1. Créer un fichier `.env.local`

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# Variables d'environnement pour l'application React Voice Chat

# Clé API Gemini (obligatoire)
# Obtenez votre clé sur: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=votre_cle_gemini_ici

# Configuration Supabase (obligatoire)
# Obtenez ces valeurs sur: https://supabase.com/dashboard
VITE_SUPABASE_URL=votre_url_supabase_ici
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase_ici
```

### 2. Obtenir la clé API Gemini

1. Allez sur [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Créez une nouvelle clé API
4. Copiez la clé et remplacez `votre_cle_gemini_ici` dans le fichier `.env.local`

### 3. Configurer Supabase

1. Allez sur [Supabase](https://supabase.com/dashboard)
2. Créez un nouveau projet
3. Dans les paramètres du projet, allez dans "API"
4. Copiez l'URL du projet et la clé publique (anon key)
5. Remplacez les valeurs dans le fichier `.env.local`

### 4. Créer la table dans Supabase

Exécutez le script SQL suivant dans l'éditeur SQL de Supabase :

```sql
-- Créer la table discussions
CREATE TABLE discussions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'anonymous',
    conversation_name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    messages JSONB DEFAULT '[]'::jsonb,
    feedback JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre l'accès anonyme
CREATE POLICY "Allow anonymous access" ON discussions
    FOR ALL USING (true);
```

### 5. Redémarrer l'application

Après avoir configuré les variables d'environnement :

```bash
npm run dev
```

## Fonctionnalités de l'application

- **Chat vocal en temps réel** avec l'IA Gemini
- **Transcription automatique** des conversations
- **Sauvegarde des discussions** dans Supabase
- **Système de feedback** pour évaluer les conversations
- **Interface responsive** et moderne

## Dépannage

Si vous rencontrez encore des problèmes :

1. Vérifiez que le fichier `.env.local` est bien créé à la racine du projet
2. Vérifiez que les clés API sont correctes
3. Ouvrez la console du navigateur (F12) pour voir les erreurs
4. Redémarrez le serveur de développement après avoir modifié les variables d'environnement
