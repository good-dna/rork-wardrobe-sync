import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, Pressable, FlatList,
  TextInput, Image, SectionList, SafeAreaView, ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Search, Grid2x2, List } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Category } from '@/types/wardrobe';
import EmptyState from '@/components/EmptyState';

const CATEGORIES: Category[] = ['shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'];
const ALL_FILTER = 'All';

export default function WardrobeScreen() {
  const router = useRouter();
  const items = useWardrobeStore((state) => state.items);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL_FILTER);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleAddItem = useCallback(() => {
    router.push('/add-item' as any);
  }, [router]);

  const handleItemPress = useCallback((id: string) => {
    router.push(`/item/${id}` as any);
  }, [router]);

  // Filter items by search and category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = activeCategory === ALL_FILTER || item.category === activeCategory;
      const query = search.toLowerCase();
      const matchesSearch = !search || (
        item.name.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.color.toLowerCase().includes(query)
      );
      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, search]);

  // Group filtered items by category for section list
  const sections = useMemo(() => {
    if (activeCategory !== ALL_FILTER) {
      return [{
        title: activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1),
        data: [filteredItems],
      }];
    }
    return CATEGORIES
      .map((cat) => ({
        title: cat.charAt(0).toUpperCase() + cat.slice(1),
        data: [filteredItems.filter((i) => i.category === cat)],
      }))
      .filter((s) => s.data[0].length > 0);
  }, [filteredItems, activeCategory]);

  const filterChips = [ALL_FILTER, ...CATEGORIES];

  const renderGridRow = ({ item: rowItems }: { item: any[] }) => (
    <View style={styles.gridRow}>
      {rowItems.map((item: any) => (
        <Pressable
          key={item.id}
          style={styles.gridItem}
          onPress={() => handleItemPress(item.id)}
        >
          <Image
            source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
            style={styles.gridImage}
            resizeMode="cover"
          />
          <Text style={styles.gridItemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.gridItemBrand} numberOfLines={1}>{item.brand}</Text>
        </Pressable>
      ))}
      {/* Fill empty slots in last row */}
      {rowItems.length === 1 && <View style={styles.gridItemEmpty} />}
    </View>
  );

  const renderListItem = (item: any) => (
    <Pressable
      key={item.id}
      style={styles.listItem}
      onPress={() => handleItemPress(item.id)}
    >
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
        style={styles.listImage}
        resizeMode="cover"
      />
      <View style={styles.listItemInfo}>
        <Text style={styles.listItemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.listItemBrand} numberOfLines={1}>{item.brand}</Text>
        <Text style={styles.listItemMeta}>{item.color} · Worn {item.wearCount}x</Text>
      </View>
    </Pressable>
  );

  const renderSection = ({ section }: any) => {
    const sectionItems = section.data[0];
    if (!sectionItems || sectionItems.length === 0) return null;

    if (viewMode === 'grid') {
      // Chunk into rows of 2
      const rows = [];
      for (let i = 0; i < sectionItems.length; i += 2) {
        rows.push(sectionItems.slice(i, i + 2));
      }
      return (
        <View style={styles.sectionContent}>
          {rows.map((row: any[], idx: number) => (
            <View key={idx} style={styles.gridRow}>
              {row.map((item: any) => (
                <Pressable
                  key={item.id}
                  style={styles.gridItem}
                  onPress={() => handleItemPress(item.id)}
                >
                  <Image
                    source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.gridItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.gridItemBrand} numberOfLines={1}>{item.brand}</Text>
                </Pressable>
              ))}
              {row.length === 1 && <View style={styles.gridItemEmpty} />}
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.sectionContent}>
        {sectionItems.map((item: any) => renderListItem(item))}
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <ImageBackground
        source={require('../../assets/images/closet-backdrop.png')}
        style={{ flex: 1 }}
        imageStyle={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Wardrobe</Text>
          <Pressable style={styles.addButton} onPress={handleAddItem}>
            <Plus size={20} color="#000" strokeWidth={2.5} />
          </Pressable>
        </View>
        <EmptyState
          title="Your wardrobe is empty"
          message="Start adding your clothing items to build your digital wardrobe."
          actionLabel="Add First Item"
          onAction={handleAddItem}
        />
      </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/closet-backdrop.png')}
      style={{ flex: 1 }}
      imageStyle={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    >
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.viewToggleBtn}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid'
              ? <List size={20} color={colors.text} />
              : <Grid2x2 size={20} color={colors.text} />
            }
          </Pressable>
          <Pressable style={styles.addButton} onPress={handleAddItem}>
            <Plus size={20} color="#000" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Search size={16} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, brand, color..."
          placeholderTextColor={colors.mediumGray}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Category filter chips */}
      <View style={styles.filterChipsWrapper}>
        <FlatList
          horizontal
          data={filterChips}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
          renderItem={({ item: cat }) => (
            <Pressable
              style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.filterChipText, activeCategory === cat && styles.filterChipTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Items count */}
      <Text style={styles.itemCount}>
        {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
      </Text>

      {/* Section list */}
      {filteredItems.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderSection}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>
                {section.data[0].length}
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>No items match your search</Text>
          <Pressable onPress={() => { setSearch(''); setActiveCategory(ALL_FILTER); }}>
            <Text style={styles.clearText}>Clear filters</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: tokens.radius.lg,
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  filterChipsWrapper: {
    height: 48,
    marginBottom: 4,
  },
  filterChips: {
    paddingHorizontal: tokens.spacing.lg,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    height: 32,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  itemCount: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: 4,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: 90,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sectionContent: {
    marginBottom: tokens.spacing.md,
  },
  // Grid styles
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridItemEmpty: {
    flex: 1,
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'transparent',
  },
  gridItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  gridItemBrand: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  // List styles
  listItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  listImage: {
    width: 80,
    height: 80,
    backgroundColor: 'transparent',
  },
  listItemInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  listItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  listItemBrand: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  listItemMeta: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noResultsText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  clearText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
