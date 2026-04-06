import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Animated, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { ChevronRight, MapPin, Navigation } from 'lucide-react-native';

const { width: W } = Dimensions.get('window');
const GOLD = '#C8A45D';
const GOLD_DIM = 'rgba(200,164,93,0.25)';
const DARK = 'rgba(14,11,7,0.95)';

const VIBES = ['Minimalist','Streetwear','Bohemian','Professional','Casual','Semi-casual','Vintage','Athleisure'];
const GOALS = ['Discover new combos','Build capsule wardrobe','Reduce shopping','Organize closet','Sustainable fashion'];
const FASHION = ['Bohemian','Professional','Streetwear','Minimalist','Casual','Semi-casual'];

const STEPS = ['Profile','About you','Your style','Avatar','Welcome'];

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Step 1 - Profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Step 2 - About
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [locMode, setLocMode] = useState<'gps'|'manual'|null>(null);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Step 3 - Style
  const [vibes, setVibes] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [fashion, setFashion] = useState('');

  const getAge = () => {
    if (!dobMonth || !dobDay || dobYear.length < 4) return null;
    const dob = new Date(+dobYear, +dobMonth - 1, +dobDay);
    if (isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const md = now.getMonth() - dob.getMonth();
    if (md < 0 || (md === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  };

  const age = getAge();
  const dobComplete = dobMonth && dobDay && dobYear.length === 4;

  const animateStep = (fn: () => void) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(fn, 120);
  };

  const toggleArr = (arr: string[], setArr: Function, val: string) => {
    setArr((prev: string[]) => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const detectGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission denied', 'Allow location access in settings.'); setGpsLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geo[0]) {
        setCity(geo[0].city || geo[0].subregion || '');
        setCountry(geo[0].country || '');
        setLocMode('gps');
      }
    } catch { Alert.alert('Error', 'Could not detect location.'); }
    setGpsLoading(false);
  };

  const saveStep1 = async () => {
    if (!firstName.trim()) return Alert.alert('Required', 'Please enter your first name.');
    animateStep(async () => {
      if (user) {
        await supabase.from('profiles').update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        }).eq('id', user.id);
      }
      setStep(2);
    });
  };

  const saveStep2 = async () => {
    if (dobComplete && age !== null && age < 18) {
      return Alert.alert('Age Restriction', 'You must be 18 or older to use KLOTHO.');
    }
    animateStep(async () => {
      if (user) {
        await supabase.from('profiles').update({
          date_of_birth: dobComplete ? `${dobYear}-${dobMonth.padStart(2,'0')}-${dobDay.padStart(2,'0')}` : null,
          age_verified: age !== null && age >= 18,
          city: city || null,
          country: country || null,
          location: city && country ? `${city}, ${country}` : city || null,
        }).eq('id', user.id);
      }
      setStep(3);
    });
  };

  const saveStep3 = async () => {
    animateStep(async () => {
      if (user) {
        await supabase.from('profiles').update({
          style_vibes: vibes,
          style_goals: goals,
          fashion_sense: fashion,
          style_preferences: vibes,
        }).eq('id', user.id);
      }
      setStep(4);
    });
  };

  const finishOnboarding = async () => {
    if (user) {
      await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id);
    }
    router.replace('/(tabs)' as any);
  };

  const ProgressBar = () => (
    <View style={s.progressWrap}>
      <View style={s.progressRow}>
        {STEPS.map((label, i) => (
          <View key={i} style={[s.progressSeg, i < step - 1 ? s.progDone : i === step - 1 ? s.progActive : s.progInactive]} />
        ))}
      </View>
      <Text style={s.stepLabel}>{STEPS[step - 1]} · {step} of {STEPS.length}</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#000000', '#0d0d0d', '#000000']} style={s.flex}>
      <SafeAreaView style={s.flex}>
        <Animated.View style={[s.flex, { opacity: fadeAnim }]}>

          {/* STEP 1 — Profile */}
          {step === 1 && (
            <ScrollView contentContainerStyle={s.screen}>
              <Text style={s.brand}>KLOTHO</Text>
              <ProgressBar />
              <Text style={s.title}>What's your name?</Text>
              <Text style={s.sub}>Let's personalize your experience.</Text>
              <View style={s.field}>
                <Text style={s.label}>FIRST NAME</Text>
                <TextInput style={s.input} placeholder="First name" placeholderTextColor="rgba(255,255,255,0.3)" value={firstName} onChangeText={setFirstName} />
              </View>
              <View style={s.field}>
                <Text style={s.label}>LAST NAME</Text>
                <TextInput style={s.input} placeholder="Last name" placeholderTextColor="rgba(255,255,255,0.3)" value={lastName} onChangeText={setLastName} />
              </View>
              <TouchableOpacity style={s.btn} onPress={saveStep1}>
                <Text style={s.btnText}>Continue</Text>
                <ChevronRight size={18} color="#000" />
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 2 — About */}
          {step === 2 && (
            <ScrollView contentContainerStyle={s.screen}>
              <Text style={s.brand}>KLOTHO</Text>
              <ProgressBar />
              <Text style={s.title}>About you</Text>
              <Text style={s.sub}>Birthdate for age verification. Location for weather outfits.</Text>

              <Text style={s.sectionHead}>DATE OF BIRTH</Text>
              <View style={s.dobRow}>
                <View style={s.dobSeg}>
                  <Text style={s.label}>MONTH</Text>
                  <TextInput style={s.dobInput} placeholder="MM" placeholderTextColor="rgba(255,255,255,0.25)" maxLength={2} keyboardType="numeric"
                    value={dobMonth} onChangeText={v => setDobMonth(v.replace(/\D/g,''))} />
                </View>
                <View style={s.dobSeg}>
                  <Text style={s.label}>DAY</Text>
                  <TextInput style={s.dobInput} placeholder="DD" placeholderTextColor="rgba(255,255,255,0.25)" maxLength={2} keyboardType="numeric"
                    value={dobDay} onChangeText={v => setDobDay(v.replace(/\D/g,''))} />
                </View>
                <View style={[s.dobSeg, { flex: 1.4 }]}>
                  <Text style={s.label}>YEAR</Text>
                  <TextInput style={s.dobInput} placeholder="YYYY" placeholderTextColor="rgba(255,255,255,0.25)" maxLength={4} keyboardType="numeric"
                    value={dobYear} onChangeText={v => setDobYear(v.replace(/\D/g,''))} />
                </View>
              </View>

              {dobComplete && age !== null && (
                <View style={[s.ageBadge, age >= 18 ? s.badgeOk : s.badgeErr]}>
                  <Text style={[s.ageBadgeText, age >= 18 ? s.badgeTextOk : s.badgeTextErr]}>
                    {age >= 18 ? `Age ${age} — good to go!` : `Age ${age} — must be 18+`}
                  </Text>
                </View>
              )}

              <Text style={[s.sectionHead, { marginTop: 24 }]}>YOUR LOCATION</Text>
              <TouchableOpacity style={[s.locOpt, locMode === 'gps' && s.locOptSel]} onPress={detectGPS} disabled={gpsLoading}>
                <View style={s.locIcon}><Navigation size={18} color={locMode === 'gps' ? '#000' : GOLD} /></View>
                <View style={s.locBody}>
                  <Text style={s.locTitle}>{gpsLoading ? 'Detecting location...' : locMode === 'gps' && city ? `${city}, ${country}` : 'Use my current location'}</Text>
                  <Text style={s.locSub}>Auto-detect via GPS</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[s.locOpt, locMode === 'manual' && s.locOptSel]} onPress={() => setLocMode('manual')}>
                <View style={s.locIcon}><MapPin size={18} color={locMode === 'manual' ? '#000' : GOLD} /></View>
                <View style={s.locBody}>
                  <Text style={s.locTitle}>Enter city manually</Text>
                  <Text style={s.locSub}>Type your city & country</Text>
                </View>
              </TouchableOpacity>

              {locMode === 'manual' && (
                <View style={[s.field, { marginTop: 12 }]}>
                  <View style={s.row}>
                    <View style={[s.field, { flex: 1, marginRight: 8 }]}>
                      <Text style={s.label}>CITY</Text>
                      <TextInput style={s.input} placeholder="City" placeholderTextColor="rgba(255,255,255,0.3)" value={city} onChangeText={setCity} />
                    </View>
                    <View style={[s.field, { flex: 1 }]}>
                      <Text style={s.label}>COUNTRY</Text>
                      <TextInput style={s.input} placeholder="Country" placeholderTextColor="rgba(255,255,255,0.3)" value={country} onChangeText={setCountry} />
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity style={[s.btn, dobComplete && age !== null && age < 18 && s.btnDisabled]}
                onPress={saveStep2} disabled={dobComplete && age !== null && age < 18}>
                <Text style={s.btnText}>Continue</Text>
                <ChevronRight size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => animateStep(() => setStep(3))}>
                <Text style={s.skip}>Skip for now</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 3 — Style */}
          {step === 3 && (
            <ScrollView contentContainerStyle={s.screen}>
              <Text style={s.brand}>KLOTHO</Text>
              <ProgressBar />
              <Text style={s.title}>Your style</Text>
              <Text style={s.sub}>We'll personalize everything around your vibe.</Text>

              <Text style={s.sectionHead}>STYLE VIBE</Text>
              <View style={s.pills}>
                {VIBES.map(v => (
                  <TouchableOpacity key={v} style={[s.pill, vibes.includes(v) && s.pillSel]} onPress={() => toggleArr(vibes, setVibes, v)}>
                    <Text style={[s.pillText, vibes.includes(v) && s.pillTextSel]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.sectionHead}>STYLE GOALS</Text>
              <View style={s.pills}>
                {GOALS.map(g => (
                  <TouchableOpacity key={g} style={[s.pill, goals.includes(g) && s.pillSel]} onPress={() => toggleArr(goals, setGoals, g)}>
                    <Text style={[s.pillText, goals.includes(g) && s.pillTextSel]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.sectionHead}>FASHION SENSE</Text>
              <View style={s.fashionRow}>
                {FASHION.map(f => (
                  <TouchableOpacity key={f} style={[s.fashionChip, fashion === f && s.fashionChipSel]} onPress={() => setFashion(f)}>
                    <Text style={[s.fashionText, fashion === f && s.fashionTextSel]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={s.btn} onPress={saveStep3}>
                <Text style={s.btnText}>Continue</Text>
                <ChevronRight size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => animateStep(() => setStep(4))}>
                <Text style={s.skip}>Skip for now</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 4 — Avatar (redirect to existing avatar-onboarding) */}
          {step === 4 && (
            <ScrollView contentContainerStyle={s.screen}>
              <Text style={s.brand}>KLOTHO</Text>
              <ProgressBar />
              <Text style={s.title}>Build your avatar</Text>
              <Text style={s.sub}>Upload 3–8 photos so KLOTHO can create a lifelike avatar that looks just like you.</Text>

              <View style={s.avatarInfoCard}>
                {[
                  { icon: '☀️', tip: 'Good lighting — natural or bright indoor' },
                  { icon: '🧍', tip: 'Full body — at least one head-to-toe shot' },
                  { icon: '👕', tip: 'Fitted clothing — shows your body shape best' },
                  { icon: '🖼️', tip: 'Plain background — minimal clutter behind you' },
                ].map((item, i) => (
                  <View key={i} style={s.tipRow}>
                    <Text style={s.tipEmoji}>{item.icon}</Text>
                    <Text style={s.tipText}>{item.tip}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={s.btn} onPress={() => router.push('/avatar-onboarding' as any)}>
                <Text style={s.btnText}>Start photo capture</Text>
                <ChevronRight size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={finishOnboarding}>
                <Text style={s.skip}>Skip — set up avatar later</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 5 — Welcome (reached after avatar-onboarding completes) */}
          {step === 5 && (
            <ScrollView contentContainerStyle={[s.screen, { alignItems: 'center' }]}>
              <Text style={s.brand}>KLOTHO</Text>
              <ProgressBar />
              <View style={s.welcomeAvatar}>
                <Text style={s.welcomeInitial}>{firstName?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <Text style={s.title}>Welcome, {firstName || 'Stylist'}! 👋</Text>
              <Text style={s.sub}>Your KLOTHO wardrobe is ready to style.</Text>
              <View style={s.summaryCard}>
                {city ? <><Text style={s.summaryLabel}>Location</Text><Text style={s.summaryVal}>{city}{country ? `, ${country}` : ''}</Text></> : null}
                {vibes.length > 0 && <><Text style={[s.summaryLabel, { marginTop: 12 }]}>Style vibes</Text><View style={s.tagRow}>{vibes.map(v => <View key={v} style={s.tag}><Text style={s.tagText}>{v}</Text></View>)}</View></>}
                {fashion ? <><Text style={[s.summaryLabel, { marginTop: 12 }]}>Fashion sense</Text><Text style={s.summaryVal}>{fashion}</Text></> : null}
              </View>
              <TouchableOpacity style={s.btn} onPress={finishOnboarding}>
                <Text style={s.btnText}>Let's Style Me</Text>
                <ChevronRight size={18} color="#000" />
              </TouchableOpacity>
            </ScrollView>
          )}

        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  screen: { padding: 24, paddingBottom: 48, flexGrow: 1 },
  brand: { fontSize: 13, fontWeight: '900', color: GOLD, letterSpacing: 6, textAlign: 'center', marginBottom: 16 },
  progressWrap: { marginBottom: 28 },
  progressRow: { flexDirection: 'row', gap: 5, justifyContent: 'center', marginBottom: 6 },
  progressSeg: { height: 3, flex: 1, borderRadius: 2 },
  progActive: { backgroundColor: GOLD },
  progDone: { backgroundColor: 'rgba(200,164,93,0.5)' },
  progInactive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  stepLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28, lineHeight: 21 },
  sectionHead: { fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 1.5, marginBottom: 12 },
  field: { marginBottom: 18 },
  row: { flexDirection: 'row' },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, marginBottom: 6 },
  input: { borderBottomWidth: 1.5, borderBottomColor: GOLD_DIM, paddingVertical: 10, fontSize: 16, color: '#fff', backgroundColor: 'transparent' },
  dobRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  dobSeg: { flex: 1 },
  dobInput: { borderBottomWidth: 1.5, borderBottomColor: GOLD_DIM, paddingVertical: 10, fontSize: 22, fontWeight: '600', color: '#fff', textAlign: 'center' },
  ageBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50, alignSelf: 'flex-start', marginBottom: 8 },
  badgeOk: { backgroundColor: 'rgba(46,125,50,0.2)', borderWidth: 1, borderColor: 'rgba(46,125,50,0.4)' },
  badgeErr: { backgroundColor: 'rgba(198,40,40,0.2)', borderWidth: 1, borderColor: 'rgba(198,40,40,0.4)' },
  ageBadgeText: { fontSize: 13, fontWeight: '600' },
  badgeTextOk: { color: '#81c784' },
  badgeTextErr: { color: '#ef9a9a' },
  locOpt: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: GOLD_DIM, backgroundColor: DARK, marginBottom: 10 },
  locOptSel: { borderColor: GOLD, backgroundColor: GOLD },
  locIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(200,164,93,0.1)', alignItems: 'center', justifyContent: 'center' },
  locBody: { flex: 1 },
  locTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  locSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  pill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 50, borderWidth: 1, borderColor: GOLD_DIM, backgroundColor: DARK },
  pillSel: { backgroundColor: GOLD, borderColor: GOLD },
  pillText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  pillTextSel: { color: '#000', fontWeight: '600' },
  fashionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  fashionChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: GOLD_DIM, backgroundColor: DARK },
  fashionChipSel: { backgroundColor: GOLD, borderColor: GOLD },
  fashionText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  fashionTextSel: { color: '#000', fontWeight: '600' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GOLD, borderRadius: 50, paddingVertical: 16, marginTop: 8 },
  btnDisabled: { opacity: 0.3 },
  btnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  skip: { textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 14, paddingVertical: 6 },
  avatarInfoCard: { backgroundColor: DARK, borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: GOLD_DIM, gap: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipEmoji: { fontSize: 20, width: 28 },
  tipText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', flex: 1, lineHeight: 19 },
  welcomeAvatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: DARK, borderWidth: 2, borderColor: GOLD, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  welcomeInitial: { fontSize: 36, fontWeight: '700', color: GOLD },
  summaryCard: { backgroundColor: DARK, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: GOLD_DIM, width: '100%', marginBottom: 24 },
  summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, marginBottom: 4 },
  summaryVal: { fontSize: 14, color: '#fff' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(200,164,93,0.15)', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: GOLD_DIM },
  tagText: { fontSize: 12, color: GOLD },
});