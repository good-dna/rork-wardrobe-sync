import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Category } from '@/types/wardrobe';
import CategoryCard from '@/components/CategoryCard';
import ItemCard from '@/components/ItemCard';
import FilterBar from '@/components/FilterBar';
import EmptyState from '@/components/EmptyState';

export default function WardrobeScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'categories' | 'all'>('categories');
  
  const items = useWardrobeStore((state) => state.items);
  const filters = useWardrobeStore((state) => state.filters);
  const clearFilters = useWardrobeStore((state) => state.clearFilters);
  
  // Memoize the filtered items to prevent infinite loops
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Apply category filter
      if (filters.category && item.category !== filters.category) {
        return false;
      }
      
      // Apply season filter
      if (filters.season && !item.season.includes(filters.season)) {
        return false;
      }
      
      // Apply brand filter
      if (filters.brand && item.brand.toLowerCase() !== filters.brand.toLowerCase()) {
        return false;
      }
      
      // Apply color filter
      if (filters.color && !item.color.toLowerCase().includes(filters.color.toLowerCase())) {
        return false;
      }
      
      // Apply cleaning status filter
      if (filters.cleaningStatus && item.cleaningStatus !== filters.cleaningStatus) {
        return false;
      }
      
      // Apply search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query) ||
          item.color.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [items, filters]);
  
  const handleAddItem = useCallback(() => {
    router.push('/add-item');
  }, [router]);
  
  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);
  
  // Count items by category - memoized to prevent recalculation on every render
  const categoryCounts = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<Category, number>);
  }, [items]);
  
  const categories: Category[] = ['shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'];
  
  const renderEmptyState = () => (
    <EmptyState
      title="Your wardrobe is empty"
      message="Start adding your clothing items to build your digital wardrobe."
      actionLabel="Add First Item"
      onAction={handleAddItem}
    />
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
        <Pressable style={styles.addButton} onPress={handleAddItem}>
          <Plus size={20} color="white" />
        </Pressable>
      </View>
      
      {items.length > 0 ? (
        <>
          <View style={styles.viewToggle}>
            <Pressable
              style={[
                styles.toggleButton,
                viewMode === 'categories' && styles.activeToggleButton
              ]}
              onPress={() => setViewMode('categories')}
            >
              <Text 
                style={[
                  styles.toggleButtonText,
                  viewMode === 'categories' && styles.activeToggleButtonText
                ]}
              >
                Categories
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.toggleButton,
                viewMode === 'all' && styles.activeToggleButton
              ]}
              onPress={() => setViewMode('all')}
            >
              <Text 
                style={[
                  styles.toggleButtonText,
                  viewMode === 'all' && styles.activeToggleButtonText
                ]}
              >
                All Items
              </Text>
            </Pressable>
          </View>
          
          {viewMode === 'categories' ? (
            <ScrollView 
              style={styles.content}
              contentContainerStyle={styles.categoriesContainer}
              showsVerticalScrollIndicator={false}
            >
              {categories.map((category) => (
                <CategoryCard 
                  key={category} 
                  category={category} 
                  count={categoryCounts[category] || 0} 
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.listContainer}>
              <FilterBar />
              
              {filteredItems.length > 0 ? (
                <FlatList
                  data={filteredItems}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <ItemCard item={item} />}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                />
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No items match your filters</Text>
                  <Pressable 
                    style={styles.clearFiltersButton}
                    onPress={handleClearFilters}
                  >
                    <Text style={styles.clearFiltersText}>Clear Filters</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </>
      ) : (
        renderEmptyState()
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeToggleButton: {
    backgroundColor: colors.background,
  },
  toggleButtonText: {
    fontSize: 14,
    color: colors.subtext,
  },
  activeToggleButtonText: {
    color: colors.text,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  categoriesContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noResultsText: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 12,
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});