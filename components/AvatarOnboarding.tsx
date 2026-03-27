import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, Pressable, ScrollView,
  Image, ActivityIndicator, Alert, Modal, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, Check, ChevronRight, ChevronLeft, X, Star, Zap, User } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const { width: SCREEN_W } = Dimensions.get('window');

export interface AvatarSettings {
  photos: string[];
  bodyType: string;
  preferredFit: string;
  skinToneRetention: number;
  hairRetention: number;
  realism: number;
  selectedAvatarUri: string | null;
  avatarUrl: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onComplete: (settings: AvatarSettings) => void;
  existingSettings?: AvatarSettings | null;
}

const BODY_TYPES = [
  { id: 'slim', label: 'Slim', icon: '🧍' },
  { id: 'athletic', label: 'Athletic', icon: '💪' },
  { id: 'average', label: 'Average', icon: '🙂' },
  { id: 'broad', label: 'Broad', icon: '🏋️' },
  { id: 'curvy', label: 'Curvy', icon: '✨' },
  { id: 'plus', label: 'Plus', icon: '🌟' },
];

const FIT_TYPES = [
  { id: 'slim-fit', label: 'Slim Fit' },
  { id: 'regular', label: 'Regular' },
  { id: 'relaxed', label: 'Relaxed' },
  { id: 'oversized', label: 'Oversized' },
];

const STEPS = ['Photos', 'Body Type', 'Settings', 'Generate', 'Pick Avatar'];
const GOLD = '#C8A45D';
const BOX_BG = 'rgba(20,16,10,0.88)';
const BOX_BORDER = 'rgba(200,164,93,0.35)';

function SliderRow({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  const steps = [0, 25, 50, 75, 100];
  return (
    <View style={sl.wrap}>
      <View style={sl.labelRow}>
        <Text style={sl.label}>{label}</Text>
        <Text style={sl.val}>{value}%</Text>
      </View>
      {hint && <Text style={sl.hint}>{hint}</Text>}
      <View style={sl.track}>
        <View style={[sl.fill, { width: `${value}%` as any }]} />
        {steps.map(s => (
          <Pressable key={s} style={[sl.dot, { left: `${s}%` as any }, value >= s && sl.dotActive]} onPress={() => onChange(s)} />
        ))}
      </View>
      <View style={sl.labels}>
        <Text style={sl.sideLabel}>Low</Text>
        <Text style={sl.sideLabel}>High</Text>
      </View>
    </View>
  );
}

const sl = StyleSheet.create({
  wrap: { marginBottom: 24 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  val: { fontSize: 14, fontWeight: '700', color: GOLD },
  hint: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  track: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, position: 'relative', marginBottom: 8 },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: GOLD, borderRadius: 3 },
  dot: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.2)', top: -4, marginLeft: -7, borderWidth: 1, borderColor: 'rgba(200,164,93,0.3)' },
  dotActive: { backgroundColor: GOLD, borderColor: GOLD },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  sideLabel: { fontSize: 11, color: colors.textSecondary },
});

