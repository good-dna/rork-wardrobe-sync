import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  Pressable,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { colors, categoryColors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Category, Priority, WishlistItem } from '@/types/wardrobe';

export default function AddWishlistScreen() {
  const router = useRouter();
  const addWishlistItem = useWardrobeStore((state) => state.addWishlistItem);
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<Category>('shirts');
  const [color, setColor] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const categories: Category[] = ['shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'];
  const priorities: Priority[] = ['low', 'medium', 'high'];
  
  const handleClose = () => {
    router.back();
  };
  
  const handleSave = () => {
    if (!name || !brand || !category) {
      // Show validation error
      alert('Please fill in all required fields');
      return;
    }
    
    const newItem: WishlistItem = {
      id: Date.now().toString(),
      name,
      brand,
      category,
      color: color || 'Unknown',
      estimatedPrice: parseFloat(estimatedPrice) || 0,
      priority,
      url: url || undefined,
      notes: notes || undefined,
      imageUrl: imageUrl || undefined,
    };
    
    addWishlistItem(newItem);
    router.back();
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
        <View style={styles.formGroup}>
          <Text style={styles.label}>Item Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Cashmere Sweater"
            placeholderTextColor={colors.mediumGray}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brand *</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g. Everlane"
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
              placeholder="e.g. Navy"
              placeholderTextColor={colors.mediumGray}
            />
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Est. Price</Text>
            <TextInput
              style={styles.input}
              value={estimatedPrice}
              onChangeText={setEstimatedPrice}
              placeholder="0.00"
              placeholderTextColor={colors.mediumGray}
              keyboardType="numeric"
            />
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityContainer}>
            {priorities.map((p) => (
              <Pressable
                key={p}
                style={[
                  styles.priorityChip,
                  priority === p && styles.selectedPriorityChip,
                  priority === p && { 
                    backgroundColor: 
                      p === 'high' 
                        ? colors.error 
                        : p === 'medium' 
                          ? colors.warning 
                          : colors.info 
                  }
                ]}
                onPress={() => setPriority(p)}
              >
                <Text 
                  style={[
                    styles.priorityChipText,
                    priority === p && styles.selectedPriorityChipText
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Product URL</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://example.com/product"
            placeholderTextColor={colors.mediumGray}
            autoCapitalize="none"
            keyboardType="url"
          />
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
          <Text style={styles.label}>Image URL</Text>
          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://example.com/image.jpg"
            placeholderTextColor={colors.mediumGray}
            autoCapitalize="none"
            keyboardType="url"
          />
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
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedPriorityChip: {
    backgroundColor: colors.primary,
  },
  priorityChipText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedPriorityChipText: {
    color: 'white',
    fontWeight: '600',
  },
});