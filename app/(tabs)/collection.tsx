import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Grid, List } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { SneakerCard } from '@/components/SneakerCard';
import { mockSneakers } from '@/constants/sneakerData';
import { Sneaker } from '@/types/sneaker';

export default function CollectionScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sneakers, setSneakers] = useState<Sneaker[]>(mockSneakers);

  const filteredSneakers = sneakers.filter(sneaker =>
    sneaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sneaker.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sneaker.colorway.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleWishlist = (id: string) => {
    setSneakers(prev => prev.map(sneaker => 
      sneaker.id === id 
        ? { ...sneaker, isWishlisted: !sneaker.isWishlisted }
        : sneaker
    ));
  };

  const totalValue = sneakers.reduce((sum, sneaker) => 
    sum + (sneaker.currentPrice || sneaker.retailPrice), 0
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Collection</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            {sneakers.length} pairs • ${totalValue.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.mediumGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your collection..."
            placeholderTextColor={colors.mediumGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List size={20} color={colors.primary} />
            ) : (
              <Grid size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredSneakers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No sneakers found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search' : 'Add your first pair to get started'}
            </Text>
          </View>
        ) : (
          <View style={viewMode === 'grid' ? styles.grid : styles.list}>
            {filteredSneakers.map((sneaker) => (
              <View 
                key={sneaker.id} 
                style={viewMode === 'grid' ? styles.gridItem : styles.listItem}
              >
                <SneakerCard
                  sneaker={sneaker}
                  onToggleWishlist={handleToggleWishlist}
                  compact={viewMode === 'list'}
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
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 16,
    color: colors.mediumGray,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
  },
  list: {
    gap: 16,
  },
  listItem: {
    width: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.mediumGray,
    textAlign: 'center',
  },
});