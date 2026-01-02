import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Star, Plus, X } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Category } from '@/types/wardrobe';
import ItemCard from '@/components/ItemCard';

const categories: { id: Category; label: string }[] = [
  { id: 'shirts', label: 'Tops' },
  { id: 'pants', label: 'Bottoms' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'jackets', label: 'Outerwear' },
  { id: 'accessories', label: 'Accessories' },
];

export default function WardrobeScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  
  const items = useWardrobeStore((state) => state.items);
  
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query) ||
          item.color.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [items, selectedCategory, searchQuery]);
  
  const handleAddItem = () => {
    router.push('/add-item');
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Closet</Text>
          <Text style={styles.subtitle}>{items.length} items in your collection</Text>
        </View>
        <Pressable style={styles.addButton} onPress={handleAddItem}>
          <Plus size={20} color={colors.background} />
        </Pressable>
      </View>
      
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch} style={styles.clearButton}>
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        
        <Pressable 
          style={[styles.favoriteButton, favoritesOnly && styles.favoriteButtonActive]}
          onPress={() => setFavoritesOnly(!favoritesOnly)}
        >
          <Star 
            size={18} 
            color={favoritesOnly ? colors.warning : colors.textSecondary}
            fill={favoritesOnly ? colors.warning : 'none'}
          />
        </Pressable>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        <Pressable
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryChipText,
            selectedCategory === 'all' && styles.categoryChipTextActive,
          ]}>
            All
          </Text>
        </Pressable>
        
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.categoryChipTextActive,
            ]}>
              {category.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      
      {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ItemCard item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {searchQuery 
              ? 'No items match your search' 
              : selectedCategory !== 'all'
                ? `No ${selectedCategory} in your closet yet`
                : 'Your closet is empty'
            }
          </Text>
          <Pressable style={styles.addFirstButton} onPress={handleAddItem}>
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addFirstButtonText}>Add Item</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadow.sm,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: tokens.spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  clearButton: {
    padding: 4,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoriteButtonActive: {
    backgroundColor: colors.warning + '20',
    borderColor: colors.warning,
  },
  categoriesScroll: {
    paddingHorizontal: tokens.spacing.lg,
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  categoryChip: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  categoryChipTextActive: {
    color: colors.background,
  },
  listContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: tokens.spacing.lg,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addFirstButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: tokens.spacing.sm,
  },
});
