import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const KLOTHO_IMAGE = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/a5fym4li5d1ezbeejkfgq';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, isConfigured } = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Sign In Failed', error.message);
    }
  };

  if (!isConfigured) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={{ uri: KLOTHO_IMAGE }}
          style={styles.background}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
            style={styles.overlay}
          >
            <View style={styles.demoNotice}>
              <Text style={styles.klothoTitle}>KLOTHO</Text>
              <Text style={styles.demoTitle}>Demo Mode</Text>
              <Text style={styles.demoText}>
                Authentication is not configured. Continue to explore the app with demo data.
              </Text>
              <TouchableOpacity
                style={styles.demoContinueButton}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={styles.demoContinueButtonText}>Explore App</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground
        source={{ uri: KLOTHO_IMAGE }}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.75)']}
          style={styles.overlay}
        >
          <View style={styles.content}>
            <View style={styles.logoSection}>
              <Text style={styles.klothoTitle}>KLOTHO</Text>
              <Text style={styles.tagline}>Your AI-Powered Wardrobe</Text>
            </View>

            <View style={styles.cardContainer}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={20} tint="dark" style={styles.glassCard}>
                  <View style={styles.cardContent}>
                    {renderForm()}
                  </View>
                </BlurView>
              ) : (
                <View style={styles.androidCard}>
                  {renderForm()}
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </KeyboardAvoidingView>
  );

  function renderForm() {
    return (
      <>
        <Text style={styles.welcomeText}>Welcome Back</Text>
        <Text style={styles.welcomeSubtext}>Sign in to continue</Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="rgba(255,255,255,0.6)" />
              ) : (
                <Eye size={20} color="rgba(255,255,255,0.6)" />
              )}
            </Pressable>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signInButton, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.signInButtonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signUpLink}
          onPress={() => router.push('/auth/sign-up' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.signUpLinkText}>Create account</Text>
        </TouchableOpacity>
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  klothoTitle: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 8,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1,
  },
  cardContainer: {
    width: '100%',
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  androidCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardContent: {
    padding: 28,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeButton: {
    padding: 16,
  },
  signInButton: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
  },
  signUpLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signUpLinkText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textDecorationLine: 'underline',
  },
  demoNotice: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  demoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  demoText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    maxWidth: 320,
  },
  demoContinueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  demoContinueButtonText: {
    color: '#2C3E50',
    fontSize: 17,
    fontWeight: '700',
  },
});