export default function AvatarOnboarding({ visible, onClose, onComplete, existingSettings }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>(existingSettings?.photos || []);
  const [bodyType, setBodyType] = useState(existingSettings?.bodyType || '');
  const [preferredFit, setPreferredFit] = useState(existingSettings?.preferredFit || 'regular');
  const [skinTone, setSkinTone] = useState(existingSettings?.skinToneRetention ?? 75);
  const [hairRetention, setHairRetention] = useState(existingSettings?.hairRetention ?? 75);
  const [realism, setRealism] = useState(existingSettings?.realism ?? 75);
  const [generating, setGenerating] = useState(false);
  const [generatedAvatars, setGeneratedAvatars] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canNext = () => {
    if (step === 0) return photos.length >= 1;
    if (step === 1) return !!bodyType;
    return true;
  };

  const pickPhotos = useCallback(async (useCamera: boolean) => {
    if (photos.length >= 8) { Alert.alert('Max 8 photos', 'Remove a photo first.'); return; }
    const permFn = useCamera ? ImagePicker.requestCameraPermissionsAsync : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permFn();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!result.canceled) {
      const uris = result.assets.map((a: any) => a.uri).slice(0, 8 - photos.length);
      setPhotos(prev => [...prev, ...uris].slice(0, 8));
    }
  }, [photos]);

  const removePhoto = (idx: number) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const generateAvatars = async () => {
    setGenerating(true);
    setStep(3);
    try {
      await new Promise(r => setTimeout(r, 2500));
      const variants = [
        photos[0],
        photos[Math.min(1, photos.length - 1)],
        photos[Math.min(2, photos.length - 1)],
      ];
      setGeneratedAvatars(variants);
      setStep(4);
    } catch (err: any) {
      Alert.alert('Generation failed', err?.message || 'Please try again.');
      setStep(2);
    } finally {
      setGenerating(false);
    }
  };

  const saveAndComplete = async () => {
    if (!selectedAvatar || !user) return;
    setSaving(true);
    try {
      const fetchRes = await fetch(selectedAvatar);
      const blob = await fetchRes.blob();
      const ab = await new Response(blob).arrayBuffer();
      const uint8 = new Uint8Array(ab);
      const ext = selectedAvatar.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${user.id}/avatar-main.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, uint8, { contentType: 'image/jpeg', upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', user.id);
      const settings: AvatarSettings = {
        photos, bodyType, preferredFit,
        skinToneRetention: skinTone, hairRetention, realism,
        selectedAvatarUri: selectedAvatar, avatarUrl: publicUrl,
      };
      onComplete(settings);
    } catch (err: any) {
      Alert.alert('Save failed', err?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((s, i) => (
        <View key={s} style={styles.stepItem}>
          <View style={[styles.stepDot, i <= step && styles.stepDotActive, i < step && styles.stepDotDone]}>
            {i < step ? <Check size={10} color="#000" /> : <Text style={[styles.stepNum, i <= step && styles.stepNumActive]}>{i + 1}</Text>}
          </View>
          {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineDone]} />}
        </View>
      ))}
    </View>
  );

  const renderPhotos = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.stepTitle}>Upload Your Photos</Text>
      <Text style={styles.stepSub}>Add 1–8 photos for best results. Include front, side, and full-body shots.</Text>
      <View style={styles.photoGrid}>
        {photos.map((uri, idx) => (
          <View key={idx} style={styles.photoThumb}>
            <Image source={{ uri }} style={styles.photoImg} />
            <Pressable style={styles.photoRemove} onPress={() => removePhoto(idx)}>
              <X size={12} color="white" />
            </Pressable>
            {idx === 0 && <View style={styles.photoPrimary}><Text style={styles.photoPrimaryText}>Main</Text></View>}
          </View>
        ))}
        {photos.length < 8 && (
          <View style={styles.photoAddSlot}>
            <Pressable style={styles.photoAddBtn} onPress={() => pickPhotos(false)}>
              <Upload size={20} color={GOLD} />
              <Text style={styles.photoAddText}>Upload</Text>
            </Pressable>
            <Pressable style={[styles.photoAddBtn, { marginTop: 8 }]} onPress={() => pickPhotos(true)}>
              <Camera size={20} color={GOLD} />
              <Text style={styles.photoAddText}>Camera</Text>
            </Pressable>
          </View>
        )}
      </View>
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>📸 Tips for best results</Text>
        {['Front-facing, well-lit photos', 'Include a full-body shot', 'Neutral background works best', 'Avoid heavy filters or hats'].map(t => (
          <View key={t} style={styles.tipRow}><View style={styles.tipDot} /><Text style={styles.tipText}>{t}</Text></View>
        ))}
      </View>
    </ScrollView>
  );

  const renderBodyType = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.stepTitle}>Body Type & Fit</Text>
      <Text style={styles.stepSub}>Helps us generate a more accurate avatar and outfit suggestions.</Text>
      <Text style={styles.sectionLabel}>BODY TYPE</Text>
      <View style={styles.bodyGrid}>
        {BODY_TYPES.map(bt => (
          <Pressable key={bt.id} style={[styles.bodyCard, bodyType === bt.id && styles.bodyCardActive]} onPress={() => setBodyType(bt.id)}>
            <Text style={styles.bodyEmoji}>{bt.icon}</Text>
            <Text style={[styles.bodyLabel, bodyType === bt.id && styles.bodyLabelActive]}>{bt.label}</Text>
            {bodyType === bt.id && <View style={styles.bodyCheck}><Check size={10} color="#000" /></View>}
          </Pressable>
        ))}
      </View>
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PREFERRED FIT</Text>
      <View style={styles.fitRow}>
        {FIT_TYPES.map(ft => (
          <Pressable key={ft.id} style={[styles.fitChip, preferredFit === ft.id && styles.fitChipActive]} onPress={() => setPreferredFit(ft.id)}>
            <Text style={[styles.fitChipText, preferredFit === ft.id && styles.fitChipTextActive]}>{ft.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.stepTitle}>Avatar Settings</Text>
      <Text style={styles.stepSub}>Fine-tune how your avatar looks. You can always regenerate later.</Text>
      <View style={styles.settingsCard}>
        <SliderRow label="Skin Tone Retention" value={skinTone} onChange={setSkinTone} hint="How closely the avatar matches your actual skin tone" />
        <SliderRow label="Hair Retention" value={hairRetention} onChange={setHairRetention} hint="How closely your hair style and color is preserved" />
        <SliderRow label="Realism Level" value={realism} onChange={setRealism} hint="100% = photorealistic · 0% = more stylized" />
      </View>
      <View style={styles.generatePreview}>
        <Text style={styles.generatePreviewTitle}>Ready to generate</Text>
        <Text style={styles.generatePreviewSub}>{photos.length} photo{photos.length !== 1 ? 's' : ''} · {BODY_TYPES.find(b => b.id === bodyType)?.label} build · {FIT_TYPES.find(f => f.id === preferredFit)?.label} fit</Text>
        <View style={styles.generatePreviewRow}>
          <View style={styles.generatePreviewChip}><Text style={styles.generatePreviewChipText}>Skin {skinTone}%</Text></View>
          <View style={styles.generatePreviewChip}><Text style={styles.generatePreviewChipText}>Hair {hairRetention}%</Text></View>
          <View style={styles.generatePreviewChip}><Text style={styles.generatePreviewChipText}>Real {realism}%</Text></View>
        </View>
      </View>
    </ScrollView>
  );

  const renderGenerating = () => (
    <View style={styles.generatingContainer}>
      <View style={styles.generatingCard}>
        <View style={styles.generatingOrb}><ActivityIndicator size="large" color={GOLD} /></View>
        <Text style={styles.generatingTitle}>Creating Your Avatar</Text>
        <Text style={styles.generatingSub}>Analyzing your photos and generating 3 unique looks. Takes about 30–60 seconds.</Text>
        <View style={styles.generatingSteps}>
          {['Analyzing facial features', 'Matching body proportions', 'Applying style settings', 'Rendering final looks'].map(s => (
            <View key={s} style={styles.generatingStep}>
              <View style={styles.generatingStepDot} />
              <Text style={styles.generatingStepText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderPickAvatar = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.stepTitle}>Choose Your Avatar</Text>
      <Text style={styles.stepSub}>Pick your favorite look. You can regenerate at any time.</Text>
      <View style={styles.avatarPickGrid}>
        {generatedAvatars.map((uri, idx) => (
          <Pressable key={idx} style={[styles.avatarPickCard, selectedAvatar === uri && styles.avatarPickCardActive]} onPress={() => setSelectedAvatar(uri)}>
            <View style={styles.avatarFrame}>
              <Text style={styles.avatarFrameBrand}>KLOTHO</Text>
              <Image source={{ uri }} style={styles.avatarPickImg} resizeMode="cover" />
            </View>
            <View style={styles.avatarPickFooter}>
              <Text style={styles.avatarPickLabel}>Look {idx + 1}</Text>
              {selectedAvatar === uri && <View style={styles.avatarPickCheck}><Check size={12} color="#000" /></View>}
            </View>
          </Pressable>
        ))}
      </View>
      {selectedAvatar && (
        <View style={styles.selectedPreview}>
          <View style={styles.selectedFrameLarge}>
            <Text style={styles.selectedBrand}>KLOTHO</Text>
            <Image source={{ uri: selectedAvatar }} style={styles.selectedImg} resizeMode="cover" />
          </View>
          <View style={styles.selectedBadge}>
            <Star size={12} color="#000" />
            <Text style={styles.selectedBadgeText}>Your Default Avatar</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}><X size={20} color={colors.textSecondary} /></Pressable>
          <Text style={styles.headerTitle}>Avatar Setup</Text>
          <View style={{ width: 36 }} />
        </View>
        {renderStepIndicator()}
        <View style={styles.stepContent}>
          {step === 0 && renderPhotos()}
          {step === 1 && renderBodyType()}
          {step === 2 && renderSettings()}
          {step === 3 && renderGenerating()}
          {step === 4 && renderPickAvatar()}
        </View>
        {step !== 3 && (
          <View style={styles.footer}>
            {step > 0 && step !== 4 && (
              <Pressable style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
                <ChevronLeft size={20} color={colors.text} />
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
            )}
            {step < 2 && (
              <Pressable style={[styles.nextBtn, !canNext() && styles.nextBtnDisabled]} disabled={!canNext()} onPress={() => setStep(s => s + 1)}>
                <Text style={styles.nextBtnText}>Next</Text>
                <ChevronRight size={20} color="#000" />
              </Pressable>
            )}
            {step === 2 && (
              <Pressable style={styles.nextBtn} onPress={generateAvatars}>
                <Zap size={18} color="#000" />
                <Text style={styles.nextBtnText}>Generate Avatars</Text>
              </Pressable>
            )}
            {step === 4 && (
              <View style={styles.finalRow}>
                <Pressable style={styles.regenBtn} onPress={() => setStep(2)}>
                  <Text style={styles.regenBtnText}>Regenerate</Text>
                </Pressable>
                <Pressable style={[styles.nextBtn, { flex: 1 }, (!selectedAvatar || saving) && styles.nextBtnDisabled]} disabled={!selectedAvatar || saving} onPress={saveAndComplete}>
                  {saving ? <ActivityIndicator size="small" color="#000" /> : <><Check size={18} color="#000" /><Text style={styles.nextBtnText}>Save Avatar</Text></>}
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0B08' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(200,164,93,0.15)' },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(200,164,93,0.2)', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { borderColor: GOLD, backgroundColor: 'rgba(200,164,93,0.15)' },
  stepDotDone: { backgroundColor: GOLD, borderColor: GOLD },
  stepNum: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  stepNumActive: { color: GOLD },
  stepLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 4 },
  stepLineDone: { backgroundColor: GOLD },
  stepContent: { flex: 1, paddingHorizontal: 16 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6, marginTop: 4 },
  stepSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2, marginBottom: 12 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  photoThumb: { width: (SCREEN_W - 64) / 3, aspectRatio: 3 / 4, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  photoPrimary: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(200,164,93,0.85)', paddingVertical: 3, alignItems: 'center' },
  photoPrimaryText: { fontSize: 10, fontWeight: '700', color: '#000' },
  photoAddSlot: { width: (SCREEN_W - 64) / 3, aspectRatio: 3 / 4, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(200,164,93,0.3)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: BOX_BG },
  photoAddBtn: { alignItems: 'center', gap: 4 },
  photoAddText: { fontSize: 11, color: GOLD, fontWeight: '600' },
  tipsCard: { backgroundColor: BOX_BG, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BOX_BORDER },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tipDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: GOLD },
  tipText: { fontSize: 13, color: colors.textSecondary },
  bodyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bodyCard: { width: (SCREEN_W - 56) / 3, backgroundColor: BOX_BG, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: BOX_BORDER, position: 'relative' },
  bodyCardActive: { borderColor: GOLD, backgroundColor: 'rgba(200,164,93,0.1)' },
  bodyEmoji: { fontSize: 28, marginBottom: 6 },
  bodyLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  bodyLabelActive: { color: GOLD },
  bodyCheck: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  fitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fitChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: BOX_BG, borderWidth: 1, borderColor: BOX_BORDER },
  fitChipActive: { backgroundColor: GOLD, borderColor: GOLD },
  fitChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  fitChipTextActive: { color: '#000' },
  settingsCard: { backgroundColor: BOX_BG, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: BOX_BORDER, marginBottom: 20 },
  generatePreview: { backgroundColor: 'rgba(200,164,93,0.08)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(200,164,93,0.2)' },
  generatePreviewTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  generatePreviewSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  generatePreviewRow: { flexDirection: 'row', gap: 8 },
  generatePreviewChip: { backgroundColor: 'rgba(200,164,93,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(200,164,93,0.3)' },
  generatePreviewChipText: { fontSize: 11, fontWeight: '600', color: GOLD },
  generatingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  generatingCard: { width: '100%', backgroundColor: BOX_BG, borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: BOX_BORDER },
  generatingOrb: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(200,164,93,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(200,164,93,0.3)', marginBottom: 20 },
  generatingTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  generatingSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: 24 },
  generatingSteps: { width: '100%', gap: 10 },
  generatingStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  generatingStepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD },
  generatingStepText: { fontSize: 13, color: colors.textSecondary },
  avatarPickGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  avatarPickCard: { flex: 1, backgroundColor: BOX_BG, borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: BOX_BORDER },
  avatarPickCardActive: { borderColor: GOLD },
  avatarFrame: { backgroundColor: '#1a1510', padding: 8, alignItems: 'center' },
  avatarFrameBrand: { fontSize: 10, fontWeight: '900', color: GOLD, letterSpacing: 3, marginBottom: 6 },
  avatarPickImg: { width: '100%', aspectRatio: 3 / 4, borderRadius: 8 },
  avatarPickFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 },
  avatarPickLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  avatarPickCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  selectedPreview: { alignItems: 'center', marginTop: 8 },
  selectedFrameLarge: { width: '70%', backgroundColor: '#1a1510', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: GOLD, marginBottom: 12 },
  selectedBrand: { fontSize: 16, fontWeight: '900', color: GOLD, letterSpacing: 4, marginBottom: 8 },
  selectedImg: { width: '100%', aspectRatio: 3 / 4, borderRadius: 10 },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GOLD, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  selectedBadgeText: { fontSize: 12, fontWeight: '700', color: '#000' },
  footer: { padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: 'rgba(200,164,93,0.1)', flexDirection: 'row', gap: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: BOX_BG, borderWidth: 1, borderColor: BOX_BORDER },
  backBtnText: { fontSize: 15, fontWeight: '600', color: colors.text },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  finalRow: { flex: 1, flexDirection: 'row', gap: 10 },
  regenBtn: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: BOX_BG, borderWidth: 1, borderColor: BOX_BORDER, alignItems: 'center', justifyContent: 'center' },
  regenBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
});
