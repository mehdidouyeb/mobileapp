import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useGemini } from '../hooks/useGemini';

export const TestGeminiConnection = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  
  const { connect, sendTextInput } = useGemini({
    onMessage: (message) => {
      console.log('✅ Test message received:', message);
      setTestResult(`✅ Success! Response: ${message.substring(0, 100)}...`);
      setIsTesting(false);
    },
    onError: (error) => {
      console.error('❌ Test error:', error);
      setTestResult(`❌ Error: ${error.message || 'Unknown error'}`);
      setIsTesting(false);
    }
  });

  const testConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult('Testing connection...');
      
      // First, establish connection
      await connect();
      
      // Then send a test message
      await sendTextInput('Hello, are you working?');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      setTestResult(`❌ Test failed: ${error.message || 'Unknown error'}`);
      setIsTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={testConnection}
        disabled={isTesting}
      >
        <Text style={styles.buttonText}>
          {isTesting ? 'Testing...' : 'Test Gemini Connection'}
        </Text>
      </TouchableOpacity>
      
      {testResult && (
        <Text style={[styles.result, testResult.startsWith('✅') ? styles.success : styles.error]}>
          {testResult}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  result: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  success: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
});
