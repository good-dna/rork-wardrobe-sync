import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function DebugSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    setTestResults([]);
    setErrorMessage('');
    
    addLog('Starting Supabase connection test...');
    
    try {
      // Test 1: Basic connection
      addLog('Testing basic connection...');
      const { data, error } = await supabase
        .from('_test')
        .select('*')
        .limit(5);

      if (error) {
        addLog(`Connection test failed: ${error.message}`);
        setErrorMessage(error.message);
        setConnectionStatus('error');
        return;
      }

      addLog('Basic connection successful!');
      addLog(`Data received: ${JSON.stringify(data)}`);

      // Test 2: Check auth status
      addLog('Checking auth status...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addLog(`Auth check failed: ${authError.message}`);
      } else {
        addLog(`Auth status: ${user ? 'Authenticated' : 'Anonymous'}`);
        if (user) {
          addLog(`User ID: ${user.id}`);
        }
      }

      // Test 3: Test table access
      addLog('Testing table access...');
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(10);

      if (tableError) {
        addLog(`Table access test failed: ${tableError.message}`);
      } else {
        addLog(`Available tables: ${tables?.map(t => t.table_name).join(', ') || 'None'}`);
      }

      setConnectionStatus('success');
      addLog('All tests completed successfully!');

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Unexpected error: ${message}`);
      setErrorMessage(message);
      setConnectionStatus('error');
    }
  };

  const clearLogs = () => {
    setTestResults([]);
    setErrorMessage('');
    setConnectionStatus('idle');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Supabase Debug',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff'
        }} 
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Supabase Connection Test</Text>
        <Text style={styles.subtitle}>Test your Supabase configuration</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={testConnection}
          disabled={connectionStatus === 'testing'}
        >
          <Text style={styles.buttonText}>
            {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        <View style={[
          styles.statusIndicator,
          connectionStatus === 'success' && styles.statusSuccess,
          connectionStatus === 'error' && styles.statusError,
          connectionStatus === 'testing' && styles.statusTesting
        ]}>
          <Text style={styles.statusText}>
            {connectionStatus === 'idle' && 'Ready to test'}
            {connectionStatus === 'testing' && 'Testing...'}
            {connectionStatus === 'success' && 'Connection successful!'}
            {connectionStatus === 'error' && 'Connection failed'}
          </Text>
        </View>
      </View>

      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Details:</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.logContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.logTitle}>Test Logs:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.logText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B3B3B3',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#C8A45D',
  },
  clearButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusIndicator: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  statusSuccess: {
    backgroundColor: '#22C55E',
  },
  statusError: {
    backgroundColor: '#EF4444',
  },
  statusTesting: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#1F1F1F',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    padding: 16,
  },
  logTitle: {
    color: '#C8A45D',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  logText: {
    color: '#B3B3B3',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
});