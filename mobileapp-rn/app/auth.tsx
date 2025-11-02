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

  const handleNext = () => {
    if (currentStep === 'credentials') {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
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
          Alert.alert('Error', error.message);
        } else {
          Alert.alert(
            'Success',
            'Account created! You can now sign in.',
            [{ text: 'OK', onPress: () => {
              setIsSignUp(false);
              setCurrentStep('credentials');
            }}]
          );
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          Alert.alert('Error', error.message);
        } else {
          // Sign in successful - navigate to main app (Fluent Flo)
          console.log('✅ SIGN IN SUCCESSFUL - NAVIGATING TO FLUENT FLO');
          router.replace('/');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      const { error } = await resetPassword(email);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Password reset email sent!');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Fluent Flo</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? (
            currentStep === 'credentials' ? 'Create Account' : 'Choose Your Languages'
          ) : 'Welcome Back'}
        </Text>

        {currentStep === 'credentials' ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
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
                  {isSignUp ? 'Next' : 'Sign In'}
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
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </Text>
            </Pressable>

            {!isSignUp && (
              <Pressable
                style={styles.linkButton}
                onPress={handleResetPassword}
              >
                <Text style={styles.linkText}>Forgot Password?</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <LanguageSelection
              title="What's your native language?"
              selectedLanguage={preferredLanguage}
              onSelectLanguage={setPreferredLanguage}
            />

            <LanguageSelection
              title="What language do you want to learn?"
              selectedLanguage={targetLanguage}
              onSelectLanguage={setTargetLanguage}
            />

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.secondaryButton]}
                onPress={handleBack}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>

              <Pressable
                style={[styles.button, loading && styles.buttonDisabled, { flex: 1, marginLeft: 12 }]}
                onPress={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
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
