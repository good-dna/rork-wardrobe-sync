import React from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
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
    <EmptyState
      title="Your wishlist is empty"
      message="Add items you want to buy to keep track of your shopping list."
      actionLabel="Add to Wishlist"
      onAction={handleAddWishlistItem}
    />
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wishlist</Text>
        <Pressable style={styles.addButton} onPress={handleAddWishlistItem}>
          <Plus size={20} color="white" />
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
});