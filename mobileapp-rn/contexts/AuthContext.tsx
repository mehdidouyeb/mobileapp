import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import i18n from '../lib/i18n';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  preferredLanguage: string;
  targetLanguage: string;
  signUp: (email: string, password: string, preferredLanguage?: string, targetLanguage?: string) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<{ error?: any }>;
  updateLanguages: (preferred: string, target: string) => Promise<{ error?: any }>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferredLanguage, setPreferredLanguage] = useState<string>('en');
  const [targetLanguage, setTargetLanguage] = useState<string>('en');

  console.log('🔐 AUTH PROVIDER RENDER - user:', user, 'loading:', loading);

  // Change app language when preferred language changes
  useEffect(() => {
    if (preferredLanguage) {
      i18n.changeLanguage(preferredLanguage);
      console.log('🌍 Changed app language to:', preferredLanguage);
    }
  }, [preferredLanguage]);

  useEffect(() => {
    console.log('🔐 AUTH PROVIDER useEffect STARTING');

    // Force sign out on app start to always go to login
    console.log('🔐 FORCING SIGN OUT ON APP START');
    supabase.auth.signOut().then(() => {
      console.log('🔐 SIGN OUT COMPLETE - SETTING STATE');
      setUser(null);
      setSession(null);
      setLoading(false);
    }).catch((error) => {
      console.log('🔐 SIGN OUT ERROR:', error);
      setUser(null);
      setSession(null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AUTH STATE CHANGE:', event, session?.user?.email || 'null');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Create/update user profile when user signs up or signs in
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          try {
            // First try to get existing profile
            const { data: existingProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (existingProfile) {
              // Load existing language preferences
              setPreferredLanguage(existingProfile.preferred_language || 'en');
              setTargetLanguage(existingProfile.target_language || 'en');
            } else {
              // Create new profile with default languages
              const { error } = await supabase
                .from('user_profiles')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  preferred_language: 'en',
                  target_language: 'en',
                  updated_at: new Date().toISOString(),
                });
              if (error) console.error('Error creating profile:', error);
              setPreferredLanguage('en');
              setTargetLanguage('en');
            }
          } catch (error) {
            console.error('Error managing profile:', error);
            setPreferredLanguage('en');
            setTargetLanguage('en');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, preferredLanguage = 'en', targetLanguage = 'en') => {
    setPreferredLanguage(preferredLanguage);
    setTargetLanguage(targetLanguage);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const updateLanguages = async (preferred: string, target: string) => {
    console.log('🌍 updateLanguages called:', { preferred, target, userId: user?.id });

    if (!user) {
      console.log('❌ No user logged in');
      return { error: 'No user logged in' };
    }

    try {
      // First check if user profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      console.log('👤 Existing profile check:', { existingProfile, checkError });

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.log('❌ Profile check error:', checkError);
        return { error: checkError.message };
      }

      let result;
      if (existingProfile) {
        // Update existing profile
        console.log('📝 Updating existing profile');
        result = await supabase
          .from('user_profiles')
          .update({
            preferred_language: preferred,
            target_language: target,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } else {
        // Create new profile
        console.log('🆕 Creating new profile');
        result = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email,
            preferred_language: preferred,
            target_language: target,
          });
      }

      console.log('💾 Database result:', result);

      if (!result.error) {
        setPreferredLanguage(preferred);
        setTargetLanguage(target);
        console.log('✅ Languages updated in state');
      } else {
        console.log('❌ Database error:', result.error);
      }

      return { error: result.error };
    } catch (error) {
      console.log('💥 Unexpected error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    preferredLanguage,
    targetLanguage,
    signUp,
    signIn,
    signOut,
    updateLanguages,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
