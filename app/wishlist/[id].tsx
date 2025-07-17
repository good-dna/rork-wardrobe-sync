import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable, Alert, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { DollarSign, Trash2, Edit, ExternalLink, ShoppingBag, Check, Wand2, Sparkles } from 'lucide-react-native';
import { colors, categoryColors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { AIProductAnalysisService } from '@/services/aiProductAnalysisService';

export default function WishlistItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const wishlist = useWardrobeStore((state) => state.wishlist);
  const deleteWishlistItem = useWardrobeStore((state) => state.deleteWishlistItem);
  const updateWishlistItem = useWardrobeStore((state) => state.updateWishlistItem);
  const addItem = useWardrobeStore((state) => state.addItem);
  
  const item = wishlist.find((item) => item.id === id);
  
  if (!item) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Item not found</Text>
      </View>
    );
  }
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Wishlist Item",
      "Are you sure you want to delete this item from your wishlist?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => {
            deleteWishlistItem(item.id);
            router.back();
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleEdit = () => {
    // In a real app, navigate to edit screen
    Alert.alert("Edit Wishlist Item", "Edit functionality would be implemented here.");
  };

  const handleMarkAsPurchased = () => {
    Alert.alert(
      "Mark as Purchased",
      "This will add the item to your wardrobe and remove it from your wishlist.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Add to Wardrobe", 
          onPress: () => {
            // Convert wishlist item to wardrobe item
            const newWardrobeItem = {
              id: Date.now().toString(),
              name: item.name,
              brand: item.brand,
              category: item.category,
              color: item.color,
              material: 'Unknown',
              season: ['all' as const],
              purchaseDate: new Date().toISOString().split('T')[0],
              purchasePrice: item.estimatedPrice,
              wearCount: 0,
              lastWorn: '',
              imageUrl: item.imageUrl || '',
              notes: item.notes || '',
              tags: [],
              cleaningStatus: 'clean' as const,
              wearHistory: [],
              washHistory: []
            };
            
            addItem(newWardrobeItem);
            deleteWishlistItem(item.id);
            
            Alert.alert('Success', 'Item added to your wardrobe!', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          }
        }
      ]
    );
  };

  const generateAIImage = async () => {
    setIsGeneratingImage(true);
    try {
      const description = `${item.brand} ${item.name} ${item.category} ${item.color ? `in ${item.color}` : ''}`;
      const result = await AIProductAnalysisService.generateProductImage(description);
      
      if (result.success && result.imageUrl) {
        updateWishlistItem(item.id, { imageUrl: result.imageUrl });
        Alert.alert('Success', 'AI-generated product image has been created!');
      } else {
        Alert.alert('Error', result.error || 'Failed to generate image');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  const handleOpenUrl = () => {
    if (item.url) {
      Linking.openURL(item.url);
    }
  };
  
  const categoryColor = categoryColors[item.category] || colors.lightGray;
  const priorityColor = 
    item.priority === 'high' 
      ? colors.error 
      : item.priority === 'medium' 
        ? colors.warning 
        : colors.info;
  
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          title: item.name,
          headerRight: () => (
            <Pressable onPress={handleEdit} style={styles.headerButton}>
              <Edit size={20} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      
      {item.imageUrl ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
          <View 
            style={[
              styles.categoryBadge, 
              { backgroundColor: categoryColor }
            ]}
          >
            <Text style={styles.categoryText}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: categoryColor }]}>
          <ShoppingBag size={48} color="white" />
          <View 
            style={[
              styles.categoryBadge, 
              { backgroundColor: 'rgba(255, 255, 255, 0.8)' }
            ]}
          >
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
          </View>
        </View>
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.brand}>{item.brand}</Text>
          </View>
          
          <View 
            style={[
              styles.priorityBadge, 
              { backgroundColor: priorityColor }
            ]}
          >
            <Text style={styles.priorityText}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
            </Text>
          </View>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <DollarSign size={18} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Estimated Price</Text>
              <Text style={styles.detailValue}>${item.estimatedPrice.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
          {item.url && (
            <Pressable style={styles.urlButton} onPress={handleOpenUrl}>
              <ExternalLink size={16} color="white" />
              <Text style={styles.urlButtonText}>View Online</Text>
            </Pressable>
          )}
          
          <Pressable style={styles.purchaseButton} onPress={handleMarkAsPurchased}>
            <Check size={16} color="white" />
            <Text style={styles.purchaseButtonText}>Mark as Purchased</Text>
          </Pressable>
        </View>
        
        {!item.imageUrl && (
          <Pressable 
            style={[styles.generateImageButton, isGeneratingImage && styles.generateImageButtonDisabled]} 
            onPress={generateAIImage}
            disabled={isGeneratingImage}
          >
            {isGeneratingImage ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Wand2 size={16} color={colors.primary} />
            )}
            <Text style={styles.generateImageText}>
              {isGeneratingImage ? 'Generating...' : 'Generate AI Image'}
            </Text>
          </Pressable>
        )}
        </View>
        
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
        
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={18} color={colors.error} />
          <Text style={styles.deleteButtonText}>Remove from Wishlist</Text>
        </Pressable>
      </View>
    </ScrollView>
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
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  brand: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 12,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20', // 20% opacity
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  urlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  urlButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  purchaseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success || '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  purchaseButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  generateImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  generateImageButtonDisabled: {
    opacity: 0.5,
  },
  generateImageText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  notesContainer: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
    marginLeft: 8,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.subtext,
  },
});