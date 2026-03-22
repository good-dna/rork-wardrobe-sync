import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { Camera, Scan, X, Sparkles, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { colors, tokens } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

interface AIResult {
  name?: string;
  brand?: string;
  category?: string;
  color?: string;
  material?: string;
  processedImageUri?: string;
}

interface AIScannerProps {
  onScanResult: (result: AIResult) => void;
}

export default function AIScanner({ onScanResult }: AIScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const analyzeWithClaude = async (imageUri: string) => {
    setLoading(true);
    setError(null);
    try {
      const base64 = await getBase64(imageUri);
      const mediaType = base64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';

      const { data, error: fnError } = await supabase.functions.invoke('scan-clothing-item', {
        body: { imageBase64: base64, mediaType },
      });

      if (fnError) throw new Error(fnError.message);

      const scanResult: AIResult = {
        name: data.name || '',
        brand: data.brand || '',
        category: data.category || 'shirts',
        color: data.color || '',
        material: data.material || '',
        processedImageUri: imageUri,
      };

      setResult(scanResult);
      onScanResult(scanResult);
    } catch (err: any) {
      console.error('Scan error:', err);
      setError('Could not analyze image. Try a clearer photo of the tag or label.');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Camera access is needed to scan items.'); return; }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!res.canceled) { setImage(res.assets[0].uri); analyzeWithClaude(res.assets[0].uri); }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Photo library access is needed.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!res.canceled) { setImage(res.assets[0].uri); analyzeWithClaude(res.assets[0].uri); }
  };

  const reset = () => { setImage(null); setResult(null); setError(null); };

  return (
    <View style={styles.container}>
      {!image ? (
        <>
          <Text style={styles.hint}>📸 Point camera at clothing tag, label, or receipt to auto-fill item details</Text>
          <View style={styles.options}>
            <Pressable style={styles.option} onPress={takePhoto}>
              <View style={styles.iconBox}><Camera size={24} color={colors.primary} /></View>
              <Text style={styles.optionText}>Scan Tag</Text>
            </Pressable>
            <Pressable style={styles.option} onPress={pickImage}>
              <View style={styles.iconBox}><Scan size={24} color={colors.primary} /></View>
              <Text style={styles.optionText}>Upload Image</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />
          <Pressable style={styles.resetBtn} onPress={reset}>
            <X size={16} color={colors.text} />
          </Pressable>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Claude is reading the label...</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryBtn} onPress={() => analyzeWithClaude(image)}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          )}
          {result && !loading && (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <Sparkles size={16} color={colors.primary} />
                <Text style={styles.resultTitle}>Auto-filled from scan</Text>
                <Check size={16} color={colors.primary} />
              </View>
              {[
                { label: 'Name', value: result.name },
                { label: 'Brand', value: result.brand },
                { label: 'Category', value: result.category },
                { label: 'Color', value: result.color },
                { label: 'Material', value: result.material },
              ].filter(f => f.value).map(({ label, value }) => (
                <View key={label} style={styles.resultRow}>
                  <Text style={styles.resultLabel}>{label}:</Text>
                  <Text style={styles.resultValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  hint: { fontSize: 13, color: colors.textSecondary, padding: 16, textAlign: 'center', lineHeight: 18 },
  options: { flexDirection: 'row', padding: 16, gap: 12 },
  option: { flex: 1, alignItems: 'center', gap: 8, backgroundColor: colors.backgroundSecondary, borderRadius: tokens.radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontSize: 13, fontWeight: '600', color: colors.text },
  previewContainer: { position: 'relative' },
  preview: { width: '100%', height: 200 },
  resetBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  errorBox: { padding: 12, gap: 8 },
  errorText: { fontSize: 13, color: colors.error || '#ef4444' },
  retryBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary, borderRadius: 8 },
  retryText: { fontSize: 13, color: colors.background, fontWeight: '600' },
  resultBox: { padding: 12, backgroundColor: colors.primaryLight, borderTopWidth: 1, borderTopColor: colors.border },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  resultTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.primary },
  resultRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  resultLabel: { fontSize: 13, color: colors.textSecondary, width: 70 },
  resultValue: { fontSize: 13, color: colors.text, fontWeight: '600', flex: 1 },
});
