import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, Pressable, ScrollView,
  Image, ActivityIndicator, Alert, Modal, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Wand2, Camera, Upload, X, RefreshCw, Sparkles, ShoppingBag } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, tokens } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';

const AVATAR_KEY = 'klotho_user_avatar';
const AVATAR_URL_KEY = 'klotho_user_avatar_url';
const AVATAR_METHOD_KEY = 'klotho_avatar_method';

const BOX_BG = 'rgba(11,11,13,0.82)';
const BOX_BORDER = 'rgba(245,200,91,0.25)';

const OCCASIONS = [
  { id: 'casual', label: 'Casual' },
  { id: 'work', label: 'Work' },
  { id: 'formal', label: 'Formal' },
  { id: 'evening', label: 'Evening' },
  { id: 'athletic', label: 'Athletic' },
];

// Map category to cloth_type for CAT-VTON
function getClothType(category: string): string {
  if (['pants', 'shorts', 'jeans'].includes(category)) return 'lower';
  if (['jackets', 'outerwear'].includes(category)) return 'outer';
  return 'upper';
}

export default function AIStylistScreen() {
  const router = useRouter();
  const { items } = useWardrobeStore();

  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [checkingAvatar, setCheckingAvatar] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState('casual');
  const [activeTab, setActiveTab] = useState<'avatar' | 'stylist'>('avatar');
  const [showItemPicker, setShowItemPicker] = useState(false);

  useEffect(() => { loadSavedAvatar(); }, []);

  const loadSavedAvatar = async () => {
    try {
      const saved = await AsyncStorage.getItem(AVATAR_KEY);
      const savedUrl = await AsyncStorage.getItem(AVATAR_URL_KEY);
      if (saved) { setAvatar(saved); setAvatarUrl(savedUrl); setActiveTab('stylist'); }
    } catch (err) { console.warn('Failed to load avatar:', err); }
    finally { setCheckingAvatar(false); }
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

  const pickPhoto = async (useCamera: boolean) => {
    const permFn = useCamera ? ImagePicker.requestCameraPermissionsAsync : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permFn();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Photo access required.'); return; }
    const launchFn = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await launchFn({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [3, 4], quality: 0.4, width: 512,
    });
    if (!result.canceled) generateAvatar(result.assets[0].uri);
  };

  const generateAvatar = async (photoUri: string) => {
    setAvatarLoading(true);
    try {
      const base64 = await getBase64(photoUri);
      const mediaType = base64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke('avatar-fal', {
        body: { imageBase64: base64, imageMediaType: mediaType, userId: user?.id },
      });

      if (error) throw new Error(error.message);
      if (!data?.avatarBase64) throw new Error('No avatar returned');

      const avatarUri = `data:image/png;base64,${data.avatarBase64}`;
      setAvatar(avatarUri);
      setAvatarUrl(null);
      await AsyncStorage.setItem(AVATAR_KEY, avatarUri);
      await AsyncStorage.setItem(AVATAR_METHOD_KEY, 'fal');
      setActiveTab('stylist');
      Alert.alert('Avatar Created!', 'Your avatar is ready. Now try on items from your wardrobe!');
    } catch (err: any) {
      console.error('Avatar error:', err);
      // Fallback: use original photo as avatar
      const avatarUri = photoUri;
      setAvatar(avatarUri);
      await AsyncStorage.setItem(AVATAR_KEY, avatarUri);
      await AsyncStorage.setItem(AVATAR_METHOD_KEY, 'photo');
      setActiveTab('stylist');
      Alert.alert('Avatar Set', 'Your photo has been set as your avatar.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const tryOnItem = async (item: any) => {
    if (!avatar) { Alert.alert('No avatar', 'Please create your avatar first.'); return; }
    setSelectedItem(item);
    setTryOnLoading(true);
    setTryOnResult(null);

    try {
      // Get avatar URL — either saved Supabase URL or base64
      const avatarSource = avatarUrl || avatar;
      const clothType = getClothType(item.category);

      let body: any = {
        avatarUrl: avatarSource,
        clothType,
      };

      // If item has imageUrl, use it directly
      if (item.imageUrl && item.imageUrl.startsWith('http')) {
        body.garmentUrl = item.imageUrl;
      } else if (item.imageUrl) {
        // Convert local image to base64
        const base64 = await getBase64(item.imageUrl);
        body.garmentBase64 = base64;
        body.garmentMediaType = 'image/jpeg';
      }

      const { data, error } = await supabase.functions.invoke('tryon-fal', { body });
      if (error) throw new Error(error.message);
      if (!data?.resultBase64) throw new Error('No result returned');

      setTryOnResult(`data:image/png;base64,${data.resultBase64}`);
    } catch (err: any) {
      console.error('Try-on error:', err);
      Alert.alert('Try-on failed', err?.message || 'Please try again.');
    } finally {
      setTryOnLoading(false);
    }
  };

  const resetAvatar = async () => {
    Alert.alert('Reset Avatar', 'Create a new avatar?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          await AsyncStorage.multiRemove([AVATAR_KEY, AVATAR_URL_KEY, AVATAR_METHOD_KEY]);
          setAvatar(null); setAvatarUrl(null); setTryOnResult(null);
          setSelectedItem(null); setActiveTab('avatar');
        }
      }
    ]);
  };

  if (checkingAvatar) {
    return (
      <ImageBackground source={require('../../assets/images/closet-backdrop.png')} style={{ flex: 1 }} resizeMode="cover">
        <SafeAreaView style={s.container} edges={['top']}>
          <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../assets/images/closet-backdrop.png')} style={{ flex: 1 }} resizeMode="cover">
      <SafeAreaView style={s.container} edges={['top']}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <Wand2 size={22} color={colors.primary} />
            <Text style={s.title}>AI Stylist</Text>
            {avatar && <Pressable onPress={resetAvatar} style={s.resetBtn}><RefreshCw size={18} color={colors.textSecondary} /></Pressable>}
          </View>

          {/* Tab switcher */}
          {avatar && (
            <View style={s.tabRow}>
              <Pressable style={[s.tabBtn, activeTab === 'avatar' && s.tabBtnActive]} onPress={() => setActiveTab('avatar')}>
                <Camera size={15} color={activeTab === 'avatar' ? '#000' : colors.textSecondary} />
                <Text style={[s.tabBtnText, activeTab === 'avatar' && s.tabBtnTextActive]}>My Avatar</Text>
              </Pressable>
              <Pressable style={[s.tabBtn, activeTab === 'stylist' && s.tabBtnActive]} onPress={() => setActiveTab('stylist')}>
                <Sparkles size={15} color={activeTab === 'stylist' ? '#000' : colors.textSecondary} />
                <Text style={[s.tabBtnText, activeTab === 'stylist' && s.tabBtnTextActive]}>Try On</Text>
              </Pressable>
            </View>
          )}

          {/* AVATAR TAB */}
          {(!avatar || activeTab === 'avatar') && (
            <View style={s.avatarTab}>
              {!avatar ? (
                <>
                  <Text style={s.onboardingTitle}>Create Your Avatar</Text>
                  <Text style={s.onboardingSub}>Upload a full-body photo. AI will create your styled avatar for virtual try-on.</Text>
                  <View style={s.photoButtons}>
                    <Pressable style={s.photoBtn} onPress={() => pickPhoto(true)}>
                      <Camera size={28} color={colors.primary} />
                      <Text style={s.photoBtnText}>Take Photo</Text>
                    </Pressable>
                    <Pressable style={s.photoBtn} onPress={() => pickPhoto(false)}>
                      <Upload size={28} color={colors.primary} />
                      <Text style={s.photoBtnText}>Upload Photo</Text>
                    </Pressable>
                  </View>
                  {avatarLoading && (
                    <View style={s.loadingBox}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <Text style={s.loadingTitle}>Creating your avatar...</Text>
                      <Text style={s.loadingSub}>This takes 20-40 seconds</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  {/* Avatar centered over backdrop */}
                  <View style={s.avatarFrame}>
                    <Image source={{ uri: tryOnResult || avatar }} style={s.avatarImage} resizeMode="contain" />
                    {tryOnLoading && (
                      <View style={s.avatarLoadingOverlay}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={s.loadingTitle}>Trying on outfit...</Text>
                      </View>
                    )}
                  </View>
                  {selectedItem && tryOnResult && (
                    <View style={s.tryOnLabel}>
                      <Sparkles size={14} color={colors.primary} />
                      <Text style={s.tryOnLabelText}>Wearing: {selectedItem.name}</Text>
                      <Pressable onPress={() => { setTryOnResult(null); setSelectedItem(null); }}>
                        <X size={14} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  )}
                  <View style={s.photoButtons}>
                    <Pressable style={s.photoBtn} onPress={() => pickPhoto(true)}>
                      <Camera size={20} color={colors.primary} />
                      <Text style={s.photoBtnText}>New Photo</Text>
                    </Pressable>
                    <Pressable style={s.photoBtn} onPress={() => pickPhoto(false)}>
                      <Upload size={20} color={colors.primary} />
                      <Text style={s.photoBtnText}>Upload</Text>
                    </Pressable>
                  </View>
                  {avatarLoading && (
                    <View style={s.loadingBox}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <Text style={s.loadingTitle}>Updating avatar...</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* TRY ON TAB */}
          {avatar && activeTab === 'stylist' && (
            <>
              {/* Occasion chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow} style={{ marginBottom: tokens.spacing.md }}>
                {OCCASIONS.map((occ) => (
                  <Pressable key={occ.id} style={[s.chip, selectedOccasion === occ.id && s.chipActive]} onPress={() => setSelectedOccasion(occ.id)}>
                    <Text style={[s.chipText, selectedOccasion === occ.id && s.chipTextActive]}>{occ.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Avatar display */}
              <View style={s.avatarFrame}>
                <Image source={{ uri: tryOnResult || avatar }} style={s.avatarImage} resizeMode="contain" />
                {tryOnLoading && (
                  <View style={s.avatarLoadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={s.loadingTitle}>Trying on outfit...</Text>
                  </View>
                )}
              </View>

              {selectedItem && tryOnResult && (
                <View style={s.tryOnLabel}>
                  <Sparkles size={14} color={colors.primary} />
                  <Text style={s.tryOnLabelText}>Wearing: {selectedItem.name}</Text>
                  <Pressable onPress={() => { setTryOnResult(null); setSelectedItem(null); }}>
                    <X size={14} color={colors.textSecondary} />
                  </Pressable>
                </View>
              )}

              {/* Wardrobe items to try on */}
              <View style={s.sectionBox}>
                <View style={s.sectionHeader}>
                  <ShoppingBag size={16} color={colors.primary} />
                  <Text style={s.sectionTitle}>Tap to try on</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.itemsStrip}>
                  {items.slice(0, 20).map((item: any) => (
                    <Pressable
                      key={item.id}
                      style={[s.itemCard, selectedItem?.id === item.id && s.itemCardActive]}
                      onPress={() => tryOnItem(item)}
                    >
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={s.itemImage} resizeMode="cover" />
                      ) : (
                        <View style={s.itemImagePlaceholder}>
                          <Text style={{ fontSize: 24 }}>👕</Text>
                        </View>
                      )}
                      <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.itemBrand} numberOfLines={1}>{item.brand}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const BOX_BG = 'rgba(11,11,13,0.82)';
const BOX_BORDER = 'rgba(245,200,91,0.25)';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: tokens.spacing.lg, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: tokens.spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, flex: 1 },
  resetBtn: { padding: 8 },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: tokens.spacing.lg },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: tokens.radius.lg, backgroundColor: BOX_BG, borderWidth: 1, borderColor: BOX_BORDER },
  tabBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabBtnTextActive: { color: '#000' },
  // Avatar tab
  avatarTab: { alignItems: 'center' },
  onboardingTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: tokens.spacing.sm, textAlign: 'center' },
  onboardingSub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, textAlign: 'center', marginBottom: tokens.spacing.xl, paddingHorizontal: tokens.spacing.md },
  photoButtons: { flexDirection: 'row', gap: 12, width: '100%', marginTop: tokens.spacing.md },
  photoBtn: { flex: 1, backgroundColor: BOX_BG, borderRadius: tokens.radius.xl, padding: tokens.spacing.lg, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: BOX_BORDER },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
  loadingBox: { marginTop: tokens.spacing.xl, alignItems: 'center', padding: tokens.spacing.xl, backgroundColor: BOX_BG, borderRadius: tokens.radius.xl, borderWidth: 1, borderColor: BOX_BORDER, gap: 8, width: '100%' },
  loadingTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  loadingSub: { fontSize: 13, color: colors.textSecondary },
  // Avatar frame — centered over backdrop, no background box
  avatarFrame: {
    width: '100%', height: 420, alignItems: 'center', justifyContent: 'center',
    marginBottom: tokens.spacing.md, position: 'relative',
    borderRadius: tokens.radius.xl, overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarLoadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  tryOnLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: BOX_BG, borderRadius: tokens.radius.lg,
    padding: tokens.spacing.sm, marginBottom: tokens.spacing.md,
    borderWidth: 1, borderColor: BOX_BORDER,
  },
  tryOnLabelText: { flex: 1, fontSize: 13, color: colors.text },
  // Try on tab
  chipsRow: { gap: 8, paddingRight: tokens.spacing.lg },
  chip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: BOX_BG, borderWidth: 1, borderColor: BOX_BORDER, height: 36, justifyContent: 'center' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  chipTextActive: { color: '#000', fontWeight: '700' },
  sectionBox: { backgroundColor: BOX_BG, borderRadius: tokens.radius.xl, borderWidth: 1, borderColor: BOX_BORDER, paddingTop: tokens.spacing.md, overflow: 'hidden', marginBottom: tokens.spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: tokens.spacing.md, marginBottom: tokens.spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemsStrip: { paddingHorizontal: tokens.spacing.md, paddingBottom: tokens.spacing.md, gap: 10 },
  itemCard: { width: 90, backgroundColor: 'rgba(28,28,33,0.9)', borderRadius: tokens.radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: BOX_BORDER },
  itemCardActive: { borderColor: colors.primary, borderWidth: 2 },
  itemImage: { width: 90, height: 90, backgroundColor: 'rgba(28,28,33,0.5)' },
  itemImagePlaceholder: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(28,28,33,0.5)' },
  itemName: { fontSize: 11, fontWeight: '600', color: colors.text, padding: 6, paddingBottom: 2 },
  itemBrand: { fontSize: 10, color: colors.textSecondary, paddingHorizontal: 6, paddingBottom: 6 },
});
