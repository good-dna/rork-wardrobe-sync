import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Image, ActivityIndicator, Alert, ImageBackground, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, Upload, X, Zap, CheckCircle, AlertCircle, Info } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, tokens } from '@/constants/colors';

const { width: W } = Dimensions.get('window');
const AVATAR_SETTINGS_KEY = 'klotho_avatar_settings_v2';
const GOLD = '#C8A45D';
const GOLD_DIM = 'rgba(200,164,93,0.25)';
const GOLD_GLOW = 'rgba(200,164,93,0.08)';
const DARK = 'rgba(14,11,7,0.92)';
const THUMB_SIZE = (W - 48 - 16) / 3;

const PHOTO_TIPS = [
  { icon: '☀️', title: 'Good lighting', desc: 'Natural light or bright indoor — avoid harsh shadows' },
  { icon: '🧍', title: 'Full body', desc: 'At least one photo showing head to toe' },
  { icon: '📐', title: 'Face the camera', desc: 'Front-facing, relaxed neutral expression' },
  { icon: '🚫', title: 'No heavy filters', desc: 'Unedited or lightly edited only' },
  { icon: '👕', title: 'Fitted clothing', desc: 'Shows your body shape best' },
  { icon: '🖼️', title: 'Plain background', desc: 'Minimal clutter behind you' },
];

