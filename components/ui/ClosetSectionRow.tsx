import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import Typography from './Typography';
import ClosetItemCard from './ClosetItemCard';
import AddItemCard from './AddItemCard';

interface Item {
  id: string;
  title: string;
  imageUrl?: string;
  wornCount: number;
}

interface ClosetSectionRowProps {
  title: string;
  items: Item[];
  onItemPress?: (id: string) => void;
  onAddPress?: () => void;
}

export default function ClosetSectionRow({ title, items, onItemPress, onAddPress }: ClosetSectionRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h3" style={styles.title}>
          {title}
        </Typography>
        <Pressable style={styles.addButton} onPress={onAddPress}>
          <Plus size={18} color={colors.primary} strokeWidth={2.5} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <ClosetItemCard
            key={item.id}
            id={item.id}
            title={item.title}
            imageUrl={item.imageUrl}
            wornCount={item.wornCount}
            onPress={() => onItemPress?.(item.id)}
          />
        ))}
        <AddItemCard onPress={onAddPress} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
  },
  title: {
    fontWeight: '600',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.lg,
  },
});
