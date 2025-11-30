import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import { LanguageSelection } from '../components/LanguageSelection';
import { useTranslation } from 'react-i18next';

type AuthStep = 'credentials' | 'languages';

export default function AuthScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentStep, setCurrentStep] = useState<AuthStep>('credentials');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('en');

  const { signIn, signUp, resetPassword } = useAuth();
  const { t } = useTranslation();

  const handleNext = () => {
    if (currentStep === 'credentials') {
      if (!email || !password) {
        Alert.alert(t('settings.updateFailed'), t('auth.email') + ' and ' + t('auth.password') + ' are required');
        return;
      }
      if (isSignUp) {
        setCurrentStep('languages');
      } else {
        handleAuth();
      }
    } else if (currentStep === 'languages') {
      handleAuth();
    }
  };

  const handleBack = () => {
    setCurrentStep('credentials');
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, preferredLanguage, targetLanguage);
        if (error) {
          console.error('❌ Sign up error:', error);
          Alert.alert(t('settings.updateFailed'), error.message);
        } else {
          console.log('✅ Account created successfully');
          Alert.alert(
            t('auth.accountCreated'),
            t('auth.accountCreated'),
            [{ 
              text: 'OK', 
              onPress: () => {
                console.log('👤 Returning to login screen');
                setIsSignUp(false);
                setCurrentStep('credentials');
              }
            }]
          );
        }
      } else {
        console.log('🔐 Starting sign in process');
        const { error, originalError } = await signIn(email, password);
        
        if (error) {
          console.error('❌ Login failed:', {
            error: error.message,
            originalError: originalError ? {
              name: originalError.name,
              message: originalError.message,
              status: (originalError as any)?.status
            } : null
          });
          
          // Handle specific database grant error
          if (error.message.includes('database error granting user')) {
            console.error('🔴 Database grant error - Possible causes:', {
              user: email,
              timestamp: new Date().toISOString(),
              possibleIssues: [
                'User profile not properly created in user_profiles table',
                'Row Level Security (RLS) policy issues',
                'Database trigger failure',
                'Database connection issue'
              ]
            });
            
            // More user-friendly message for database grant errors
            return Alert.alert(
              'Login Error',
              'There was an issue accessing your account. Please try again in a moment. If the problem persists, please contact support.'
            );
          }
          
          // Show user-friendly error message for other errors
          Alert.alert(t('auth.loginFailed'), error.message);
        } else {
          console.log('✅ Login successful, navigating to home');
          router.replace('/');
        }
      }
    } catch (error) {
      console.error('🔥 Unexpected error in handleAuth:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert(
        t('settings.updateFailed'),
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(t('settings.updateFailed'), t('auth.email') + ' is required');
      return;
    }

    try {
      const { error } = await resetPassword(email);
      if (error) {
        Alert.alert(t('settings.updateFailed'), error.message);
      } else {
        Alert.alert(t('auth.resetPassword'));
      }
    } catch (error) {
      Alert.alert(t('settings.updateFailed'), 'An unexpected error occurred');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>FluentFlow</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? (
            currentStep === 'credentials' ? t('app.createAccount') : t('app.chooseLanguages')
          ) : t('app.welcomeBack')}
        </Text>

        {currentStep === 'credentials' ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder={t('auth.email')}
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder={t('auth.password')}
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>
                  {isSignUp ? t('auth.next') : t('auth.signIn')}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={styles.linkButton}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setCurrentStep('credentials');
              }}
            >
              <Text style={styles.linkText}>
                {isSignUp
                  ? t('auth.alreadyHaveAccount')
                  : t('auth.dontHaveAccount')}
              </Text>
            </Pressable>

            {!isSignUp && (
              <Pressable
                style={styles.linkButton}
                onPress={handleResetPassword}
              >
                <Text style={styles.linkText}>{t('auth.forgotPassword')}</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <LanguageSelection
              title={t('auth.nativeLanguage')}
              selectedLanguage={preferredLanguage}
              onSelectLanguage={setPreferredLanguage}
            />

            <LanguageSelection
              title={t('auth.targetLanguage')}
              selectedLanguage={targetLanguage}
              onSelectLanguage={setTargetLanguage}
            />

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.secondaryButton]}
                onPress={handleBack}
              >
                <Text style={styles.secondaryButtonText}>{t('settings.cancel')}</Text>
              </Pressable>

              <Pressable
                style={[styles.button, loading && styles.buttonDisabled, { flex: 1, marginLeft: 12 }]}
                onPress={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>{t('auth.createAccount')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#1a1f3a',
    color: 'white',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    padding: 8,
  },
  linkText: {
    color: '#60A5FA',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '600',
  },
});
