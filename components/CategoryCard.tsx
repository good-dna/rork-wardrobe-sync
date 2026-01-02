import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Category } from '@/types/wardrobe';
import { colors, categoryColors } from '@/constants/colors';
import { Shirt, ShoppingBag, Umbrella, Watch, Droplets } from 'lucide-react-native';

interface CategoryCardProps {
  category: Category;
  count: number;
}

export default function CategoryCard({ category, count }: CategoryCardProps) {
  const router = useRouter();
  
  const handlePress = () => {
    router.push(`/category/${category}` as any);
  };
  
  const getCategoryIcon = () => {
    const iconColor = colors.text;
    const size = 28;
    
    switch (category) {
      case 'shirts':
        return <Shirt size={size} color={iconColor} />;
      case 'pants':
        return <ShoppingBag size={size} color={iconColor} />;
      case 'jackets':
        return <Umbrella size={size} color={iconColor} />;
      case 'shoes':
        return <ShoppingBag size={size} color={iconColor} />;
      case 'accessories':
        return <Watch size={size} color={iconColor} />;
      case 'fragrances':
        return <Droplets size={size} color={iconColor} />;
      default:
        return <Shirt size={size} color={iconColor} />;
    }
  };
  
  const categoryColor = categoryColors[category] || colors.lightGray;
  
  return (
    <Pressable 
      style={[styles.container, { backgroundColor: categoryColor }]} 
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        {getCategoryIcon()}
      </View>
      <Text style={styles.title}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
      <Text style={styles.count}>{count} items</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  count: {
    fontSize: 14,
    color: colors.subtext,
  },
});