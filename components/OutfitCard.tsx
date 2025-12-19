import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import { OutfitSuggestion } from '@/types/wardrobe';
import { colors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';

interface OutfitCardProps {
  outfit: OutfitSuggestion;
}

export default function OutfitCard({ outfit }: OutfitCardProps) {
  const router = useRouter();
  const items = useWardrobeStore((state) => state.items);
  
  const handlePress = () => {
    router.push(`/outfit/${outfit.id}`);
  };
  
  // Get the actual items from the store based on IDs
  const outfitItems = items.filter(item => outfit.items.includes(item.id));
  
  return (
    <Pressable style={styles.container} onPress={handlePress}>
      {outfit.imageUrl ? (
        <Image source={{ uri: outfit.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.name}>{outfit.name}</Text>
        
        <View style={styles.detailRow}>
          <Calendar size={14} color={colors.subtext} />
          <Text style={styles.detailText}>
            {outfit.occasion.charAt(0).toUpperCase() + outfit.occasion.slice(1)} • {outfit.season.charAt(0).toUpperCase() + outfit.season.slice(1)}
          </Text>
        </View>
        
        <View style={styles.itemsContainer}>
          <Text style={styles.itemsLabel}>Items:</Text>
          <View style={styles.itemsList}>
            <Text style={styles.itemText} numberOfLines={1}>
              {outfitItems.slice(0, 3).map(item => item.name).join(', ')}
              {outfitItems.length > 3 ? ` +${outfitItems.length - 3} more` : ''}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: colors.subtext,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: colors.subtext,
    marginLeft: 6,
  },
  itemsContainer: {
    marginTop: 4,
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemText: {
    fontSize: 12,
    color: colors.subtext,
  },
});