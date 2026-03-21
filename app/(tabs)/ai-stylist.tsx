import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, Pressable, ScrollView,
  Image, ActivityIndicator, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Wand2, Camera, Upload, X, RefreshCw, ChevronRight, Sparkles, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, tokens } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';

const AVATAR_KEY = 'klotho_user_avatar';
const AVATAR_APPEARANCE_KEY = 'klotho_user_appearance';

const OCCASIONS = [
  { id: 'casual', label: 'Casual' },
  { id: 'work', label: 'Work' },
  { id: 'formal', label: 'Formal' },
  { id: 'evening', label: 'Evening' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'weather', label: 'Weather' },
];

interface StyleResult {
  bodyAnalysis: string;
  outfitDescription: string;
  stylingTips: string[];
  colorRecommendations: string;
  occasion: string;
}

export default function AIStylistScreen() {
  const router = useRouter();
  const { items, outfits } = useWardrobeStore();

  // Avatar state
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarAppearance, setAvatarAppearance] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [checkingAvatar, setCheckingAvatar] = useState(true);

  // Stylist state
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState('casual');
  const [loading, setLoading] = useState(false);
  const [styleResult, setStyleResult] = useState<StyleResult | null>(null);
  const [step, setStep] = useState<'photo' | 'occasion' | 'result'>('photo');
  const [showOutfitPicker, setShowOutfitPicker] = useState(false);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'avatar' | 'stylist'>('avatar');

  // Load saved avatar on mount
  useEffect(() => {
    loadSavedAvatar();
  }, []);

  const loadSavedAvatar = async () => {
    try {
      const saved = await AsyncStorage.getItem(AVATAR_KEY);
      const appearance = await AsyncStorage.getItem(AVATAR_APPEARANCE_KEY);
      if (saved) {
        setAvatar(saved);
        setAvatarAppearance(appearance);
        setActiveTab('stylist');
      }
    } catch (err) {
      console.warn('Failed to load avatar:', err);
    } finally {
      setCheckingAvatar(false);
    }
  };

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

  const pickAvatarPhoto = async (useCamera: boolean) => {
    const permFn = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permFn();
    if (status !== 'granted') {
      Alert.alert('Permission needed', useCamera ? 'Camera access required.' : 'Photo library access required.');
      return;
    }
    const launchFn = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;
    const result = await launchFn({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.1,
      width: 400,
    });
    if (!result.canceled) {
      generateAvatar(result.assets[0].uri);
    }
  };

  const generateAvatar = async (photoUri: string) => {
    setAvatarLoading(true);
    try {
      const base64 = await getBase64(photoUri);

      // Get selected outfit for avatar
      const selectedOutfit = selectedOutfitId
        ? outfits.find(o => o.id === selectedOutfitId)
        : null;
      const outfitItems = selectedOutfit
        ? items.filter(i => selectedOutfit.items.includes(i.id))
        : items.slice(0, 3);
      const outfitDesc = outfitItems.length > 0
        ? outfitItems.map(i => `${i.name} in ${i.color}`).join(', ')
        : 'stylish casual outfit';

      const { data, error } = await supabase.functions.invoke('avatar-generator', {
        body: { imageBase64: base64, outfitDescription: outfitDesc },
      });

      if (error) throw new Error(error.message);
      if (!data?.avatarBase64) throw new Error('No avatar returned');

      const avatarUri = `data:image/png;base64,${data.avatarBase64}`;
      setAvatar(avatarUri);
      setAvatarAppearance(data.appearance || '');

      // Save avatar
      await AsyncStorage.setItem(AVATAR_KEY, avatarUri);
      await AsyncStorage.setItem(AVATAR_APPEARANCE_KEY, data.appearance || '');

      setActiveTab('stylist');
      Alert.alert('Avatar Created!', 'Your lifelike avatar is ready. Now you can style it with your wardrobe!');
    } catch (err: any) {
      console.error('Avatar error:', err);
      Alert.alert('Error', `Failed to create avatar: ${err?.message || 'Please try again'}`);
    } finally {
      setAvatarLoading(false);
    }
  };

  const resetAvatar = async () => {
    Alert.alert('Reset Avatar', 'Create a new avatar? This will replace your current one.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem(AVATAR_KEY);
          await AsyncStorage.removeItem(AVATAR_APPEARANCE_KEY);
          setAvatar(null);
          setAvatarAppearance(null);
          setActiveTab('avatar');
        }
      }
    ]);
  };

  // Stylist functions
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access required.'); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [3, 4], quality: 0.1, width: 400,
    });
    if (!result.canceled) { setUserPhoto(result.assets[0].uri); setStep('occasion'); setStyleResult(null); }
  };

  const uploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Photo library access required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [3, 4], quality: 0.1, width: 400,
    });
    if (!result.canceled) { setUserPhoto(result.assets[0].uri); setStep('occasion'); setStyleResult(null); }
  };

  const generateStyle = async () => {
    if (!userPhoto) { Alert.alert('Photo required', 'Please upload your photo first.'); return; }
    setLoading(true);
    setStep('result');
    try {
      const base64 = await getBase64(userPhoto);
      const selectedOutfit = selectedOutfitId ? outfits.find(o => o.id === selectedOutfitId) : null;
      const outfitItems = selectedOutfit
        ? items.filter(item => selectedOutfit.items.includes(item.id))
        : items.slice(0, 5);
      const outfitDescription = outfitItems.length > 0
        ? outfitItems.map(i => `${i.name} (${i.brand}, ${i.color}, ${i.category})`).join(', ')
        : 'casual everyday clothes';
      const occasionLabel = OCCASIONS.find(o => o.id === selectedOccasion)?.label || 'Casual';

      const { data: aiData, error: aiError } = await supabase.functions.invoke('claude-stylist', {
        body: { imageBase64: base64, occasion: selectedOccasion, outfitDescription },
      });
      if (aiError) throw new Error(aiError.message);
      setStyleResult(aiData);
    } catch (err: any) {
      console.error('AI styling error:', err);
      Alert.alert('Error', 'Failed to generate style advice. Please try again.');
      setStep('occasion');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAvatar) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Wand2 size={24} color={colors.primary} />
          <Text style={s.title}>AI Stylist</Text>
          {avatar && (
            <Pressable onPress={resetAvatar} style={s.resetBtn}>
              <RefreshCw size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Tab switcher */}
        {avatar && (
          <View style={s.tabRow}>
            <Pressable
              style={[s.tabBtn, activeTab === 'avatar' && s.tabBtnActive]}
              onPress={() => setActiveTab('avatar')}
            >
              <User size={16} color={activeTab === 'avatar' ? colors.background : colors.textSecondary} />
              <Text style={[s.tabBtnText, activeTab === 'avatar' && s.tabBtnTextActive]}>My Avatar</Text>
            </Pressable>
            <Pressable
              style={[s.tabBtn, activeTab === 'stylist' && s.tabBtnActive]}
              onPress={() => setActiveTab('stylist')}
            >
              <Sparkles size={16} color={activeTab === 'stylist' ? colors.background : colors.textSecondary} />
              <Text style={[s.tabBtnText, activeTab === 'stylist' && s.tabBtnTextActive]}>AI Styling</Text>
            </Pressable>
          </View>
        )}

        {/* AVATAR TAB */}
        {(!avatar || activeTab === 'avatar') && (
          <>
            {!avatar ? (
              // First time - create avatar
              <View style={s.avatarOnboarding}>
                <View style={s.avatarPlaceholder}>
                  <User size={80} color={colors.textSecondary} />
                </View>
                <Text style={s.onboardingTitle}>Create Your Avatar</Text>
                <Text style={s.onboardingSub}>
                  Upload a full-body photo and AI will generate a lifelike replica of you styled in front of your wardrobe — just like a fashion shoot.
                </Text>
                <View style={s.photoButtons}>
                  <Pressable style={s.photoBtn} onPress={() => pickAvatarPhoto(true)}>
                    <Camera size={28} color={colors.primary} />
                    <Text style={s.photoBtnText}>Take Photo</Text>
                  </Pressable>
                  <Pressable style={s.photoBtn} onPress={() => pickAvatarPhoto(false)}>
                    <Upload size={28} color={colors.primary} />
                    <Text style={s.photoBtnText}>Upload Photo</Text>
                  </Pressable>
                </View>
                {avatarLoading && (
                  <View style={s.avatarLoadingCard}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={s.avatarLoadingTitle}>Creating your avatar...</Text>
                    <Text style={s.avatarLoadingSub}>Claude is analyzing your photo</Text>
                    <Text style={s.avatarLoadingSub}>Generating your lifelike replica</Text>
                    <Text style={s.avatarLoadingSub}>This takes 30-60 seconds</Text>
                  </View>
                )}
              </View>
            ) : (
              // Show existing avatar
              <View style={s.avatarSection}>
                <Image
                  source={{ uri: avatar }}
                  style={s.avatarImage}
                  resizeMode="cover"
                />
                <Text style={s.avatarCaption}>Your Klotho Avatar</Text>
                <View style={s.avatarActions}>
                  <Pressable style={s.avatarActionBtn} onPress={() => pickAvatarPhoto(false)}>
                    <RefreshCw size={16} color={colors.primary} />
                    <Text style={s.avatarActionText}>Regenerate with new outfit</Text>
                  </Pressable>
                </View>
                {avatarLoading && (
                  <View style={s.avatarLoadingCard}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={s.avatarLoadingTitle}>Regenerating avatar...</Text>
                    <Text style={s.avatarLoadingSub}>This takes 30-60 seconds</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* STYLIST TAB */}
        {avatar && activeTab === 'stylist' && (
          <>
            {/* Occasion chips */}
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsRow} style={s.chipsScroll}
            >
              {OCCASIONS.map((occ) => (
                <Pressable
                  key={occ.id}
                  style={[s.chip, selectedOccasion === occ.id && s.chipActive]}
                  onPress={() => setSelectedOccasion(occ.id)}
                >
                  <Text style={[s.chipText, selectedOccasion === occ.id && s.chipTextActive]}>
                    {occ.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Photo step */}
            {step === 'photo' && (
              <View style={s.stylistPhotoSection}>
                <Text style={s.stepTitle}>Upload Your Photo</Text>
                <Text style={s.stepSub}>Claude AI will analyze your style and give personalized advice for the selected occasion.</Text>
                <View style={s.photoButtons}>
                  <Pressable style={s.photoBtn} onPress={takePhoto}>
                    <Camera size={28} color={colors.primary} />
                    <Text style={s.photoBtnText}>Take Photo</Text>
                  </Pressable>
                  <Pressable style={s.photoBtn} onPress={uploadPhoto}>
                    <Upload size={28} color={colors.primary} />
                    <Text style={s.photoBtnText}>Upload Photo</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Photo uploaded */}
            {(step === 'occasion' || step === 'result') && userPhoto && (
              <View style={s.photoPreviewSection}>
                <Image source={{ uri: userPhoto }} style={s.photoPreview} resizeMode="cover" />
                {step === 'occasion' && (
                  <>
                    <Pressable style={s.outfitPickerBtn} onPress={() => setShowOutfitPicker(true)}>
                      <Text style={s.outfitPickerText}>
                        {selectedOutfitId
                          ? outfits.find(o => o.id === selectedOutfitId)?.name || 'Selected outfit'
                          : 'Choose outfit (optional)'}
                      </Text>
                      <ChevronRight size={18} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable style={s.generateBtn} onPress={generateStyle}>
                      <Wand2 size={20} color={colors.background} />
                      <Text style={s.generateBtnText}>Generate My Style</Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}

            {/* Loading */}
            {loading && (
              <View style={s.loadingCard}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={s.loadingTitle}>Claude is styling you...</Text>
                <Text style={s.loadingSub}>Analyzing your photo and wardrobe</Text>
              </View>
            )}

            {/* Results */}
            {styleResult && !loading && (
              <View style={s.resultsSection}>
                {avatar && (
                  <Image source={{ uri: avatar }} style={s.resultAvatar} resizeMode="cover" />
                )}
                <View style={s.resultCard}>
                  <Text style={s.resultCardTitle}>Your Style Profile</Text>
                  <Text style={s.resultCardText}>{styleResult.bodyAnalysis}</Text>
                </View>
                <View style={s.resultCard}>
                  <Text style={s.resultCardTitle}>Your {styleResult.occasion} Look</Text>
                  <Text style={s.resultCardText}>{styleResult.outfitDescription}</Text>
                </View>
                <View style={s.resultCard}>
                  <Text style={s.resultCardTitle}>Color Recommendations</Text>
                  <Text style={s.resultCardText}>{styleResult.colorRecommendations}</Text>
                </View>
                <View style={s.resultCard}>
                  <Text style={s.resultCardTitle}>Styling Tips</Text>
                  {styleResult.stylingTips.map((tip, i) => (
                    <View key={i} style={s.tipRow}>
                      <View style={s.tipDot} />
                      <Text style={s.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
                <Pressable style={s.tryAnotherBtn} onPress={() => setStep('photo')}>
                  <Text style={s.tryAnotherText}>Try Another Look</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Outfit picker modal */}
      <Modal visible={showOutfitPicker} transparent animationType="slide" onRequestClose={() => setShowOutfitPicker(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Choose an Outfit</Text>
            <Pressable style={s.modalClose} onPress={() => setShowOutfitPicker(false)}>
              <X size={20} color={colors.text} />
            </Pressable>
            <ScrollView>
              <Pressable style={s.outfitOption} onPress={() => { setSelectedOutfitId(null); setShowOutfitPicker(false); }}>
                <Text style={s.outfitOptionText}>Use my full wardrobe</Text>
              </Pressable>
              {outfits.map((outfit) => (
                <Pressable
                  key={outfit.id}
                  style={[s.outfitOption, selectedOutfitId === outfit.id && s.outfitOptionActive]}
                  onPress={() => { setSelectedOutfitId(outfit.id); setShowOutfitPicker(false); }}
                >
                  <Text style={[s.outfitOptionText, selectedOutfitId === outfit.id && s.outfitOptionTextActive]}>
                    {outfit.name}
                  </Text>
                  <Text style={s.outfitOptionSub}>{outfit.items.length} items · {outfit.occasion}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: tokens.spacing.lg, paddingBottom: 120 },
  centerLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: tokens.spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, flex: 1 },
  resetBtn: { padding: 8 },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: tokens.spacing.lg },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: tokens.radius.lg,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  tabBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabBtnTextActive: { color: colors.background },
  // Avatar onboarding
  avatarOnboarding: { alignItems: 'center', paddingVertical: tokens.spacing.xl },
  avatarPlaceholder: {
    width: 160, height: 220, borderRadius: tokens.radius.xl,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    marginBottom: tokens.spacing.lg,
  },
  onboardingTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: tokens.spacing.sm, textAlign: 'center' },
  onboardingSub: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: tokens.spacing.xl, paddingHorizontal: tokens.spacing.md },
  photoButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  photoBtn: {
    flex: 1, backgroundColor: colors.card, borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
  avatarLoadingCard: {
    marginTop: tokens.spacing.xl, alignItems: 'center', padding: tokens.spacing.xl,
    backgroundColor: colors.card, borderRadius: tokens.radius.xl,
    borderWidth: 1, borderColor: colors.border, gap: 8, width: '100%',
  },
  avatarLoadingTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  avatarLoadingSub: { fontSize: 13, color: colors.textSecondary },
  // Avatar display
  avatarSection: { alignItems: 'center', marginBottom: tokens.spacing.lg },
  avatarImage: {
    width: '100%', height: 420, borderRadius: tokens.radius.xl,
    backgroundColor: colors.card, marginBottom: tokens.spacing.md,
  },
  avatarCaption: { fontSize: 14, color: colors.textSecondary, marginBottom: tokens.spacing.md },
  avatarActions: { width: '100%' },
  avatarActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.primaryLight, borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md, borderWidth: 1, borderColor: colors.primary + '40',
  },
  avatarActionText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  // Stylist
  chipsScroll: { marginBottom: tokens.spacing.lg },
  chipsRow: { gap: 8, paddingRight: tokens.spacing.lg },
  chip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  chipTextActive: { color: '#000', fontWeight: '700' },
  stylistPhotoSection: { marginBottom: tokens.spacing.lg },
  stepTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: tokens.spacing.sm },
  stepSub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: tokens.spacing.lg },
  photoPreviewSection: { marginBottom: tokens.spacing.lg },
  photoPreview: { width: '100%', height: 280, borderRadius: tokens.radius.xl, backgroundColor: colors.card, marginBottom: tokens.spacing.md },
  outfitPickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md, marginBottom: tokens.spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  outfitPickerText: { fontSize: 14, color: colors.text },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md, gap: 8,
  },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: colors.background },
  loadingCard: {
    alignItems: 'center', padding: tokens.spacing.xxl,
    backgroundColor: colors.card, borderRadius: tokens.radius.xl,
    borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  loadingSub: { fontSize: 14, color: colors.textSecondary },
  resultsSection: { gap: 12 },
  resultAvatar: { width: '100%', height: 300, borderRadius: tokens.radius.xl, marginBottom: 4 },
  resultCard: { backgroundColor: colors.card, borderRadius: tokens.radius.xl, padding: tokens.spacing.lg, borderWidth: 1, borderColor: colors.border },
  resultCardTitle: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: tokens.spacing.sm },
  resultCardText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7 },
  tipText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  tryAnotherBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: tokens.radius.lg, padding: tokens.spacing.md, alignItems: 'center' },
  tryAnotherText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.background, borderTopLeftRadius: tokens.radius.xl, borderTopRightRadius: tokens.radius.xl, padding: tokens.spacing.lg, paddingBottom: 48, maxHeight: '70%' },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: tokens.spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: tokens.spacing.md },
  modalClose: { position: 'absolute', top: tokens.spacing.lg, right: tokens.spacing.lg },
  outfitOption: { padding: tokens.spacing.md, borderRadius: tokens.radius.lg, marginBottom: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  outfitOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  outfitOptionText: { fontSize: 15, fontWeight: '600', color: colors.text },
  outfitOptionTextActive: { color: colors.primary },
  outfitOptionSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
