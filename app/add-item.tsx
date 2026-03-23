import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TextInput,
  Pressable, Switch, KeyboardAvoidingView, Platform, Image, ActivityIndicator
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { X, Check, Image as ImageIcon, Sparkles, Camera, Upload } from 'lucide-react-native';
import { colors, categoryColors, tokens } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Category, Season, CleaningStatus, Item, Subcategory, SUBCATEGORIES } from '@/types/wardrobe';
import AIScanner from '@/components/AIScanner';
import Dropdown from '@/components/ui/Dropdown';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

export default function AddItemScreen() {
  const router = useRouter();
  const addItem = useWardrobeStore((state) => state.addItem);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<Category>('shirts');
  const [subcategory, setSubcategory] = useState<Subcategory | ''>('');
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>(['all']);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedBgRemovedUrl, setUploadedBgRemovedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bgRemoved, setBgRemoved] = useState(false);

  const categories: Category[] = ['shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'];
  const seasons: Season[] = ['spring', 'summer', 'fall', 'winter', 'all'];
  const categoryOptions = categories.map(cat => ({
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: cat,
    color: categoryColors[cat],
  }));

  const handleClose = () => router.back();

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

      const fileName = `item_${Date.now()}.jpg`;

      const { data, error } = await supabase.functions.invoke('process-wardrobe-image', {
        body: { imageBase64: base64, fileName, userId: user.id },
      });

      if (error) throw new Error(error.message);

      setUploadedImageUrl(data.imageUrl);
      setUploadedBgRemovedUrl(data.bgRemovedUrl);
      setBgRemoved(data.bgRemoved);
      setProcessedImage(data.bgRemovedUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setProcessedImage(localUri);
    } finally {
      setUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProcessedImage(result.assets[0].uri);
      await uploadImageToSupabase(result.assets[0].uri);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Photo library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProcessedImage(result.assets[0].uri);
      await uploadImageToSupabase(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || !brand || !category) {
      alert('Please fill in all required fields');
      return;
    }

    const finalImageUrl = uploadedBgRemovedUrl || uploadedImageUrl || processedImage || imageUrl ||
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1925&auto=format&fit=crop';

    const newItem: Item = {
      id: Date.now().toString(),
      name, brand, category,
      subcategory: subcategory || undefined,
      color: color || 'Unknown',
      material: material || 'Unknown',
      season: selectedSeasons,
      purchaseDate,
      purchasePrice: parseFloat(purchasePrice) || 0,
      wearCount: 0,
      lastWorn: new Date().toISOString().split('T')[0],
      imageUrl: finalImageUrl,
      notes, tags,
      cleaningStatus: 'clean' as CleaningStatus,
      wearHistory: [],
      washHistory: [],
    };

    addItem(newItem);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('wardrobe_items').insert({
          id: newItem.id,
          user_id: user.id,
          name: newItem.name,
          brand: newItem.brand,
          category: newItem.category,
          subcategory: subcategory || null,
          color: newItem.color,
          image_url: uploadedImageUrl || finalImageUrl,
          bg_removed_url: uploadedBgRemovedUrl || null,
          purchase_date: newItem.purchaseDate || null,
          purchase_price: newItem.purchasePrice || null,
          notes: newItem.notes || null,
          tags: newItem.tags || null,
          cleaning_status: newItem.cleaningStatus,
          source: 'manual',
        });
      }
    } catch (err) {
      console.warn('Failed to sync to database:', err);
    }

    router.back();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => setTags(tags.filter(t => t !== tag));

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

  const handleScanResult = async (result: any) => {
    if (result.name) setName(result.name);
    if (result.brand) setBrand(result.brand);
    if (result.category) setCategory(result.category as Category);
    if (result.color) setColor(result.color);
    if (result.material) setMaterial(result.material);
    if (result.processedImageUri) {
      setProcessedImage(result.processedImageUri);
      await uploadImageToSupabase(result.processedImageUri);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={handleClose} style={styles.headerButton}>
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

        {/* Photo buttons */}
        <View style={styles.photoButtonRow}>
          <Pressable style={styles.photoBtn} onPress={handleTakePhoto}>
            <Camera size={20} color={colors.text} />
            <Text style={styles.photoBtnText}>Take Photo</Text>
          </Pressable>
          <Pressable style={styles.photoBtn} onPress={handlePickPhoto}>
            <Upload size={20} color={colors.text} />
            <Text style={styles.photoBtnText}>Upload Photo</Text>
          </Pressable>
        </View>

        {/* AI Scanner */}
        <Pressable style={styles.scanButton} onPress={() => setShowScanner(!showScanner)}>
          <Sparkles size={18} color={colors.background} />
          <Text style={styles.scanButtonText}>Scan Item with AI</Text>
        </Pressable>

        {showScanner && (
          <View style={styles.scannerContainer}>
            <AIScanner onScanResult={handleScanResult} />
          </View>
        )}

        {/* Image preview */}
        {(processedImage || uploading) && (
          <View style={styles.imageContainer}>
            {uploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.uploadingText}>Removing background...</Text>
              </View>
            ) : (
              <>
                <Image source={{ uri: processedImage! }} style={styles.imagePreview} resizeMode="contain" />
                {bgRemoved && (
                  <View style={styles.bgRemovedBadge}>
                    <Sparkles size={12} color={colors.background} />
                    <Text style={styles.bgRemovedText}>Background Removed</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Form fields */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. White Oxford Shirt" placeholderTextColor={colors.mediumGray} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Brand *</Text>
          <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="e.g. Uniqlo" placeholderTextColor={colors.mediumGray} />
        </View>

        <Dropdown
          label="Category *"
          options={categoryOptions}
          value={category}
          onSelect={(value) => { setCategory(value as Category); setSubcategory(''); }}
          placeholder="Select a category"
        />

        {/* Subcategory chips */}
        {category && SUBCATEGORIES[category] && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Subcategory</Text>
            <View style={styles.subcategoryChips}>
              {SUBCATEGORIES[category].map((sub) => (
                <Pressable
                  key={sub.value}
                  style={[styles.subChip, subcategory === sub.value && styles.subChipActive]}
                  onPress={() => setSubcategory(subcategory === sub.value ? '' : sub.value)}
                >
                  <Text style={[styles.subChipText, subcategory === sub.value && styles.subChipTextActive]}>
                    {sub.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Color</Text>
            <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="e.g. White" placeholderTextColor={colors.mediumGray} />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Material</Text>
            <TextInput style={styles.input} value={material} onChangeText={setMaterial} placeholder="e.g. Cotton" placeholderTextColor={colors.mediumGray} />
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
            <TextInput style={styles.tagInput} value={tagInput} onChangeText={setTagInput} placeholder="Add a tag and press +" placeholderTextColor={colors.mediumGray} onSubmitEditing={handleAddTag} />
            <Pressable style={styles.addTagButton} onPress={handleAddTag}>
              <Text style={styles.addTagButtonText}>+</Text>
            </Pressable>
          </View>
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <Pressable onPress={() => handleRemoveTag(tag)}>
                  <X size={12} color={colors.subtext} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Image URL (optional)</Text>
          <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} placeholder="https://example.com/image.jpg" placeholderTextColor={colors.mediumGray} />
          <Text style={styles.helperText}>Or use camera/upload above — background is removed automatically</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerButton: { padding: 8 },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  photoButtonRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, borderRadius: 12, paddingVertical: 14,
    gap: 8, borderWidth: 1, borderColor: colors.border,
  },
  photoBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  scanButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12,
    marginBottom: 16, gap: 8,
  },
  scanButtonText: { color: colors.background, fontSize: 16, fontWeight: '600' },
  scannerContainer: { marginBottom: 16 },
  imageContainer: {
    marginBottom: 16, backgroundColor: colors.card, borderRadius: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
  },
  imagePreview: { width: '100%', height: 220, backgroundColor: colors.backgroundSecondary },
  uploadingContainer: { height: 180, alignItems: 'center', justifyContent: 'center', gap: 12 },
  uploadingText: { fontSize: 14, color: colors.textSecondary },
  bgRemovedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6,
    margin: 10, borderRadius: 20, alignSelf: 'flex-start',
  },
  bgRemovedText: { fontSize: 12, fontWeight: '600', color: colors.background },
  formGroup: { marginBottom: tokens.spacing.md },
  formRow: { flexDirection: 'row', marginBottom: tokens.spacing.md },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: tokens.spacing.xs },
  helperText: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  input: {
    backgroundColor: colors.card, borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm,
    fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  textArea: { minHeight: 100, paddingTop: tokens.spacing.md, textAlignVertical: 'top' },
  seasonsContainer: {
    backgroundColor: colors.card, borderRadius: tokens.radius.md,
    padding: tokens.spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  seasonRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: tokens.spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  seasonText: { fontSize: 16, color: colors.text },
  tagInputContainer: { flexDirection: 'row', marginBottom: 8 },
  tagInput: {
    flex: 1, backgroundColor: colors.card, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.text, marginRight: 8,
  },
  addTagButton: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  addTagButtonText: { color: colors.background, fontSize: 20, fontWeight: '600' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  subcategoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  subChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  subChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  subChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  subChipTextActive: { color: '#000', fontWeight: '700' },
});
