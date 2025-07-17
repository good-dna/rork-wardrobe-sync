import React from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Sparkles, Camera, Link } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import WishlistCard from '@/components/WishlistCard';
import EmptyState from '@/components/EmptyState';

export default function WishlistScreen() {
  const router = useRouter();
  const wishlist = useWardrobeStore((state) => state.wishlist);
  
  const handleAddWishlistItem = () => {
    router.push('/add-wishlist');
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        title="Your wishlist is empty"
        message="Add items you want to buy using AI-powered scanning or manual entry."
        actionLabel="Smart Add Item"
        onAction={handleAddWishlistItem}
      />
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Add Options:</Text>
        <View style={styles.quickActionButtons}>
          <Pressable style={styles.quickActionButton} onPress={handleAddWishlistItem}>
            <Camera size={20} color={colors.primary} />
            <Text style={styles.quickActionText}>Scan Item</Text>
          </Pressable>
          <Pressable style={styles.quickActionButton} onPress={handleAddWishlistItem}>
            <Link size={20} color={colors.primary} />
            <Text style={styles.quickActionText}>From URL</Text>
          </Pressable>
          <Pressable style={styles.quickActionButton} onPress={handleAddWishlistItem}>
            <Plus size={20} color={colors.primary} />
            <Text style={styles.quickActionText}>Manual</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Wishlist</Text>
          <Text style={styles.subtitle}>{wishlist.length} items</Text>
        </View>
        <Pressable style={styles.smartAddButton} onPress={handleAddWishlistItem}>
          <Sparkles size={18} color="white" />
          <Text style={styles.smartAddText}>Smart Add</Text>
        </Pressable>
      </View>
      
      {wishlist.length > 0 ? (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <WishlistCard item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },

  listContent: {
    paddingBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 2,
  },
  smartAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  smartAddText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
  },
  quickActions: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  quickActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
});