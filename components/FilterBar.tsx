import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput } from 'react-native';
import { Search, X, Filter } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { WardrobeFilters, Category, Season, CleaningStatus } from '@/types/wardrobe';
import { useWardrobeStore } from '@/store/wardrobeStore';

export default function FilterBar() {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filters = useWardrobeStore((state) => state.filters);
  const setFilters = useWardrobeStore((state) => state.setFilters);
  const clearFilters = useWardrobeStore((state) => state.clearFilters);
  
  const categories: Category[] = ['shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'];
  const seasons: Season[] = ['spring', 'summer', 'fall', 'winter', 'all'];
  const cleaningStatuses: CleaningStatus[] = ['clean', 'dirty', 'needs repair'];
  
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setFilters({ ...filters, searchQuery: text });
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setFilters({ ...filters, searchQuery: undefined });
  };
  
  const handleFilterSelect = (filterType: keyof WardrobeFilters, value: any) => {
    if (filters[filterType] === value) {
      // If the same value is selected, clear it
      const newFilters = { ...filters };
      delete newFilters[filterType];
      setFilters(newFilters);
    } else {
      // Otherwise set the new value
      setFilters({ ...filters, [filterType]: value });
    }
  };
  
  const handleClearFilters = () => {
    clearFilters();
    setSearchQuery('');
  };
  
  const activeFilterCount = Object.keys(filters).filter(key => key !== 'searchQuery').length;
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={18} color={colors.subtext} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your wardrobe..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={colors.mediumGray}
        />
        {searchQuery ? (
          <Pressable onPress={handleClearSearch} style={styles.clearButton}>
            <X size={18} color={colors.subtext} />
          </Pressable>
        ) : null}
        <Pressable 
          onPress={() => setShowFilters(!showFilters)} 
          style={[styles.filterButton, activeFilterCount > 0 && styles.activeFilterButton]}
        >
          <Filter size={18} color={activeFilterCount > 0 ? colors.primary : colors.subtext} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
      
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <Pressable
                  key={category}
                  style={[
                    styles.filterChip,
                    filters.category === category && styles.activeFilterChip
                  ]}
                  onPress={() => handleFilterSelect('category', category)}
                >
                  <Text 
                    style={[
                      styles.filterChipText,
                      filters.category === category && styles.activeFilterChipText
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Season</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {seasons.map((season) => (
                <Pressable
                  key={season}
                  style={[
                    styles.filterChip,
                    filters.season === season && styles.activeFilterChip
                  ]}
                  onPress={() => handleFilterSelect('season', season)}
                >
                  <Text 
                    style={[
                      styles.filterChipText,
                      filters.season === season && styles.activeFilterChipText
                    ]}
                  >
                    {season}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cleaningStatuses.map((status) => (
                <Pressable
                  key={status}
                  style={[
                    styles.filterChip,
                    filters.cleaningStatus === status && styles.activeFilterChip
                  ]}
                  onPress={() => handleFilterSelect('cleaningStatus', status)}
                >
                  <Text 
                    style={[
                      styles.filterChipText,
                      filters.cleaningStatus === status && styles.activeFilterChipText
                    ]}
                  >
                    {status}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          
          <Pressable style={styles.clearFiltersButton} onPress={handleClearFilters}>
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: colors.text,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 8,
  },
  activeFilterButton: {
    backgroundColor: colors.primary + '20', // 20% opacity
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filtersContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginTop: 8,
    padding: 12,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: colors.lightGray,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.text,
  },
  activeFilterChipText: {
    color: 'white',
    fontWeight: '500',
  },
  clearFiltersButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  clearFiltersText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});