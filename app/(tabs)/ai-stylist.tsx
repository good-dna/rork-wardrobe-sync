import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, Pressable, ScrollView,
  Image, ActivityIndicator, Alert, Modal, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wand2, Camera, Upload, X, RefreshCw, ChevronRight, Sparkles, User, Zap, Settings } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, tokens } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import AvatarOnboarding, { AvatarSettings } from '@/components/AvatarOnboarding';

const AVATAR_SETTINGS_KEY = 'klotho_avatar_settings_v2';
const GOLD = '#C8A45D';
const BOX_BG = 'rgba(20,16,10,0.88)';
const BOX_BORDER = 'rgba(200,164,93,0.35)';

const OCCASIONS = [
  { id: 'casual', label: 'Casual', icon: '👕' },
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'formal', label: 'Formal', icon: '🎩' },
  { id: 'evening', label: 'Evening', icon: '🌙' },
  { id: 'athletic', label: 'Athletic', icon: '🏃' },
  { id: 'weather', label: 'Weather', icon: '🌤️' },
];

interface StyleResult {
  bodyAnalysis: string;
  outfitDescription: string;
  stylingTips: string[];
  colorRecommendations: string;
  occasion: string;
}

const getBase64 = async (uri: string): Promise<string> => {
  if (typeof document !== 'undefined') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  return await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
};

