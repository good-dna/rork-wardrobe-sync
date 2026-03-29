import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const KLOTHO_IMAGE = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/a5fym4li5d1ezbeejkfgq';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, isConfigured } = useAuth();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, {
      first_name: firstName,
      last_name: lastName,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      router.replace('/avatar-setup' as any);
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
                style={styles.continueButton}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={styles.continueButtonText}>Continue to App</Text>
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
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </KeyboardAvoidingView>
  );

  function renderForm() {
    return (
      <>
        <Text style={styles.welcomeText}>Create Account</Text>
        <Text style={styles.welcomeSubtext}>Sign up to get started</Text>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.inputHalf]}>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={firstName}
              onChangeText={setFirstName}
              editable={!loading}
            />
          </View>
          <View style={[styles.inputGroup, styles.inputHalf]}>
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={lastName}
              onChangeText={setLastName}
              editable={!loading}
            />
          </View>
        </View>

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
              placeholder="Password (min 8 characters)"
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

        <View style={styles.inputGroup}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color="rgba(255,255,255,0.6)" />
              ) : (
                <Eye size={20} color="rgba(255,255,255,0.6)" />
              )}
            </Pressable>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signUpButton, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInLink}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.signInLinkText}>
            Already have an account? <Text style={styles.signInLinkTextBold}>Sign In</Text>
          </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
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
    padding: 28,
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
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
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
  signUpButton: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
  },
  signInLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signInLinkText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  signInLinkTextBold: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  continueButton: {
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
  continueButtonText: {
    color: '#2C3E50',
    fontSize: 17,
    fontWeight: '700',
  },
});
