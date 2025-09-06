import React from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { Edit3, Trash2, Bell } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { ScheduledOutfit, Occasion } from '@/types/wardrobe';
import { useWardrobeStore } from '@/store/wardrobeStore';
import ItemCard from './ItemCard';

interface ScheduledOutfitCardProps {
  scheduledOutfit: ScheduledOutfit;
  onEdit: (outfit: ScheduledOutfit) => void;
}

const occasionLabels: Record<Occasion, string> = {
  casual: 'Casual',
  work: 'Work',
  formal: 'Formal',
  athletic: 'Athletic',
  evening: 'Evening',
  special: 'Special Event',
};

export default function ScheduledOutfitCard({
  scheduledOutfit,
  onEdit,
}: ScheduledOutfitCardProps) {
  const items = useWardrobeStore((state) => state.items);
  const deleteScheduledOutfit = useWardrobeStore((state) => state.deleteScheduledOutfit);

  const outfitItems = items.filter((item) => scheduledOutfit.items.includes(item.id));

  const handleDelete = () => {
    Alert.alert(
      'Delete Outfit',
      `Are you sure you want to delete "${scheduledOutfit.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteScheduledOutfit(scheduledOutfit.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.outfitName}>{scheduledOutfit.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {occasionLabels[scheduledOutfit.category]}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          {scheduledOutfit.reminderEnabled && (
            <Bell size={16} color={colors.primary} style={styles.reminderIcon} />
          )}
          <Pressable
            style={styles.actionButton}
            onPress={() => onEdit(scheduledOutfit)}
          >
            <Edit3 size={16} color={colors.subtext} />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={handleDelete}
          >
            <Trash2 size={16} color={colors.error} />
          </Pressable>
        </View>
      </View>

      {scheduledOutfit.notes && (
        <Text style={styles.notes}>{scheduledOutfit.notes}</Text>
      )}

      <View style={styles.itemsContainer}>
        <Text style={styles.itemsLabel}>
          Items ({outfitItems.length})
        </Text>
        <View style={styles.itemsGrid}>
          {outfitItems.slice(0, 4).map((item) => (
            <View key={item.id} style={styles.itemWrapper}>
              <ItemCard item={item} compact />
            </View>
          ))}
          {outfitItems.length > 4 && (
            <View style={styles.moreItemsIndicator}>
              <Text style={styles.moreItemsText}>
                +{outfitItems.length - 4}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  outfitName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderIcon: {
    marginRight: 4,
  },
  actionButton: {
    padding: 4,
  },
  notes: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  itemsContainer: {
    marginTop: 8,
  },
  itemsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemWrapper: {
    width: '23%',
  },
  moreItemsIndicator: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  moreItemsText: {
    fontSize: 12,
    color: colors.subtext,
    fontWeight: '500',
  },
});