export default function AvatarOnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tipExpanded, setTipExpanded] = useState(false);

  // Request permissions upfront on screen load
  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const canGenerate = photos.length >= 3;
  const photoCount = photos.length;
  const maxPhotos = 8;

  const pickPhotos = useCallback(async (useCamera) => {
    if (photos.length >= maxPhotos) { Alert.alert('Max reached', 'Remove a photo to add more.'); return; }
    const permFn = useCamera ? ImagePicker.requestCameraPermissionsAsync : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permFn();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access in settings.'); return; }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, selectionLimit: maxPhotos - photos.length });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setPhotos(prev => [...prev, ...uris].slice(0, maxPhotos));
    }
  }, [photos]);

  const removePhoto = (idx) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const handleGenerate = async () => {
    if (!user) { Alert.alert('Not signed in'); return; }
    if (photos.length < 3) { Alert.alert('Need more photos', 'Upload at least 3 photos.'); return; }
    setUploading(true);
    setUploadProgress(0);
    try {
      const photoBase64s = [];
      const referenceUrls = [];
      for (let i = 0; i < photos.length; i++) {
        setUploadProgress(Math.round((i / photos.length) * 40));
        const uri = photos[i];
        const fetchRes = await fetch(uri);
        const blob = await fetchRes.blob();
        const ab = await new Response(blob).arrayBuffer();
        const uint8 = new Uint8Array(ab);
        let binary = '';
        uint8.forEach(b => { binary += String.fromCharCode(b); });
        const b64 = btoa(binary);
        photoBase64s.push(b64);
        const isPng = uri.toLowerCase().endsWith('.png');
        const ext = isPng ? 'png' : 'jpg';
        const mediaType = isPng ? 'image/png' : 'image/jpeg';
        const path = `${user.id}/references/ref_${i}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, uint8, { contentType: mediaType, upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          referenceUrls.push(urlData.publicUrl);
          await supabase.from('avatar_reference_images').insert({ user_id: user.id, storage_path: path, public_url: urlData.publicUrl, file_name: `ref_${i}.${ext}`, is_primary: i === 0, status: 'uploaded' });
        }
      }
      setUploadProgress(50);
      await supabase.from('avatar_profiles').upsert({ user_id: user.id, reference_photo_urls: referenceUrls, generation_status: 'processing', updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      setUploadProgress(60);
      const { data, error } = await supabase.functions.invoke('avatar-generate-v2', {
        body: { userId: user.id, photos: photoBase64s, bodyType: '', preferredFit: 'regular', skinToneRetention: 75, hairRetention: 75, realism: 75 },
      });
      setUploadProgress(95);
      if (error) throw new Error(error.message);
      if (!data?.generatedUrls?.length) throw new Error('No avatars generated');
      const settings = { photos, bodyType: '', preferredFit: 'regular', skinToneRetention: 75, hairRetention: 75, realism: 75, selectedAvatarUri: data.generatedUrls[0], avatarUrl: data.generatedUrls[0] };
      await AsyncStorage.setItem(AVATAR_SETTINGS_KEY, JSON.stringify(settings));
      setUploadProgress(100);
      router.replace({ pathname: '/avatar-select', params: { avatarUrls: JSON.stringify(data.generatedUrls) } });
    } catch (err) {
      console.error('Avatar generation error:', err);
      Alert.alert('Generation failed', err?.message || 'Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <ImageBackground source={require('../assets/images/closet-backdrop.png')} style={{ flex: 1 }} resizeMode="cover">
      <View style={s.overlay} />
      <SafeAreaView style={s.container} edges={['top', 'bottom']}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <Text style={s.logoText}>KLOTHO</Text>
            <Text style={s.title}>Create Your Avatar</Text>
            <Text style={s.subtitle}>Upload 3-8 clear photos so Klotho can create a{'\n'}realistic avatar that looks just like you.</Text>
          </View>
          <View style={s.progressSection}>
            <View style={s.progressRow}>
              <Text style={s.progressLabel}>{photoCount} of {maxPhotos} photos</Text>
              <Text style={[s.progressLabel, { color: canGenerate ? GOLD : colors.textSecondary }]}>{canGenerate ? 'Ready to generate' : `Need ${3 - photoCount} more`}</Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${(photoCount / maxPhotos) * 100}%` }]} />
              <View style={[s.progressMin, { left: `${(3 / maxPhotos) * 100}%` }]} />
            </View>
          </View>
          <View style={s.gridSection}>
            <View style={s.grid}>
              {photos.map((uri, idx) => (
                <View key={idx} style={s.thumb}>
                  <Image source={{ uri }} style={s.thumbImg} />
                  {idx === 0 && <View style={s.primaryBadge}><Text style={s.primaryBadgeText}>MAIN</Text></View>}
                  <Pressable style={s.removeBtn} onPress={() => removePhoto(idx)}><X size={10} color="white" /></Pressable>
                  <View style={s.thumbNum}><Text style={s.thumbNumText}>{idx + 1}</Text></View>
                </View>
              ))}
              {photos.length < maxPhotos && Array.from({ length: Math.min(2, maxPhotos - photos.length) }).map((_, i) => (
                <View key={`e${i}`} style={s.thumbEmpty}><Text style={s.thumbEmptyNum}>{photos.length + i + 1}</Text></View>
              ))}
            </View>
            {photos.length < maxPhotos && (
              <View style={s.uploadRow}>
                <Pressable style={s.uploadBtn} onPress={() => pickPhotos(false)}><Upload size={20} color={GOLD} /><Text style={s.uploadBtnText}>Upload Photos</Text></Pressable>
                <Pressable style={[s.uploadBtn, s.uploadBtnSecondary]} onPress={() => pickPhotos(true)}><Camera size={20} color={colors.textSecondary} /><Text style={[s.uploadBtnText, { color: colors.textSecondary }]}>Take Photo</Text></Pressable>
              </View>
            )}
          </View>
          <Pressable style={s.tipsHeader} onPress={() => setTipExpanded(!tipExpanded)}>
            <View style={s.tipsHeaderLeft}><Info size={16} color={GOLD} /><Text style={s.tipsHeaderText}>Photo tips for best results</Text></View>
            <Text style={s.tipsChevron}>{tipExpanded ? '▲' : '▼'}</Text>
          </Pressable>
          {tipExpanded && (
            <View style={s.tipsGrid}>
              {PHOTO_TIPS.map((tip, i) => (
                <View key={i} style={s.tipCard}>
                  <Text style={s.tipIcon}>{tip.icon}</Text>
                  <View style={s.tipBody}><Text style={s.tipTitle}>{tip.title}</Text><Text style={s.tipDesc}>{tip.desc}</Text></View>
                </View>
              ))}
            </View>
          )}
          <View style={s.checklist}>
            {[{ label: 'At least 3 photos uploaded', done: photoCount >= 3 }, { label: 'Includes a full-body shot', done: photoCount >= 2 }, { label: 'Face clearly visible', done: photoCount >= 1 }].map((item, i) => (
              <View key={i} style={s.checkRow}>
                {item.done ? <CheckCircle size={16} color={GOLD} /> : <AlertCircle size={16} color={colors.textSecondary} />}
                <Text style={[s.checkLabel, item.done && s.checkLabelDone]}>{item.label}</Text>
              </View>
            ))}
          </View>
          {uploading && (
            <View style={s.uploadingCard}>
              <ActivityIndicator size="small" color={GOLD} />
              <View style={s.uploadingInfo}>
                <Text style={s.uploadingTitle}>{uploadProgress < 50 ? 'Uploading photos...' : uploadProgress < 80 ? 'Analyzing photos...' : 'Generating avatar...'}</Text>
                <Text style={s.uploadingPct}>{uploadProgress}%</Text>
              </View>
              <View style={s.uploadingBar}><View style={[s.uploadingFill, { width: `${uploadProgress}%` }]} /></View>
            </View>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
        <View style={s.footer}>
          <Pressable style={[s.generateBtn, (!canGenerate || uploading) && s.generateBtnDisabled]} onPress={handleGenerate} disabled={!canGenerate || uploading}>
            {uploading ? <ActivityIndicator size="small" color="#000" /> : <><Zap size={20} color="#000" /><Text style={s.generateBtnText}>{canGenerate ? 'Generate My Avatar' : `Upload ${3 - photoCount} more photo${3 - photoCount !== 1 ? 's' : ''}`}</Text></>}
          </Pressable>
          <Text style={s.footerNote}>Your photos are processed securely and never shared.</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,6,3,0.55)' },
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  logoText: { fontSize: 13, fontWeight: '900', color: GOLD, letterSpacing: 6, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 21 },
  progressSection: { marginBottom: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, position: 'relative' },
  progressFill: { height: '100%', backgroundColor: GOLD, borderRadius: 2 },
  progressMin: { position: 'absolute', top: -2, width: 2, height: 8, backgroundColor: 'rgba(200,164,93,0.5)', borderRadius: 1 },
  gridSection: { marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE * 4 / 3, borderRadius: 12, overflow: 'hidden', position: 'relative', borderWidth: 1.5, borderColor: GOLD_DIM },
  thumbImg: { width: '100%', height: '100%' },
  primaryBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: GOLD, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  primaryBadgeText: { fontSize: 8, fontWeight: '900', color: '#000', letterSpacing: 1 },
  removeBtn: { position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  thumbNum: { position: 'absolute', bottom: 5, right: 5, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  thumbNumText: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  thumbEmpty: { width: THUMB_SIZE, height: THUMB_SIZE * 4 / 3, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  thumbEmptyNum: { fontSize: 16, color: 'rgba(255,255,255,0.15)', fontWeight: '700' },
  uploadRow: { flexDirection: 'row', gap: 10 },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GOLD_GLOW, borderRadius: 12, paddingVertical: 14, borderWidth: 1.5, borderColor: GOLD_DIM },
  uploadBtnSecondary: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' },
  uploadBtnText: { fontSize: 14, fontWeight: '600', color: GOLD },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: DARK, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: GOLD_DIM },
  tipsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipsHeaderText: { fontSize: 13, fontWeight: '600', color: colors.text },
  tipsChevron: { fontSize: 10, color: colors.textSecondary },
  tipsGrid: { gap: 8, marginBottom: 16 },
  tipCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: DARK, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tipIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  tipBody: { flex: 1 },
  tipTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
  tipDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  checklist: { backgroundColor: DARK, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: GOLD_DIM, gap: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkLabel: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  checkLabelDone: { color: colors.text },
  uploadingCard: { backgroundColor: DARK, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: GOLD_DIM, gap: 10 },
  uploadingInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  uploadingTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  uploadingPct: { fontSize: 13, fontWeight: '700', color: GOLD },
  uploadingBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  uploadingFill: { height: '100%', backgroundColor: GOLD, borderRadius: 2 },
  footer: { paddingHorizontal: 20, paddingBottom: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(200,164,93,0.1)' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: GOLD, borderRadius: 16, paddingVertical: 16 },
  generateBtnDisabled: { opacity: 0.4 },
  generateBtnText: { fontSize: 16, fontWeight: '800', color: '#000', letterSpacing: 0.3 },
  footerNote: { fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 8 },
});
