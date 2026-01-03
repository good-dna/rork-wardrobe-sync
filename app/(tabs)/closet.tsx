import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Plus, Search, Shirt } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Item {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  colors: string[];
  size: string | null;
  condition: string | null;
  purchase_price: number | null;
  estimated_value: number | null;
  times_worn: number;
  last_worn_at: string | null;
  image_url: string | null;
}

export default function ClosetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['items', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Item[];
    },
    enabled: !!user?.id,
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
    },
  });

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = (itemId: string, itemName: string) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${itemName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItemMutation.mutate(itemId),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Item }) => (
    <Pressable
      style={styles.itemCard}
      onPress={() => router.push(`/closet-item/${item.id}` as any)}
      onLongPress={() => handleDelete(item.id, item.name)}
    >
      <View style={styles.itemIcon}>
        <Shirt size={24} color={colors.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>
          {item.category} {item.brand ? `• ${item.brand}` : ''}
        </Text>
        {item.colors.length > 0 && (
          <View style={styles.colorsContainer}>
            {item.colors.slice(0, 3).map((color, idx) => (
              <Text key={idx} style={styles.colorTag}>{color}</Text>
            ))}
          </View>
        )}
        <Text style={styles.itemStats}>
          Worn {item.times_worn} times
          {item.estimated_value && ` • $${item.estimated_value.toFixed(0)}`}
        </Text>
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading items</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Shirt size={64} color={colors.mediumGray} />
            <Text style={styles.emptyText}>No items yet</Text>
            <Text style={styles.emptySubtext}>Add your first item to get started</Text>
          </View>
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/closet-item/new' as any)}
      >
        <Plus size={24} color={colors.background} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    marginHorizontal: tokens.spacing.md,
    marginVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
  },
  searchIcon: {
    marginRight: tokens.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.text,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: 80,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  colorTag: {
    fontSize: 12,
    color: colors.primary,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.radius.sm,
    marginRight: 4,
    marginBottom: 4,
  },
  itemStats: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: tokens.spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
  fab: {
    position: 'absolute',
    right: tokens.spacing.md,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadow.lg,
  },
});
