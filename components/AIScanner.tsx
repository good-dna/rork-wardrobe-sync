import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, Image, Platform, Alert } from 'react-native';
import { Camera, Scan, X, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/colors';

interface AIResult {
  name?: string;
  brand?: string;
  category?: string;
  color?: string;
  material?: string;
  processedImageUri?: string;
}

interface AIScanner {
  onScanResult: (result: AIResult) => void;
}

export default function AIScanner({ onScanResult }: AIScanner) {
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState<boolean | null>(null);
  
  // Request permissions when component mounts
  useEffect(() => {
    (async () => {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraPermission.status === 'granted');
      
      // Request media library permissions
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasMediaLibraryPermission(mediaLibraryPermission.status === 'granted');
    })();
  }, []);
  
  const takePhoto = async () => {
    try {
      // Check if we have camera permission
      if (!hasCameraPermission) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            "Permission Required",
            "Camera access is needed to take photos of your items.",
            [{ text: "OK" }]
          );
          return;
        }
        setHasCameraPermission(true);
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
        processImage(result.assets[0].uri);
      }
    } catch (err) {
      setError('Failed to take photo. Please try again.');
      console.error(err);
    }
  };
  
  const pickImage = async () => {
    try {
      // Check if we have media library permission
      if (!hasMediaLibraryPermission) {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            "Permission Required",
            "Photo library access is needed to select images of your items.",
            [{ text: "OK" }]
          );
          return;
        }
        setHasMediaLibraryPermission(true);
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
        processImage(result.assets[0].uri);
      }
    } catch (err) {
      setError('Failed to pick image. Please try again.');
      console.error(err);
    }
  };
  
  const processImage = async (imageUri: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // First, analyze the image to identify the item
      await analyzeImage(imageUri);
      
      // Then, remove the background
      await removeBackground(imageUri);
      
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };
  
  const analyzeImage = async (imageUri: string) => {
    // Simulate AI analysis with a timeout
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Mock result
        const mockResult: AIResult = {
          name: 'Cotton T-Shirt',
          brand: 'Uniqlo',
          category: 'shirts',
          color: 'White',
          material: 'Cotton',
        };
        
        onScanResult(mockResult);
        resolve();
      }, 1500);
    });
  };
  
  const removeBackground = async (imageUri: string) => {
    setProcessingImage(true);
    
    try {
      // In a real implementation, you would:
      // 1. Convert the image to base64 or create a form with the image file
      // 2. Send to a background removal API like Remove.bg
      // 3. Receive the processed image and update the state
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll just use the original image
      // In production, this would be the URL or base64 of the processed image
      setProcessedImage(imageUri);
      
      // Update the scan result with the processed image
      onScanResult({
        processedImageUri: imageUri
      });
      
    } catch (err) {
      setError('Failed to remove background. Please try again.');
      console.error(err);
    } finally {
      setProcessingImage(false);
      setLoading(false);
    }
  };
  
  const resetScanner = () => {
    setImage(null);
    setProcessedImage(null);
    setError(null);
  };
  
  return (
    <View style={styles.container}>
      {image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: processedImage || image }} style={styles.preview} />
          <Pressable style={styles.closeButton} onPress={resetScanner}>
            <X size={20} color="white" />
          </Pressable>
          
          {(loading || processingImage) && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>
                {processingImage 
                  ? "Removing background..." 
                  : "Analyzing your item..."}
              </Text>
            </View>
          )}
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={() => processImage(image)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.optionsContainer}>
          <Pressable style={styles.option} onPress={takePhoto}>
            <View style={styles.iconContainer}>
              <Camera size={24} color={colors.primary} />
            </View>
            <Text style={styles.optionText}>Take Photo</Text>
          </Pressable>
          
          <Pressable style={styles.option} onPress={pickImage}>
            <View style={styles.iconContainer}>
              <Scan size={24} color={colors.primary} />
            </View>
            <Text style={styles.optionText}>Upload Image</Text>
          </Pressable>
        </View>
      )}
      
      {processedImage && (
        <View style={styles.processedInfoContainer}>
          <View style={styles.processedInfoHeader}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={styles.processedInfoTitle}>Background Removed</Text>
          </View>
          <Text style={styles.processedInfoText}>
            Your image has been processed with a transparent background for a cleaner look in your wardrobe.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  optionsContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + '20', // 20% opacity
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  previewContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4/3,
  },
  preview: {
    width: '100%',
    height: '100%',
    backgroundColor: Platform.OS === 'web' ? 'rgba(240, 240, 240, 0.5)' : undefined, // Checkerboard pattern for web to show transparency
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  processedInfoContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  processedInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  processedInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  processedInfoText: {
    fontSize: 12,
    color: colors.subtext,
    lineHeight: 18,
  },
});