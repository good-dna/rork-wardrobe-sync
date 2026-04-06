import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ImageBackground, KeyboardAvoidingView,
  Platform, Pressable, ScrollView
} from 'react-native';
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
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, isConfigured } = useAuth();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
    const { error } = await signUp(email, password, { full_name: fullName });
    setLoading(false);
    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      router.replace('/onboarding' as any);
    }
  };

  if (!isConfigured) {
    return (
      <View style={s.container}>
        <ImageBackground source={{ uri: KLOTHO_IMAGE }} style={s.background} resizeMode="cover">
          <LinearGradient colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']} style={s.overlay}>
            <View style={s.demoNotice}>
              <Text style={s.klothoTitle}>KLOTHO</Text>
              <Text style={s.demoTitle}>Demo Mode</Text>
              <Text style={s.demoText}>Authentication is not configured.</Text>
              <TouchableOpacity style={s.submitBtn} onPress={() => router.replace('/(tabs)')}>
                <Text style={s.submitBtnText}>Continue to App</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ImageBackground source={{ uri: KLOTHO_IMAGE }} style={s.background} resizeMode="cover">
        <LinearGradient colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.75)']} style={s.overlay}>
          <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={s.content}>
              <View style={s.logoSection}>
                <Text style={s.klothoTitle}>KLOTHO</Text>
                <Text style={s.tagline}>Your AI-Powered Wardrobe</Text>
              </View>
              <View style={s.cardContainer}>
                {Platform.OS === 'ios' ? (
                  <BlurView intensity={20} tint="dark" style={s.glassCard}>
                    <View style={s.cardContent}>{form()}</View>
                  </BlurView>
                ) : (
                  <View style={s.androidCard}>{form()}</View>
                )}
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </KeyboardAvoidingView>
  );

  function form() {
    return (
      <>
        <Text style={s.title}>Create Account</Text>
        <Text style={s.subtitle}>Sign up to get started</Text>

        <View style={s.inputGroup}>
          <TextInput style={s.input} placeholder="Full Name" placeholderTextColor="rgba(255,255,255,0.5)" value={fullName} onChangeText={setFullName} editable={!loading} />
        </View>

        <View style={s.inputGroup}>
          <TextInput style={s.input} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.5)" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" editable={!loading} />
        </View>

        <View style={s.inputGroup}>
          <View style={s.passwordRow}>
            <TextInput style={s.passwordInput} placeholder="Password (min 8 characters)" placeholderTextColor="rgba(255,255,255,0.5)" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} editable={!loading} />
            <Pressable style={s.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} color="rgba(255,255,255,0.6)" /> : <Eye size={20} color="rgba(255,255,255,0.6)" />}
            </Pressable>
          </View>
        </View>

        <View style={s.inputGroup}>
          <View style={s.passwordRow}>
            <TextInput style={s.passwordInput} placeholder="Confirm Password" placeholderTextColor="rgba(255,255,255,0.5)" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} editable={!loading} />
            <Pressable style={s.eyeBtn} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff size={20} color="rgba(255,255,255,0.6)" /> : <Eye size={20} color="rgba(255,255,255,0.6)" />}
            </Pressable>
          </View>
        </View>

        <TouchableOpacity style={[s.submitBtn, loading && s.submitBtnDisabled]} onPress={handleSignUp} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.submitBtnText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.signInLink} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.signInLinkText}>Already have an account? <Text style={s.signInLinkBold}>Sign In</Text></Text>
        </TouchableOpacity>
      </>
    );
  }
}

const s = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  overlay: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingVertical: 40 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoSection: { alignItems: 'center', marginBottom: 48 },
  klothoTitle: { fontSize: 56, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 8, marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  cardContainer: { width: '100%' },
  glassCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  androidCard: { backgroundColor: 'rgba(30,30,30,0.85)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', padding: 28 },
  cardContent: { padding: 28 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 32, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: '#FFFFFF' },
  eyeBtn: { padding: 16 },
  submitBtn: { marginTop: 12, backgroundColor: '#F5C85B', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#000000', fontSize: 17, fontWeight: '700' },
  signInLink: { marginTop: 20, alignItems: 'center' },
  signInLinkText: { fontSize: 15, color: 'rgba(255,255,255,0.7)' },
  signInLinkBold: { color: '#FFFFFF', fontWeight: '700' },
  demoNotice: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  demoTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  demoText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 40 },
});
