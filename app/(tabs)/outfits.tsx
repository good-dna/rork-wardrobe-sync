import React from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import OutfitCard from '@/components/OutfitCard';
import OutfitGenerator from '@/components/OutfitGenerator';
import EmptyState from '@/components/EmptyState';

export default function OutfitsScreen() {
  const router = useRouter();
  const outfits = useWardrobeStore((state) => state.outfits);
  
  const handleAddOutfit = () => {
    router.push('/add-outfit');
  };
  
  const renderEmptyState = () => (
    <EmptyState
      title="No outfits yet"
      message="Create outfit combinations from your wardrobe items."
      actionLabel="Create Outfit"
      onAction={handleAddOutfit}
    />
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Outfits</Text>
        <Pressable style={styles.addButton} onPress={handleAddOutfit}>
          <Plus size={20} color="white" />
        </Pressable>
      </View>
      
      <OutfitGenerator />
      
      {outfits.length > 0 ? (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OutfitCard outfit={item} />}
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