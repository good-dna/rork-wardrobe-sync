import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Wifi, WifiOff, RefreshCw } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import Typography from '@/components/ui/Typography';
import Card from '@/components/ui/Card';
import { testSupabaseConnection } from '@/lib/supabase';

export default function DebugSupabasePage() {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    error?: string;
    timestamp?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [envVars, setEnvVars] = useState<{
    url: string | undefined;
    key: string | undefined;
  }>({ url: undefined, key: undefined });

  useEffect(() => {
    // Check environment variables
    setEnvVars({
      url: process.env.EXPO_PUBLIC_SUPABASE_URL,
      key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    });
    
    // Test connection on load
    testConnection();
  }, []);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testSupabaseConnection();
      setConnectionStatus({
        connected: result.success,
        error: result.error,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      setConnectionStatus({
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Supabase Debug',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          
          {/* Environment Variables */}
          <Card style={styles.card}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Environment Variables
            </Typography>
            
            <View style={styles.envRow}>
              <Typography variant="body" color={colors.textSecondary}>
                SUPABASE_URL:
              </Typography>
              <Typography variant="caption" color={envVars.url && envVars.url !== 'https://your-project-id.supabase.co' ? colors.success : colors.error}>
                {envVars.url ? (envVars.url.length > 40 ? envVars.url.substring(0, 40) + '...' : envVars.url) : 'Not set'}
              </Typography>
            </View>
            
            <View style={styles.envRow}>
              <Typography variant="body" color={colors.textSecondary}>
                SUPABASE_ANON_KEY:
              </Typography>
              <Typography variant="caption" color={envVars.key && envVars.key !== 'your-anon-key-here' ? colors.success : colors.error}>
                {envVars.key ? (envVars.key.length > 20 ? envVars.key.substring(0, 20) + '...' : envVars.key) : 'Not set'}
              </Typography>
            </View>
          </Card>

          {/* Connection Status */}
          <Card style={styles.card}>
            <View style={styles.statusHeader}>
              <Typography variant="h3" style={styles.sectionTitle}>
                Connection Status
              </Typography>
              <Pressable 
                onPress={testConnection} 
                disabled={isLoading}
                style={[styles.refreshButton, isLoading && styles.refreshButtonDisabled]}
              >
                <RefreshCw 
                  size={20} 
                  color={isLoading ? colors.textTertiary : colors.primary} 
                  style={isLoading ? styles.spinning : undefined}
                />
              </Pressable>
            </View>
            
            {connectionStatus && (
              <View style={styles.statusContent}>
                <View style={styles.statusRow}>
                  {connectionStatus.connected ? (
                    <Wifi size={24} color={colors.success} />
                  ) : (
                    <WifiOff size={24} color={colors.error} />
                  )}
                  <View style={styles.statusText}>
                    <Typography 
                      variant="body" 
                      color={connectionStatus.connected ? colors.success : colors.error}
                      style={styles.statusTitle}
                    >
                      {connectionStatus.connected ? 'Connected' : 'Disconnected'}
                    </Typography>
                    {connectionStatus.timestamp && (
                      <Typography variant="caption" color={colors.textSecondary}>
                        Last checked: {connectionStatus.timestamp}
                      </Typography>
                    )}
                  </View>
                </View>
                
                {connectionStatus.error && (
                  <View style={styles.errorContainer}>
                    <Typography variant="caption" color={colors.error}>
                      Error: {connectionStatus.error}
                    </Typography>
                  </View>
                )}
              </View>
            )}
          </Card>

          {/* Instructions */}
          <Card style={styles.card}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Setup Instructions
            </Typography>
            
            <Typography variant="body" color={colors.textSecondary} style={styles.instruction}>
              1. Create a Supabase project at supabase.com
            </Typography>
            
            <Typography variant="body" color={colors.textSecondary} style={styles.instruction}>
              2. Go to Settings → API in your Supabase dashboard
            </Typography>
            
            <Typography variant="body" color={colors.textSecondary} style={styles.instruction}>
              3. Copy your Project URL and anon/public key
            </Typography>
            
            <Typography variant="body" color={colors.textSecondary} style={styles.instruction}>
              4. Update the .env file with your credentials:
            </Typography>
            
            <View style={styles.codeBlock}>
              <Typography variant="caption" color={colors.primary}>
                EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co{"\n"}
                EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
              </Typography>
            </View>
            
            <Typography variant="body" color={colors.textSecondary} style={styles.instruction}>
              5. Restart your development server
            </Typography>
          </Card>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
  },
  backButton: {
    padding: tokens.spacing.sm,
    marginLeft: -tokens.spacing.sm,
  },
  card: {
    marginBottom: tokens.spacing.lg,
    padding: tokens.spacing.lg,
  },
  sectionTitle: {
    marginBottom: tokens.spacing.md,
  },
  envRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
    flexWrap: 'wrap',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  refreshButton: {
    padding: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.primaryLight,
  },
  refreshButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  spinning: {
    // Add rotation animation if needed
  },
  statusContent: {
    gap: tokens.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontWeight: '600',
    marginBottom: tokens.spacing.xs,
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  instruction: {
    marginBottom: tokens.spacing.sm,
    lineHeight: 22,
  },
  codeBlock: {
    backgroundColor: colors.lightGray,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    marginVertical: tokens.spacing.sm,
  },
});