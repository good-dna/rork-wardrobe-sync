import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { X, Check, Camera, Link, Scan, Sparkles, Wand2 } from 'lucide-react-native';
import { colors, categoryColors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Category, Priority, WishlistItem } from '@/types/wardrobe';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AIProductAnalysisService } from '@/services/aiProductAnalysisService';

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
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  
  const categories: Category[] = ['shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'];
  const priorities: Priority[] = ['low', 'medium', 'high'];
  
  const handleClose = () => {
    router.back();
  };
  
  const handleSave = () => {
    if (!name || !brand || !category) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
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

  const analyzeImageWithAI = async (imageBase64: string) => {
    setIsProcessing(true);
    try {
      const result = await AIProductAnalysisService.analyzeImageForProduct(imageBase64);
      
      if (result.success) {
        // Auto-fill form fields
        if (result.name) setName(result.name);
        if (result.brand) setBrand(result.brand);
        if (result.category) setCategory(result.category);
        if (result.color) setColor(result.color);
        if (result.estimatedPrice) setEstimatedPrice(result.estimatedPrice.toString());
        if (result.description) setNotes(result.description);
        
        Alert.alert('Success', 'Item information has been analyzed and filled in!');
      } else {
        Alert.alert('Error', result.error || 'Failed to analyze image');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeWebsiteUrl = async (websiteUrl: string) => {
    if (!websiteUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await AIProductAnalysisService.analyzeWebsiteForProduct(websiteUrl);
      
      if (result.success) {
        // Auto-fill form fields
        if (result.name) setName(result.name);
        if (result.brand) setBrand(result.brand);
        if (result.category) setCategory(result.category);
        if (result.color) setColor(result.color);
        if (result.estimatedPrice) setEstimatedPrice(result.estimatedPrice.toString());
        if (result.description) setNotes(result.description);
        
        Alert.alert('Success', 'Product information has been extracted and filled in!');
      } else {
        Alert.alert('Error', result.error || 'Failed to analyze website');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze website. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    }
    setShowCamera(true);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUrl(asset.uri);
      
      if (asset.base64) {
        await analyzeImageWithAI(`data:image/jpeg;base64,${asset.base64}`);
      }
    }
  };

  const handleCameraCapture = async (uri: string) => {
    setShowCamera(false);
    setImageUrl(uri);
    
    // Convert image to base64 for AI analysis
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        analyzeImageWithAI(base64data);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      Alert.alert('Error', 'Failed to process image for analysis.');
    }
  };

  const generateAIImage = async () => {
    if (!name || !brand || !category) {
      Alert.alert('Missing Information', 'Please fill in the item name, brand, and category first.');
      return;
    }

    setIsProcessing(true);
    try {
      const description = `${brand} ${name} ${category} ${color ? `in ${color}` : ''}`;
      const result = await AIProductAnalysisService.generateProductImage(description);
      
      if (result.success && result.imageUrl) {
        setImageUrl(result.imageUrl);
        Alert.alert('Success', 'AI-generated product image has been created!');
      } else {
        Alert.alert('Error', result.error || 'Failed to generate image');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
      
      {showCamera ? (
        <CameraView 
          style={styles.camera} 
          facing="back"
        >
          <View style={styles.cameraOverlay}>
            <Pressable 
              style={styles.cameraCloseButton} 
              onPress={() => setShowCamera(false)}
            >
              <X size={24} color="white" />
            </Pressable>
            <View style={styles.cameraControls}>
              <Pressable 
                style={styles.captureButton}
                onPress={async () => {
                  // Note: In a real implementation, you'd capture the photo here
                  // For now, we'll simulate with a placeholder
                  const mockUri = 'https://via.placeholder.com/300x300';
                  handleCameraCapture(mockUri);
                }}
              >
                <View style={styles.captureButtonInner} />
              </Pressable>
            </View>
          </View>
        </CameraView>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* AI Scan Section */}
        <View style={styles.scanSection}>
          <Text style={styles.sectionTitle}>Quick Add with AI</Text>
          <View style={styles.scanButtons}>
            <Pressable 
              style={[styles.scanButton, isProcessing && styles.scanButtonDisabled]} 
              onPress={handleTakePhoto}
              disabled={isProcessing}
            >
              <Camera size={20} color={colors.primary} />
              <Text style={styles.scanButtonText}>Take Photo</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.scanButton, isProcessing && styles.scanButtonDisabled]} 
              onPress={handlePickImage}
              disabled={isProcessing}
            >
              <Scan size={20} color={colors.primary} />
              <Text style={styles.scanButtonText}>Upload Image</Text>
            </Pressable>
          </View>
          
          <View style={styles.urlScanContainer}>
            <TextInput
              style={[styles.input, styles.urlInput]}
              value={url}
              onChangeText={setUrl}
              placeholder="Paste product URL for auto-fill"
              placeholderTextColor={colors.mediumGray}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Pressable 
              style={[styles.urlScanButton, isProcessing && styles.scanButtonDisabled]} 
              onPress={() => analyzeWebsiteUrl(url)}
              disabled={isProcessing || !url.trim()}
            >
              <Sparkles size={16} color={colors.primary} />
            </Pressable>
          </View>
          
          {isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.processingText}>Analyzing...</Text>
            </View>
          )}
        </View>

        {imageUrl && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: imageUrl }} style={styles.previewImage} />
            <Pressable 
              style={styles.generateImageButton} 
              onPress={generateAIImage}
              disabled={isProcessing}
            >
              <Wand2 size={16} color={colors.primary} />
              <Text style={styles.generateImageText}>Generate New</Text>
            </Pressable>
          </View>
        )}

        {!imageUrl && name && brand && category && (
          <View style={styles.generateImageContainer}>
            <Pressable 
              style={[styles.generateImageButton, styles.generateImageButtonLarge]} 
              onPress={generateAIImage}
              disabled={isProcessing}
            >
              <Wand2 size={20} color={colors.primary} />
              <Text style={styles.generateImageText}>Generate AI Image</Text>
            </Pressable>
          </View>
        )}

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
        
        </ScrollView>
      )}
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
  scanSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  scanButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  scanButtonDisabled: {
    opacity: 0.5,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  urlScanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urlInput: {
    flex: 1,
  },
  urlScanButton: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  processingText: {
    fontSize: 14,
    color: colors.subtext,
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  generateImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  generateImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    marginTop: 8,
  },
  generateImageButtonLarge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 0,
  },
  generateImageText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
});