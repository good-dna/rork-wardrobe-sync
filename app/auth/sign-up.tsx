import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, ImageBackground, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, firstName, lastName);
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message || 'An error occurred during sign up');
    } else {
      Alert.alert(
        'Account Created!',
        'Welcome to KLOTHO. You can now start managing your wardrobe.',
        [{ text: 'Get Started', onPress: () => router.replace('/(tabs)') }]
      );
    }
  };

  if (!isConfigured) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1A1A1A', '#2C2C2C']}
          style={styles.demoContainer}
        >
          <View style={styles.demoNotice}>
            <Text style={styles.demoTitle}>Demo Mode</Text>
            <Text style={styles.demoText}>
              Supabase is not configured. The app is running in demo mode.
            </Text>
            <TouchableOpacity
              style={styles.demoContinueButton}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.demoContinueButtonText}>Continue to App</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://r2-pub.rork.com/generated-images/641cc962-bae3-40d2-a79b-a85ac2695197.png' }}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
        style={styles.overlay}
      >
        <KeyboardAvoidingView 
          style={styles.content} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.titleContainer}>
              <Text style={styles.appTitle}>KLOTHO</Text>
              <Text style={styles.appSubtitle}>Create Your Account</Text>
            </View>

            <View style={styles.cardContainer}>
              <BlurView intensity={20} style={styles.glassCard} tint="light">
                <View style={styles.cardContent}>
                  <Text style={styles.welcomeText}>Join KLOTHO</Text>
                  <Text style={styles.welcomeSubtext}>Start organizing your wardrobe</Text>
                  
                  <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, styles.inputHalf]}>
                      <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={firstName}
                        onChangeText={setFirstName}
                        editable={!loading}
                      />
                    </View>
                    <View style={[styles.inputContainer, styles.inputHalf]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={lastName}
                        onChangeText={setLastName}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Password (min 8 characters)"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                    />
                    <Pressable 
                      style={styles.eyeIcon} 
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="rgba(255,255,255,0.7)" />
                      ) : (
                        <Eye size={20} color="rgba(255,255,255,0.7)" />
                      )}
                    </Pressable>
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      editable={!loading}
                    />
                    <Pressable 
                      style={styles.eyeIcon} 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="rgba(255,255,255,0.7)" />
                      ) : (
                        <Eye size={20} color="rgba(255,255,255,0.7)" />
                      )}
                    </Pressable>
                  </View>

                  <TouchableOpacity
                    style={[styles.signUpButton, loading && styles.buttonDisabled]}
                    onPress={handleSignUp}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#D4A574', '#B8935E']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.signUpButtonText}>Create Account</Text>
                          <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    style={styles.signInButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.signInText}>
                      Already have an account? <Text style={styles.signInTextBold}>Log In</Text>
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.termsText}>
                    By continuing, you agree to our Terms & Privacy
                  </Text>
                </View>
              </BlurView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400' as const,
    letterSpacing: 1,
  },
  cardContainer: {
    width: '100%',
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardContent: {
    padding: 28,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  inputHalf: {
    flex: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  signUpButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  divider: {
    marginVertical: 20,
    alignItems: 'center',
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  signInButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  signInText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  signInTextBold: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 16,
  },
  demoContainer: {
    flex: 1,
  },
  demoNotice: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  demoTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  demoText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  demoContinueButton: {
    backgroundColor: '#D4A574',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  demoContinueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
