import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo_key'

// Vérifier si les clés sont définies
if (supabaseUrl === 'https://demo.supabase.co' || supabaseKey === 'demo_key') {
    console.warn('⚠️ Les variables d\'environnement Supabase ne sont pas définies. Veuillez créer un fichier .env.local avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tester la connexion
supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.error('Erreur de connexion à Supabase:', error);
    } else {
        console.log('Connexion Supabase établie');
    }
}).catch(err => {
    console.error('Erreur lors de la vérification de la connexion:', err);
});
