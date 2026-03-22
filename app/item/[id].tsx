import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TextInput,
  Pressable, Switch, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { X, Check, Sparkles, Camera, Upload } from 'lucide-react-native';
import { colors, categoryColors, tokens } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Category, Season, CleaningStatus } from '@/types/wardrobe';
import Dropdown from '@/components/ui/Dropdown';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, updateItem } = useWardrobeStore();
  const item = items.find(i => i.id === id);

  const [name, setName] = useState(item?.name || '');
  const [brand, setBrand] = useState(item?.brand || '');
  const [category, setCategory] = useState<Category>(item?.category || 'shirts');
  const [color, setColor] = useState(item?.color || '');
  const [material, setMaterial] = useState(item?.material || '');
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>(item?.season || ['all']);
  const [purchaseDate, setPurchaseDate] = useState(item?.purchaseDate || '');
  const [purchasePrice, setPurchasePrice] = useState(item?.purchasePrice?.toString() || '');
  const [notes, setNotes] = useState(item?.notes || '');
  const [tags, setTags] = useState<string[]>(item?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [bgRemoved, setBgRemoved] = useState(false);

  const categories: Category[] = ['shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'];
  const seasons: Season[] = ['spring', 'summer', 'fall', 'winter', 'all'];
  const categoryOptions = categories.map(cat => ({
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: cat,
    color: categoryColors[cat],
  }));

  if (!item) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Item not found</Text>
      </View>
    );
  }

  const uploadImageToSupabase = async (localUri: string) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      let base64: string;
      if (typeof document !== 'undefined') {
        const response = await fetch(localUri);
        const blob = await response.blob();
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' as any });
      }
      const fileName = `item_${Date.now()}.png`;
      const { data, error } = await supabase.functions.invoke('process-wardrobe-image', {
        body: { imageBase64: base64, fileName, userId: user.id },
      });
      if (error) throw new Error(error.message);
      setImageUrl(data.bgRemovedUrl || data.imageUrl);
      setBgRemoved(data.bgRemoved);
    } catch (err: any) {
      console.error('Upload error:', err);
      setImageUrl(localUri);
    } finally {
      setUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access required.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (!result.canceled) await uploadImageToSupabase(result.assets[0].uri);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Photo library access required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (!result.canceled) await uploadImageToSupabase(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name || !brand) { Alert.alert('Error', 'Name and brand are required'); return; }
    const updates = {
      name, brand, category, color,
      material, season: selectedSeasons,
      purchaseDate, purchasePrice: parseFloat(purchasePrice) || 0,
      notes, tags, imageUrl,
    };
    updateItem(id, updates);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('wardrobe_items').update({
          name, brand, category, color,
          image_url: imageUrl,
          purchase_date: purchaseDate || null,
          purchase_price: parseFloat(purchasePrice) || null,
          notes: notes || null,
          tags: tags || null,
        }).eq('id', id).eq('user_id', user.id);
      }
    } catch (err) { console.warn('Failed to sync update:', err); }
    router.back();
  };

  const toggleSeason = (season: Season) => {
    if (season === 'all') { setSelectedSeasons(['all']); return; }
    if (selectedSeasons.includes('all')) { setSelectedSeasons([season]); return; }
    if (selectedSeasons.includes(season)) {
      if (selectedSeasons.length === 1) return;
      setSelectedSeasons(selectedSeasons.filter(s => s !== season));
    } else {
      setSelectedSeasons([...selectedSeasons, season]);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
      <Stack.Screen
        options={{
          title: 'Edit Item',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.headerButton}>
              <X size={24} color={colors.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleSave} style={styles.headerButton} disabled={uploading}>
              {uploading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Check size={24} color={colors.primary} />
              }
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

        {/* Image preview */}
        <View style={styles.imageContainer}>
          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.uploadingText}>Removing background...</Text>
            </View>
          ) : (
            <Image source={{ uri: imageUrl }} style={styles.imagePreview} resizeMode="contain" />
          )}
          {bgRemoved && (
            <View style={styles.bgRemovedBadge}>
              <Sparkles size={12} color={colors.background} />
              <Text style={styles.bgRemovedText}>Background Removed</Text>
            </View>
          )}
        </View>

        {/* Photo buttons */}
        <View style={styles.photoButtonRow}>
          <Pressable style={styles.photoBtn} onPress={handleTakePhoto}>
            <Camera size={18} color={colors.text} />
            <Text style={styles.photoBtnText}>Take Photo</Text>
          </Pressable>
          <Pressable style={styles.photoBtn} onPress={handlePickPhoto}>
            <Upload size={18} color={colors.text} />
            <Text style={styles.photoBtnText}>Upload Photo</Text>
          </Pressable>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.mediumGray} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Brand *</Text>
          <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholderTextColor={colors.mediumGray} />
        </View>

        <Dropdown
          label="Category *"
          options={categoryOptions}
          value={category}
          onSelect={(value) => setCategory(value as Category)}
          placeholder="Select a category"
        />

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Color</Text>
            <TextInput style={styles.input} value={color} onChangeText={setColor} placeholderTextColor={colors.mediumGray} />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Material</Text>
            <TextInput style={styles.input} value={material} onChangeText={setMaterial} placeholderTextColor={colors.mediumGray} />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Season</Text>
          <View style={styles.seasonsContainer}>
            {seasons.map((season) => (
              <View key={season} style={styles.seasonRow}>
                <Text style={styles.seasonText}>{season.charAt(0).toUpperCase() + season.slice(1)}</Text>
                <Switch
                  value={selectedSeasons.includes(season)}
                  onValueChange={() => toggleSeason(season)}
                  trackColor={{ false: colors.border, true: colors.primary + '40' }}
                  thumbColor={selectedSeasons.includes(season) ? colors.primary : colors.textTertiary}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Purchase Date</Text>
            <TextInput style={styles.input} value={purchaseDate} onChangeText={setPurchaseDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mediumGray} />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Price</Text>
            <TextInput style={styles.input} value={purchasePrice} onChangeText={setPurchasePrice} placeholder="0.00" placeholderTextColor={colors.mediumGray} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Add any notes..." placeholderTextColor={colors.mediumGray} multiline numberOfLines={4} textAlignVertical="top" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput style={styles.tagInput} value={tagInput} onChangeText={setTagInput} placeholder="Add a tag" placeholderTextColor={colors.mediumGray} onSubmitEditing={handleAddTag} />
            <Pressable style={styles.addTagButton} onPress={handleAddTag}>
              <Text style={styles.addTagButtonText}>+</Text>
            </Pressable>
          </View>
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <Pressable onPress={() => setTags(tags.filter(t => t !== tag))}>
                  <X size={12} color={colors.subtext} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, color: colors.textSecondary },
  headerButton: { padding: 8 },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  imageContainer: { marginBottom: 16, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  imagePreview: { width: '100%', height: 220, backgroundColor: colors.backgroundSecondary },
  uploadingContainer: { height: 180, alignItems: 'center', justifyContent: 'center', gap: 12 },
  uploadingText: { fontSize: 14, color: colors.textSecondary },
  bgRemovedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, margin: 10, borderRadius: 20, alignSelf: 'flex-start' },
  bgRemovedText: { fontSize: 12, fontWeight: '600', color: colors.background },
  photoButtonRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderRadius: 12, paddingVertical: 12, gap: 8, borderWidth: 1, borderColor: colors.border },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
  formGroup: { marginBottom: tokens.spacing.md },
  formRow: { flexDirection: 'row', marginBottom: tokens.spacing.md },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: tokens.spacing.xs },
  input: { backgroundColor: colors.card, borderRadius: tokens.radius.md, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 100, paddingTop: tokens.spacing.md, textAlignVertical: 'top' },
  seasonsContainer: { backgroundColor: colors.card, borderRadius: tokens.radius.md, padding: tokens.spacing.md, borderWidth: 1, borderColor: colors.border },
  seasonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: tokens.spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  seasonText: { fontSize: 16, color: colors.text },
  tagInputContainer: { flexDirection: 'row', marginBottom: 8 },
  tagInput: { flex: 1, backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.text, marginRight: 8 },
  addTagButton: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  addTagButtonText: { color: colors.background, fontSize: 20, fontWeight: '600' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  tagText: { fontSize: 14, color: colors.text, marginRight: 4 },
});
