import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  TextInput,
  Alert
} from 'react-native';
import { Stack } from 'expo-router';
import { Search, Plus, Filter, Grid, List } from 'lucide-react-native';
import { SneakerCard } from '@/components/SneakerCard';
import { Sneaker, SneakerBrand, SneakerCategory, SneakerCondition } from '@/types/sneaker';
import { 
  getSneakers, 
  toggleSneakerFavorite, 
  recordSneakerWear,
  searchSneakers 
} from '@/services/sneakerApi';

export default function SneakersScreen() {
  const [sneakers, setSneakers] = useState<Sneaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    brands: [] as SneakerBrand[],
    categories: [] as SneakerCategory[],
    conditions: [] as SneakerCondition[],
    favorites: false
  });

  useEffect(() => {
    loadSneakers();
  }, [filters]);

  const loadSneakers = async () => {
    try {
      setLoading(true);
      const data = await getSneakers({
        filters: {
          brand: filters.brands.length > 0 ? filters.brands : undefined,
          category: filters.categories.length > 0 ? filters.categories : undefined,
          condition: filters.conditions.length > 0 ? filters.conditions : undefined,
          favorite: filters.favorites || undefined,
          searchQuery: searchQuery || undefined
        }
      });
      setSneakers(data);
    } catch (error) {
      console.error('Error loading sneakers:', error);
      Alert.alert('Error', 'Failed to load sneakers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await searchSneakers(query);
        setSneakers(results);
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      loadSneakers();
    }
  };

  const handleFavoriteToggle = async (sneakerId: string) => {
    try {
      await toggleSneakerFavorite(sneakerId);
      setSneakers(prev => prev.map(sneaker => 
        sneaker.id === sneakerId 
          ? { ...sneaker, favorite: !sneaker.favorite }
          : sneaker
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const handleWearRecord = async (sneakerId: string) => {
    try {
      const updatedSneaker = await recordSneakerWear(sneakerId);
      setSneakers(prev => prev.map(sneaker => 
        sneaker.id === sneakerId ? updatedSneaker : sneaker
      ));
      Alert.alert('Success', 'Wear recorded successfully!');
    } catch (error) {
      console.error('Error recording wear:', error);
      Alert.alert('Error', 'Failed to record wear');
    }
  };

  const FilterButton = ({ 
    title, 
    selected, 
    onPress 
  }: { 
    title: string; 
    selected: boolean; 
    onPress: () => void; 
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, selected && styles.filterButtonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, selected && styles.filterButtonTextSelected]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    const brands: SneakerBrand[] = ['Nike', 'Adidas', 'Jordan', 'New Balance', 'Converse'];
    const categories: SneakerCategory[] = ['Basketball', 'Running', 'Lifestyle', 'Casual'];
    const conditions: SneakerCondition[] = ['Deadstock', 'New', 'Very Good', 'Good'];

    return (
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Brands</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {brands.map(brand => (
            <FilterButton
              key={brand}
              title={brand}
              selected={filters.brands.includes(brand)}
              onPress={() => {
                setFilters(prev => ({
                  ...prev,
                  brands: prev.brands.includes(brand)
                    ? prev.brands.filter(b => b !== brand)
                    : [...prev.brands, brand]
                }));
              }}
            />
          ))}
        </ScrollView>

        <Text style={styles.filterTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {categories.map(category => (
            <FilterButton
              key={category}
              title={category}
              selected={filters.categories.includes(category)}
              onPress={() => {
                setFilters(prev => ({
                  ...prev,
                  categories: prev.categories.includes(category)
                    ? prev.categories.filter(c => c !== category)
                    : [...prev.categories, category]
                }));
              }}
            />
          ))}
        </ScrollView>

        <Text style={styles.filterTitle}>Condition</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {conditions.map(condition => (
            <FilterButton
              key={condition}
              title={condition}
              selected={filters.conditions.includes(condition)}
              onPress={() => {
                setFilters(prev => ({
                  ...prev,
                  conditions: prev.conditions.includes(condition)
                    ? prev.conditions.filter(c => c !== condition)
                    : [...prev.conditions, condition]
                }));
              }}
            />
          ))}
        </ScrollView>

        <FilterButton
          title="Favorites Only"
          selected={filters.favorites}
          onPress={() => {
            setFilters(prev => ({ ...prev, favorites: !prev.favorites }));
          }}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Sneakers',
          headerRight: () => (
            <TouchableOpacity style={styles.addButton}>
              <Plus size={24} color="#000" />
            </TouchableOpacity>
          )
        }} 
      />

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sneakers..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, showFilters && styles.controlButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color={showFilters ? '#FFF' : '#666'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List size={20} color="#666" />
            ) : (
              <Grid size={20} color="#666" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {renderFilters()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading sneakers...</Text>
          </View>
        ) : sneakers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Sneakers Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || Object.values(filters).some(f => f === true || (Array.isArray(f) && f.length > 0))
                ? 'Try adjusting your search or filters'
                : 'Add your first sneaker to get started'
              }
            </Text>
          </View>
        ) : (
          <View style={viewMode === 'grid' ? styles.grid : styles.list}>
            {sneakers.map(sneaker => (
              <View key={sneaker.id} style={viewMode === 'grid' ? styles.gridItem : undefined}>
                <SneakerCard
                  sneaker={sneaker}
                  compact={viewMode === 'list'}
                  onPress={() => {
                    // Navigate to sneaker details
                    console.log('Navigate to sneaker:', sneaker.id);
                  }}
                  onFavoritePress={() => handleFavoriteToggle(sneaker.id)}
                  onWearPress={() => handleWearRecord(sneaker.id)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  controlButtonActive: {
    backgroundColor: '#000',
  },
  addButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  filterRow: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterButtonSelected: {
    backgroundColor: '#000',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextSelected: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
  },
  list: {
    paddingVertical: 16,
  },
});