import React from 'react';
import { StyleSheet, Text, View, Pressable, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Tag, Clock } from 'lucide-react-native';
import { Item } from '@/types/wardrobe';
import { colors, categoryColors } from '@/constants/colors';

interface ItemCardProps {
  item: Item;
  compact?: boolean;
}

export default function ItemCard({ item, compact = false }: ItemCardProps) {
  const router = useRouter();
  
  const handlePress = () => {
    router.push(`/item/${item.id}`);
  };
  
  const categoryColor = categoryColors[item.category] || colors.lightGray;
  
  if (compact) {
    return (
      <Pressable 
        style={[styles.compactContainer, { borderColor: categoryColor }]} 
        onPress={handlePress}
      >
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.compactImage} 
          resizeMode="cover"
        />
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.compactBrand} numberOfLines={1}>{item.brand}</Text>
        </View>
      </Pressable>
    );
  }
  
  return (
    <Pressable 
      style={[styles.container, { borderColor: categoryColor }]} 
      onPress={handlePress}
    >
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: categoryColor }]}>
            <Text style={styles.badgeText}>{item.category}</Text>
          </View>
        </View>
        
        <Text style={styles.brand}>{item.brand}</Text>
        
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Tag size={14} color={colors.subtext} />
            <Text style={styles.detailText}>{item.color}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={14} color={colors.subtext} />
            <Text style={styles.detailText}>Worn {item.wearCount} times</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={[styles.statusBadge, { 
            backgroundColor: item.cleaningStatus === 'clean' 
              ? colors.success 
              : item.cleaningStatus === 'dirty' 
                ? colors.warning 
                : colors.error
          }]}>
            <Text style={styles.statusText}>{item.cleaningStatus}</Text>
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
    borderLeftWidth: 4,
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
    backgroundColor: Platform.OS === 'web' ? 'rgba(240, 240, 240, 0.5)' : undefined, // Checkerboard pattern for web to show transparency
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
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
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  
  // Compact styles
  compactContainer: {
    width: 120,
    borderRadius: 12,
    marginRight: 12,
    borderLeftWidth: 3,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: Platform.OS === 'web' ? 'rgba(240, 240, 240, 0.5)' : undefined, // Checkerboard pattern for web to show transparency
  },
  compactInfo: {
    padding: 8,
  },
  compactName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  compactBrand: {
    fontSize: 10,
    color: colors.subtext,
  },
});