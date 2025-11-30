import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import i18n from '../lib/i18n';

interface SignInResponse {
  error?: Error;
  originalError?: any;
  data?: {
    user: User;
    session: Session;
    weakPassword?: any;
  } | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  preferredLanguage: string;
  targetLanguage: string;
  signUp: (email: string, password: string, preferredLanguage?: string, targetLanguage?: string) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<SignInResponse>;
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
    setLoading(true);

    // Check for existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session check:', session ? 'Found session' : 'No session found');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(error => {
      console.error('🔐 Error getting session:', error);
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

  const signIn = async (email: string, password: string): Promise<SignInResponse> => {
    console.log('🔐 Attempting sign in with:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔐 Sign in response:', { 
        user: data?.user?.email, 
        session: !!data?.session,
        error: error?.message 
      });

      if (error) {
        // Map common error codes to user-friendly messages
        let errorMessage = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Incorrect email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email before signing in. Check your inbox.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else if (error.message.includes('database error granting user')) {
          errorMessage = 'There was an issue accessing your account. Please try again or contact support.';
        }

        console.error('🔴 Sign in error details:', {
          code: error.name,
          message: error.message,
          status: (error as any).status,
          timestamp: new Date().toISOString()
        });

        return { 
          error: new Error(errorMessage),
          originalError: error,
          data: null
        };
      }

      if (!data) {
        return {
          error: new Error('No data returned from authentication'),
          originalError: new Error('No data returned from authentication'),
          data: null
        };
      }

      return { 
        data: {
          user: data.user!,
          session: data.session!,
          weakPassword: (data as any).weakPassword
        },
        error: undefined,
        originalError: undefined
      };

    } catch (error) {
      console.error('🔥 Unexpected sign in error:', error);
      return { 
        error: error instanceof Error 
          ? error 
          : new Error('An unexpected error occurred during sign in'),
        originalError: error,
        data: null
      };
    }
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
