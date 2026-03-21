import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, Pressable, ScrollView,
  Image, ActivityIndicator, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Wand2, Camera, Upload, X, RefreshCw, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, tokens } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import * as FileSystem from 'expo-file-system';

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

  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState('casual');
  const [loading, setLoading] = useState(false);
  const [styleResult, setStyleResult] = useState<StyleResult | null>(null);
  const [step, setStep] = useState<'photo' | 'occasion' | 'result'>('photo');
  const [showOutfitPicker, setShowOutfitPicker] = useState(false);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take your photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      setUserPhoto(result.assets[0].uri);
      setStep('occasion');
      setStyleResult(null);
    }
  };

  const uploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      setUserPhoto(result.assets[0].uri);
      setStep('occasion');
      setStyleResult(null);
    }
  };

  const generateStyle = async () => {
    if (!userPhoto) {
      Alert.alert('Photo required', 'Please upload your photo first.');
      return;
    }

    setLoading(true);
    setStep('result');

    try {
      // Convert image to base64 using expo-file-system (works on iOS/Android)
      const base64 = await FileSystem.readAsStringAsync(userPhoto, {
        encoding: 'base64' as any,
      });

      // Get selected outfit items if any
      const selectedOutfit = selectedOutfitId
        ? outfits.find(o => o.id === selectedOutfitId)
        : null;

      const outfitItems = selectedOutfit
        ? items.filter(item => selectedOutfit.items.includes(item.id))
        : items.slice(0, 5); // Use first 5 items as suggestions

      const outfitDescription = outfitItems.length > 0
        ? outfitItems.map(i => `${i.name} (${i.brand}, ${i.color}, ${i.category})`).join(', ')
        : 'casual everyday clothes';

      const occasionLabel = OCCASIONS.find(o => o.id === selectedOccasion)?.label || 'Casual';

      // Call Claude AI
      const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: `You are a professional fashion stylist and personal shopper. Analyze this person's photo and provide personalized styling advice.

Occasion: ${occasionLabel}
Available wardrobe items: ${outfitDescription}

Please provide a JSON response with exactly this structure (no other text):
{
  "bodyAnalysis": "Brief, positive description of their build and style personality in 1-2 sentences",
  "outfitDescription": "Detailed description of how they would look wearing these items styled for ${occasionLabel}, as if painting a picture. 2-3 sentences.",
  "stylingTips": ["Tip 1", "Tip 2", "Tip 3"],
  "colorRecommendations": "Which colors from their wardrobe suit them best and why. 1-2 sentences.",
  "occasion": "${occasionLabel}"
}

Be positive, specific, and professional. Focus on what works well for their body type and coloring.`,
              },
            ],
          }],
        }),
      });

      const data = await aiResponse.json();
      const content = data.content?.[0]?.text || '';

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setStyleResult(parsed);
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (err) {
      console.error('AI styling error:', err);
      Alert.alert('Error', 'Failed to generate style advice. Please try again.');
      setStep('occasion');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setUserPhoto(null);
    setStyleResult(null);
    setSelectedOutfitId(null);
    setStep('photo');
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Wand2 size={24} color={colors.primary} />
          <Text style={s.title}>AI Stylist</Text>
          {userPhoto && (
            <Pressable onPress={reset} style={s.resetBtn}>
              <RefreshCw size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Occasion chips - horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsRow}
          style={s.chipsScroll}
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

        {/* Step 1: Photo upload */}
        {step === 'photo' && (
          <View style={s.photoSection}>
            <Text style={s.stepTitle}>Step 1: Upload Your Photo</Text>
            <Text style={s.stepSub}>Take a full-body photo or upload one from your library. Claude AI will analyze your style and body type.</Text>
            <View style={s.photoButtons}>
              <Pressable style={s.photoBtn} onPress={takePhoto}>
                <Camera size={32} color={colors.primary} />
                <Text style={s.photoBtnText}>Take Photo</Text>
              </Pressable>
              <Pressable style={s.photoBtn} onPress={uploadPhoto}>
                <Upload size={32} color={colors.primary} />
                <Text style={s.photoBtnText}>Upload Photo</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step 2: Photo uploaded, select outfit and generate */}
        {(step === 'occasion' || step === 'result') && userPhoto && (
          <View style={s.photoPreviewSection}>
            <Image source={{ uri: userPhoto }} style={s.photoPreview} resizeMode="cover" />

            {step === 'occasion' && (
              <>
                <Text style={s.stepTitle}>Step 2: Pick an Outfit (Optional)</Text>
                <Pressable style={s.outfitPickerBtn} onPress={() => setShowOutfitPicker(true)}>
                  <Text style={s.outfitPickerText}>
                    {selectedOutfitId
                      ? outfits.find(o => o.id === selectedOutfitId)?.name || 'Selected outfit'
                      : 'Choose from your outfits (or skip)'}
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

        {/* Step 3: Loading */}
        {loading && (
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingTitle}>Claude is styling you...</Text>
            <Text style={s.loadingSub}>Analyzing your photo and wardrobe</Text>
          </View>
        )}

        {/* Step 3: Results */}
        {styleResult && !loading && (
          <View style={s.resultsSection}>
            <View style={s.resultCard}>
              <Text style={s.resultCardTitle}>Your Style Profile</Text>
              <Text style={s.resultCardText}>{styleResult.bodyAnalysis}</Text>
            </View>

            <View style={s.resultCard}>
              <Text style={s.resultCardTitle}>
                Your {styleResult.occasion} Look
              </Text>
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

            <Pressable style={s.tryAnotherBtn} onPress={() => setStep('occasion')}>
              <Text style={s.tryAnotherText}>Try Another Occasion</Text>
            </Pressable>

            <Pressable
              style={s.exploreBtn}
              onPress={() => router.push('/ai-recommendations' as any)}
            >
              <Wand2 size={18} color={colors.background} />
              <Text style={s.exploreBtnText}>Get Full Outfit Recommendations</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Outfit picker modal */}
      <Modal visible={showOutfitPicker} transparent animationType="slide" onRequestClose={() => setShowOutfitPicker(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Choose an Outfit</Text>
            <ScrollView>
              <Pressable
                style={s.outfitOption}
                onPress={() => { setSelectedOutfitId(null); setShowOutfitPicker(false); }}
              >
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
            <Pressable style={s.modalClose} onPress={() => setShowOutfitPicker(false)}>
              <X size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: tokens.spacing.lg, paddingBottom: 120 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: tokens.spacing.lg,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, flex: 1 },
  resetBtn: { padding: 8 },
  chipsScroll: { marginBottom: tokens.spacing.lg },
  chipsRow: { gap: 8, paddingRight: tokens.spacing.lg },
  chip: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  chipTextActive: { color: '#000', fontWeight: '700' },
  // Photo step
  photoSection: { alignItems: 'center', paddingVertical: tokens.spacing.xl },
  stepTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: tokens.spacing.sm, alignSelf: 'flex-start' },
  stepSub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: tokens.spacing.xl, alignSelf: 'flex-start' },
  photoButtons: { flexDirection: 'row', gap: 16, width: '100%' },
  photoBtn: {
    flex: 1, backgroundColor: colors.card, borderRadius: tokens.radius.xl,
    padding: tokens.spacing.xl, alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  photoBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  // Photo preview
  photoPreviewSection: { marginBottom: tokens.spacing.lg },
  photoPreview: {
    width: '100%', height: 300, borderRadius: tokens.radius.xl,
    backgroundColor: colors.card, marginBottom: tokens.spacing.lg,
  },
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
  // Loading
  loadingCard: {
    alignItems: 'center', padding: tokens.spacing.xxl,
    backgroundColor: colors.card, borderRadius: tokens.radius.xl,
    borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  loadingSub: { fontSize: 14, color: colors.textSecondary },
  // Results
  resultsSection: { gap: 12 },
  resultCard: {
    backgroundColor: colors.card, borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  resultCardTitle: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: tokens.spacing.sm },
  resultCardText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7 },
  tipText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  tryAnotherBtn: {
    borderWidth: 1, borderColor: colors.primary, borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md, alignItems: 'center',
  },
  tryAnotherText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  exploreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md, gap: 8,
  },
  exploreBtnText: { fontSize: 15, fontWeight: '600', color: colors.background },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.background, borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl, padding: tokens.spacing.lg,
    paddingBottom: 48, maxHeight: '70%',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: tokens.spacing.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: tokens.spacing.md },
  modalClose: { position: 'absolute', top: tokens.spacing.lg, right: tokens.spacing.lg },
  outfitOption: {
    padding: tokens.spacing.md, borderRadius: tokens.radius.lg,
    marginBottom: 8, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
  },
  outfitOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  outfitOptionText: { fontSize: 15, fontWeight: '600', color: colors.text },
  outfitOptionTextActive: { color: colors.primary },
  outfitOptionSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
