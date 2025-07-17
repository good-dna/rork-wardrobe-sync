import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { DollarSign, ExternalLink, Tag, Calendar } from 'lucide-react-native';
import { WishlistItem } from '@/types/wardrobe';
import { colors, categoryColors } from '@/constants/colors';
import * as Linking from 'expo-linking';

interface WishlistCardProps {
  item: WishlistItem;
}

export default function WishlistCard({ item }: WishlistCardProps) {
  const router = useRouter();
  
  const handlePress = () => {
    router.push(`/wishlist/${item.id}`);
  };
  
  const handleUrlPress = (e: any) => {
    e.stopPropagation();
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
    <Pressable 
      style={[styles.container, { borderColor: categoryColor }]} 
      onPress={handlePress}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: categoryColor }]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>
        </View>
        
        <Text style={styles.brand}>{item.brand}</Text>
        
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Tag size={12} color={colors.subtext} />
            <Text style={styles.detailText}>{item.category}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <DollarSign size={12} color={colors.subtext} />
            <Text style={styles.detailText}>${item.estimatedPrice.toFixed(2)}</Text>
          </View>
          
          {item.url && (
            <Pressable style={styles.linkButton} onPress={handleUrlPress}>
              <ExternalLink size={12} color={colors.primary} />
              <Text style={styles.linkText}>View Online</Text>
            </Pressable>
          )}
        </View>
        
        {item.notes && (
          <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  brand: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  details: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: colors.subtext,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  linkText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  notes: {
    fontSize: 12,
    color: colors.subtext,
    fontStyle: 'italic',
  },
});