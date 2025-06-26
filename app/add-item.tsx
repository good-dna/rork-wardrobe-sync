import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  Pressable, 
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { X, Check, Image as ImageIcon } from 'lucide-react-native';
import { colors, categoryColors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Category, Season, CleaningStatus, Item } from '@/types/wardrobe';
import AIScanner from '@/components/AIScanner';

export default function AddItemScreen() {
  const router = useRouter();
  const addItem = useWardrobeStore((state) => state.addItem);
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<Category>('shirts');
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
  
  const categories: Category[] = ['shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'];
  const seasons: Season[] = ['spring', 'summer', 'fall', 'winter', 'all'];
  
  const handleClose = () => {
    router.back();
  };
  
  const handleSave = () => {
    if (!name || !brand || !category) {
      // Show validation error
      alert('Please fill in all required fields');
      return;
    }
    
    const newItem: Item = {
      id: Date.now().toString(),
      name,
      brand,
      category,
      color: color || 'Unknown',
      material: material || 'Unknown',
      season: selectedSeasons,
      purchaseDate,
      purchasePrice: parseFloat(purchasePrice) || 0,
      wearCount: 0,
      lastWorn: new Date().toISOString().split('T')[0],
      imageUrl: processedImage || imageUrl || 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1925&auto=format&fit=crop',
      notes,
      tags,
      cleaningStatus: 'clean' as CleaningStatus,
    };
    
    addItem(newItem);
    router.back();
  };
  
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  const toggleSeason = (season: Season) => {
    if (season === 'all') {
      setSelectedSeasons(['all']);
      return;
    }
    
    if (selectedSeasons.includes('all')) {
      setSelectedSeasons([season]);
      return;
    }
    
    if (selectedSeasons.includes(season)) {
      if (selectedSeasons.length === 1) {
        // Don't allow removing the last season
        return;
      }
      setSelectedSeasons(selectedSeasons.filter(s => s !== season));
    } else {
      setSelectedSeasons([...selectedSeasons, season]);
    }
  };
  
  const handleScanResult = (result: any) => {
    if (result.name) setName(result.name);
    if (result.brand) setBrand(result.brand);
    if (result.category) setCategory(result.category as Category);
    if (result.color) setColor(result.color);
    if (result.material) setMaterial(result.material);
    if (result.processedImageUri) setProcessedImage(result.processedImageUri);
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen 
        options={{
          headerLeft: () => (
            <Pressable onPress={handleClose} style={styles.headerButton}>
              <X size={24} color={colors.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleSave} style={styles.headerButton}>
              <Check size={24} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Pressable 
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
        >
          <Text style={styles.scanButtonText}>Scan Item with AI</Text>
        </Pressable>
        
        {showScanner && (
          <View style={styles.scannerContainer}>
            <AIScanner onScanResult={handleScanResult} />
          </View>
        )}
        
        {processedImage && (
          <View style={styles.processedImageContainer}>
            <Text style={styles.processedImageLabel}>Processed Image</Text>
            <Image 
              source={{ uri: processedImage }} 
              style={styles.processedImagePreview} 
              resizeMode="contain"
            />
            <View style={styles.processedImageInfo}>
              <ImageIcon size={16} color={colors.primary} />
              <Text style={styles.processedImageInfoText}>
                Background removed for a cleaner look
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. White Oxford Shirt"
            placeholderTextColor={colors.mediumGray}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brand *</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g. Uniqlo"
            placeholderTextColor={colors.mediumGray}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((cat) => (
              <Pressable
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && { backgroundColor: categoryColors[cat] || colors.lightGray }
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text 
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.selectedCategoryChipText
                  ]}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              value={color}
              onChangeText={setColor}
              placeholder="e.g. White"
              placeholderTextColor={colors.mediumGray}
            />
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Material</Text>
            <TextInput
              style={styles.input}
              value={material}
              onChangeText={setMaterial}
              placeholder="e.g. Cotton"
              placeholderTextColor={colors.mediumGray}
            />
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Season</Text>
          <View style={styles.seasonsContainer}>
            {seasons.map((season) => (
              <View key={season} style={styles.seasonRow}>
                <Text style={styles.seasonText}>
                  {season.charAt(0).toUpperCase() + season.slice(1)}
                </Text>
                <Switch
                  value={selectedSeasons.includes(season)}
                  onValueChange={() => toggleSeason(season)}
                  trackColor={{ false: colors.lightGray, true: colors.primary + '80' }}
                  thumbColor={selectedSeasons.includes(season) ? colors.primary : colors.mediumGray}
                />
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Purchase Date</Text>
            <TextInput
              style={styles.input}
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mediumGray}
            />
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="0.00"
              placeholderTextColor={colors.mediumGray}
              keyboardType="numeric"
            />
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional notes about this item..."
            placeholderTextColor={colors.mediumGray}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add a tag and press +"
              placeholderTextColor={colors.mediumGray}
              onSubmitEditing={handleAddTag}
            />
            <Pressable style={styles.addTagButton} onPress={handleAddTag}>
              <Text style={styles.addTagButtonText}>+</Text>
            </Pressable>
          </View>
          
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <Pressable 
                  style={styles.removeTagButton} 
                  onPress={() => handleRemoveTag(tag)}
                >
                  <X size={12} color={colors.subtext} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Image URL</Text>
          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://example.com/image.jpg"
            placeholderTextColor={colors.mediumGray}
          />
          <Text style={styles.helperText}>
            {processedImage ? "You can leave this empty to use the processed image." : "Leave empty to use a default image."}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scannerContainer: {
    marginBottom: 16,
  },
  processedImageContainer: {
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  processedImageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  processedImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: Platform.OS === 'web' ? 'rgba(240, 240, 240, 0.5)' : undefined, // Checkerboard pattern for web to show transparency
  },
  processedImageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  processedImageInfoText: {
    fontSize: 12,
    color: colors.subtext,
    marginLeft: 6,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  categoriesContainer: {
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedCategoryChipText: {
    fontWeight: '600',
  },
  seasonsContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
  },
  seasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  seasonText: {
    fontSize: 16,
    color: colors.text,
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: colors.text,
    marginRight: 4,
  },
  removeTagButton: {
    padding: 2,
  },
  helperText: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 4,
    marginLeft: 2,
  },
});