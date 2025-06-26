import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Calendar, Trash2, Edit } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import ItemCard from '@/components/ItemCard';

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const outfits = useWardrobeStore((state) => state.outfits);
  const items = useWardrobeStore((state) => state.items);
  const deleteOutfit = useWardrobeStore((state) => state.deleteOutfit);
  
  const outfit = outfits.find((outfit) => outfit.id === id);
  
  if (!outfit) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Outfit not found</Text>
      </View>
    );
  }
  
  // Get the actual items from the store based on IDs
  const outfitItems = items.filter(item => outfit.items.includes(item.id));
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Outfit",
      "Are you sure you want to delete this outfit? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => {
            deleteOutfit(outfit.id);
            router.back();
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleEdit = () => {
    // In a real app, navigate to edit screen
    Alert.alert("Edit Outfit", "Edit functionality would be implemented here.");
  };
  
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          title: outfit.name,
          headerRight: () => (
            <Pressable onPress={handleEdit} style={styles.headerButton}>
              <Edit size={20} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      
      {outfit.imageUrl ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: outfit.imageUrl }} style={styles.image} />
        </View>
      ) : null}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{outfit.name}</Text>
          
          <View style={styles.occasionContainer}>
            <Calendar size={16} color={colors.subtext} style={styles.occasionIcon} />
            <Text style={styles.occasionText}>
              {outfit.occasion.charAt(0).toUpperCase() + outfit.occasion.slice(1)} • 
              {outfit.season.charAt(0).toUpperCase() + outfit.season.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.itemsContainer}>
          <Text style={styles.itemsTitle}>Items in this Outfit</Text>
          
          {outfitItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </View>
        
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={18} color={colors.error} />
          <Text style={styles.deleteButtonText}>Delete Outfit</Text>
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
    width: '100%',
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
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
    marginBottom: 8,
  },
  occasionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  occasionIcon: {
    marginRight: 6,
  },
  occasionText: {
    fontSize: 14,
    color: colors.subtext,
  },
  itemsContainer: {
    marginBottom: 24,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
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