export default function AIStylistScreen() {
  const { user } = useAuth();
  const { items, outfits } = useWardrobeStore();
  const [avatarSettings, setAvatarSettings] = useState<AvatarSettings | null>(null);
  const [checkingAvatar, setCheckingAvatar] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState('casual');
  const [loading, setLoading] = useState(false);
  const [styleResult, setStyleResult] = useState<StyleResult | null>(null);
  const [step, setStep] = useState<'photo' | 'occasion' | 'result'>('photo');
  const [showOutfitPicker, setShowOutfitPicker] = useState(false);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'avatar' | 'stylist'>('avatar');

  useEffect(() => { loadSavedAvatar(); }, []);

  const loadSavedAvatar = async () => {
    try {
      if (user) {
        const { data } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
        if (data?.avatar_url) {
          const saved = await AsyncStorage.getItem(AVATAR_SETTINGS_KEY);
          const settings: AvatarSettings = saved ? JSON.parse(saved) : {
            photos: [], bodyType: '', preferredFit: 'regular',
            skinToneRetention: 75, hairRetention: 75, realism: 75,
            selectedAvatarUri: data.avatar_url, avatarUrl: data.avatar_url
          };
          settings.avatarUrl = data.avatar_url;
          setAvatarSettings(settings);
          setActiveTab('stylist');
          setCheckingAvatar(false);
          return;
        }
      }
      const saved = await AsyncStorage.getItem(AVATAR_SETTINGS_KEY);
      if (saved) { setAvatarSettings(JSON.parse(saved)); setActiveTab('stylist'); }
    } catch (err) { console.warn('Failed to load avatar:', err); }
    finally { setCheckingAvatar(false); }
  };

  const handleOnboardingComplete = async (settings: AvatarSettings) => {
    await AsyncStorage.setItem(AVATAR_SETTINGS_KEY, JSON.stringify(settings));
    setAvatarSettings(settings);
    setShowOnboarding(false);
    setActiveTab('stylist');
  };

  const resetAvatar = () => {
    Alert.alert('Reset Avatar', 'Start the avatar setup again?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem(AVATAR_SETTINGS_KEY);
        setAvatarSettings(null);
        setActiveTab('avatar');
      }},
    ]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.1 });
    if (!result.canceled) { setUserPhoto(result.assets[0].uri); setStep('occasion'); setStyleResult(null); }
  };

  const uploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.1 });
    if (!result.canceled) { setUserPhoto(result.assets[0].uri); setStep('occasion'); setStyleResult(null); }
  };

  const generateStyle = async () => {
    if (!userPhoto) { Alert.alert('Photo required'); return; }
    setLoading(true); setStep('result');
    try {
      const base64 = await getBase64(userPhoto);
      const selectedOutfit = selectedOutfitId ? outfits.find(o => o.id === selectedOutfitId) : null;
      const outfitItems = selectedOutfit ? items.filter(i => selectedOutfit.items.includes(i.id)) : items.slice(0, 5);
      const outfitDescription = outfitItems.length > 0 ? outfitItems.map(i => `${i.name} (${i.brand}, ${i.color})`).join(', ') : 'casual everyday clothes';
      const { data: aiData, error: aiError } = await supabase.functions.invoke('claude-stylist', {
        body: { imageBase64: base64, occasion: selectedOccasion, outfitDescription },
      });
      if (aiError) throw new Error(aiError.message);
      setStyleResult(aiData);
    } catch {
      Alert.alert('Error', 'Failed to generate style advice.');
      setStep('occasion');
    } finally { setLoading(false); }
  };

  if (checkingAvatar) {
    return (
      <ImageBackground source={require('../../assets/images/closet-backdrop.png')} style={{ flex: 1 }} resizeMode="cover">
        <SafeAreaView style={s.container} edges={['top']}>
          <View style={s.center}><ActivityIndicator size="large" color={GOLD} /></View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const avatarUrl = avatarSettings?.avatarUrl || avatarSettings?.selectedAvatarUri;

  return (
    <ImageBackground source={require('../../assets/images/closet-backdrop.png')} style={{ flex: 1 }} imageStyle={{ width: '100%', height: '100%' }} resizeMode="cover">
      <SafeAreaView style={s.container} edges={['top']}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          <View style={s.header}>
            <Wand2 size={22} color={GOLD} />
            <Text style={s.title}>AI Stylist</Text>
            {avatarSettings && <Pressable onPress={resetAvatar} style={s.headerBtn}><RefreshCw size={16} color={colors.textSecondary} /></Pressable>}
          </View>

          {avatarSettings && (
            <View style={s.tabRow}>
              <Pressable style={[s.tabBtn, activeTab === 'avatar' && s.tabBtnActive]} onPress={() => setActiveTab('avatar')}>
                <User size={15} color={activeTab === 'avatar' ? '#000' : colors.textSecondary} />
                <Text style={[s.tabBtnText, activeTab === 'avatar' && s.tabBtnTextActive]}>My Avatar</Text>
              </Pressable>
              <Pressable style={[s.tabBtn, activeTab === 'stylist' && s.tabBtnActive]} onPress={() => setActiveTab('stylist')}>
                <Sparkles size={15} color={activeTab === 'stylist' ? '#000' : colors.textSecondary} />
                <Text style={[s.tabBtnText, activeTab === 'stylist' && s.tabBtnTextActive]}>AI Styling</Text>
              </Pressable>
            </View>
          )}

          {(!avatarSettings || activeTab === 'avatar') && (
            !avatarSettings ? (
              <View style={s.onboardingCta}>
                <View style={s.onboardingIcon}><User size={48} color={GOLD} /></View>
                <Text style={s.onboardingTitle}>Build Your Avatar</Text>
                <Text style={s.onboardingSub}>Upload 1–8 photos, choose your body type and style preferences. Our AI will generate a personalized avatar that looks like you.</Text>
                <View style={s.featureList}>
                  {['Personalized to your body type', 'Preserves your skin tone & hair', 'Try outfits before you wear them', 'Regenerate anytime'].map(f => (
                    <View key={f} style={s.featureRow}><View style={s.featureDot} /><Text style={s.featureText}>{f}</Text></View>
                  ))}
                </View>
                <Pressable style={s.startBtn} onPress={() => setShowOnboarding(true)}>
                  <Zap size={18} color="#000" />
                  <Text style={s.startBtnText}>Create My Avatar</Text>
                </Pressable>
              </View>
            ) : (
              <View style={s.avatarDisplay}>
                <View style={s.avatarFrame}>
                  <Text style={s.avatarBrand}>KLOTHO</Text>
                  {avatarUrl
                    ? <Image source={{ uri: avatarUrl }} style={s.avatarImg} resizeMode="cover" />
                    : <View style={s.avatarPlaceholder}><User size={60} color={colors.textSecondary} /></View>
                  }
                </View>
                {avatarSettings.bodyType ? (
                  <View style={s.settingsSummary}>
                    <Text style={s.settingsSummaryTitle}>Avatar Settings</Text>
                    <View style={s.settingsChips}>
                      {[avatarSettings.bodyType, avatarSettings.preferredFit, `${avatarSettings.skinToneRetention}% skin`, `${avatarSettings.realism}% realism`].map(chip => (
                        <View key={chip} style={s.settingsChip}><Text style={s.settingsChipText}>{chip}</Text></View>
                      ))}
                    </View>
                  </View>
                ) : null}
                <Pressable style={s.editAvatarBtn} onPress={() => setShowOnboarding(true)}>
                  <Settings size={16} color={GOLD} />
                  <Text style={s.editAvatarText}>Edit Avatar Settings</Text>
                </Pressable>
              </View>
            )
          )}

          {avatarSettings && activeTab === 'stylist' && (
            <View>
              <Text style={s.occasionLabel}>SELECT OCCASION</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.occasionRow} style={{ marginBottom: 20 }}>
                {OCCASIONS.map(occ => (
                  <Pressable key={occ.id} style={[s.occasionCard, selectedOccasion === occ.id && s.occasionCardActive]} onPress={() => setSelectedOccasion(occ.id)}>
                    <Text style={s.occasionIcon}>{occ.icon}</Text>
                    <Text style={[s.occasionText, selectedOccasion === occ.id && s.occasionTextActive]}>{occ.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {step === 'photo' && (
                <View style={s.uploadSection}>
                  <Text style={s.uploadTitle}>Upload Your Photo</Text>
                  <Text style={s.uploadSub}>Claude will analyze your current outfit for the selected occasion.</Text>
                  <View style={s.uploadBtns}>
                    <Pressable style={s.uploadBtn} onPress={takePhoto}><Camera size={24} color={GOLD} /><Text style={s.uploadBtnText}>Camera</Text></Pressable>
                    <Pressable style={s.uploadBtn} onPress={uploadPhoto}><Upload size={24} color={GOLD} /><Text style={s.uploadBtnText}>Upload</Text></Pressable>
                  </View>
                </View>
              )}

              {(step === 'occasion' || step === 'result') && userPhoto && (
                <View>
                  <Image source={{ uri: userPhoto }} style={s.photoPreview} resizeMode="cover" />
                  {step === 'occasion' && (
                    <>
                      <Pressable style={s.outfitPickerBtn} onPress={() => setShowOutfitPicker(true)}>
                        <Text style={s.outfitPickerText}>{selectedOutfitId ? outfits.find(o => o.id === selectedOutfitId)?.name || 'Selected' : 'Choose outfit (optional)'}</Text>
                        <ChevronRight size={18} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable style={s.generateBtn} onPress={generateStyle}>
                        <Wand2 size={20} color="#000" />
                        <Text style={s.generateBtnText}>Generate My Style</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )}

              {loading && (
                <View style={s.loadingCard}>
                  <ActivityIndicator size="large" color={GOLD} />
                  <Text style={s.loadingTitle}>Claude is styling you...</Text>
                </View>
              )}

              {styleResult && !loading && (
                <View style={s.results}>
                  {avatarUrl && (
                    <View style={s.resultAvatarFrame}>
                      <Text style={s.resultAvatarBrand}>KLOTHO</Text>
                      <Image source={{ uri: avatarUrl }} style={s.resultAvatarImg} resizeMode="cover" />
                    </View>
                  )}
                  {[
                    { title: 'Your Style Profile', text: styleResult.bodyAnalysis },
                    { title: `Your ${styleResult.occasion} Look`, text: styleResult.outfitDescription },
                    { title: 'Color Recommendations', text: styleResult.colorRecommendations },
                  ].map(({ title, text }) => (
                    <View key={title} style={s.resultCard}>
                      <Text style={s.resultCardTitle}>{title}</Text>
                      <Text style={s.resultCardText}>{text}</Text>
                    </View>
                  ))}
                  <View style={s.resultCard}>
                    <Text style={s.resultCardTitle}>Styling Tips</Text>
                    {styleResult.stylingTips.map((tip, i) => (
                      <View key={i} style={s.tipRow}><View style={s.tipDot} /><Text style={s.tipText}>{tip}</Text></View>
                    ))}
                  </View>
                  <Pressable style={s.tryAnotherBtn} onPress={() => setStep('photo')}>
                    <Text style={s.tryAnotherText}>Try Another Look</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <AvatarOnboarding visible={showOnboarding} onClose={() => setShowOnboarding(false)} onComplete={handleOnboardingComplete} existingSettings={avatarSettings} />

      <Modal visible={showOutfitPicker} transparent animationType="slide" onRequestClose={() => setShowOutfitPicker(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Choose an Outfit</Text>
            <Pressable style={s.modalClose} onPress={() => setShowOutfitPicker(false)}><X size={20} color={colors.text} /></Pressable>
            <ScrollView>
              <Pressable style={s.outfitOption} onPress={() => { setSelectedOutfitId(null); setShowOutfitPicker(false); }}>
                <Text style={s.outfitOptionText}>Use my full wardrobe</Text>
              </Pressable>
              {outfits.map(outfit => (
                <Pressable key={outfit.id} style={[s.outfitOption, selectedOutfitId === outfit.id && s.outfitOptionActive]} onPress={() => { setSelectedOutfitId(outfit.id); setShowOutfitPicker(false); }}>
                  <Text style={[s.outfitOptionText, selectedOutfitId === outfit.id && s.outfitOptionTextActive]}>{outfit.name}</Text>
                  <Text style={s.outfitOptionSub}>{outfit.items.length} items</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  content: { padding: tokens.spacing.lg, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: tokens.spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, flex: 1 },
  headerBtn: { padding: 8 },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: tokens.spacing.lg },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: tokens.radius.lg, backgroundColor: BOX_BG, borderWidth: 1, borderColor: BOX_BORDER },
  tabBtnActive: { backgroundColor: GOLD, borderColor: GOLD },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabBtnTextActive: { color: '#000' },
  onboardingCta: { backgroundColor: BOX_BG, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: BOX_BORDER, alignItems: 'center' },
  onboardingIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(200,164,93,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(200,164,93,0.3)', marginBottom: 16 },
  onboardingTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' },
  onboardingSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  featureList: { width: '100%', gap: 8, marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD },
  featureText: { fontSize: 14, color: colors.text },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GOLD, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
  avatarDisplay: { alignItems: 'center' },
  avatarFrame: { width: '75%', backgroundColor: '#1a1510', borderRadius: 20, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: GOLD, marginBottom: 16 },
  avatarBrand: { fontSize: 18, fontWeight: '900', color: GOLD, letterSpacing: 5, marginBottom: 10 },
  avatarImg: { width: '100%', aspectRatio: 3 / 4, borderRadius: 12 },
  avatarPlaceholder: { width: '100%', aspectRatio: 3 / 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  settingsSummary: { width: '100%', backgroundColor: BOX_BG, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: BOX_BORDER, marginBottom: 12 },
  settingsSummaryTitle: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  settingsChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  settingsChip: { backgroundColor: 'rgba(200,164,93,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(200,164,93,0.25)' },
  settingsChipText: { fontSize: 12, fontWeight: '600', color: GOLD, textTransform: 'capitalize' },
  editAvatarBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BOX_BG, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, borderWidth: 1, borderColor: BOX_BORDER },
  editAvatarText: { fontSize: 14, fontWeight: '600', color: GOLD },
  occasionLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2, marginBottom: 10 },
  occasionRow: { gap: 10, paddingRight: 16 },
  occasionCard: { width: 80, backgroundColor: BOX_BG, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: BOX_BORDER },
  occasionCardActive: { borderColor: GOLD, backgroundColor: 'rgba(200,164,93,0.1)' },
  occasionIcon: { fontSize: 22, marginBottom: 4 },
  occasionText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  occasionTextActive: { color: GOLD },
  uploadSection: { backgroundColor: BOX_BG, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: BOX_BORDER, alignItems: 'center' },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  uploadSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  uploadBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  uploadBtn: { flex: 1, backgroundColor: 'rgba(200,164,93,0.08)', borderRadius: 14, padding: 20, alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: BOX_BORDER },
  uploadBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  photoPreview: { width: '100%', height: 220, borderRadius: 16, backgroundColor: colors.card, marginBottom: 12 },
  outfitPickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: BOX_BG, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BOX_BORDER },
  outfitPickerText: { fontSize: 14, color: colors.text },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: GOLD, borderRadius: 14, padding: 16, gap: 8 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
  loadingCard: { marginTop: 20, alignItems: 'center', padding: 32, backgroundColor: BOX_BG, borderRadius: 16, borderWidth: 1, borderColor: BOX_BORDER, gap: 12 },
  loadingTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  results: { gap: 12 },
  resultAvatarFrame: { backgroundColor: '#1a1510', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: GOLD, marginBottom: 4 },
  resultAvatarBrand: { fontSize: 12, fontWeight: '900', color: GOLD, letterSpacing: 4, marginBottom: 8 },
  resultAvatarImg: { width: '50%', aspectRatio: 3 / 4, borderRadius: 10, alignSelf: 'center' },
  resultCard: { backgroundColor: BOX_BG, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BOX_BORDER },
  resultCardTitle: { fontSize: 13, fontWeight: '700', color: GOLD, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  resultCardText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD, marginTop: 7 },
  tipText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  tryAnotherBtn: { borderWidth: 1.5, borderColor: GOLD, borderRadius: 14, padding: 14, alignItems: 'center' },
  tryAnotherText: { fontSize: 15, fontWeight: '600', color: GOLD },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 48, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 20 },
  modalClose: { position: 'absolute', top: 20, right: 20 },
  outfitOption: { padding: 14, borderRadius: 12, marginBottom: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  outfitOptionActive: { borderColor: GOLD, backgroundColor: 'rgba(200,164,93,0.08)' },
  outfitOptionText: { fontSize: 15, fontWeight: '600', color: colors.text },
  outfitOptionTextActive: { color: GOLD },
  outfitOptionSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
