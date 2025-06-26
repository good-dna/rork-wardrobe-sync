import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { colors, categoryColors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Category } from '@/types/wardrobe';
import ItemCard from '@/components/ItemCard';
import EmptyState from '@/components/EmptyState';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const category = id as Category;
  
  const getItemsByCategory = useWardrobeStore((state) => state.getItemsByCategory);
  const items = getItemsByCategory(category);
  
  const categoryColor = categoryColors[category] || colors.lightGray;
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: category.charAt(0).toUpperCase() + category.slice(1),
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      
      <View style={[styles.header, { backgroundColor: categoryColor }]}>
        <Text style={styles.title}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
        <Text style={styles.count}>{items.length} items</Text>
      </View>
      
      {items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ItemCard item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          title={`No ${category} found`}
          message={`You haven't added any ${category} to your wardrobe yet.`}
          actionLabel="Add Item"
          onAction={() => {}}
        />
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
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  count: {
    fontSize: 16,
    color: colors.subtext,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
});