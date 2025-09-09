import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { X, Check, Plus, Minus, Calendar, Bell, BellOff } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
// import { ScheduledOutfit, Occasion } from '@/types/wardrobe';
import ItemCard from './ItemCard';
import { usePlans } from '@/hooks/usePlans';

interface ScheduleOutfitModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  editingOutfit?: any;
}

const occasionOptions: { value: 'casual' | 'formal' | 'work' | 'athletic' | 'evening' | 'special'; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'work', label: 'Work' },
  { value: 'formal', label: 'Formal' },
  { value: 'athletic', label: 'Athletic' },
  { value: 'evening', label: 'Evening' },
  { value: 'special', label: 'Special Event' },
];

export default function ScheduleOutfitModal({
  visible,
  onClose,
  selectedDate,
  editingOutfit,
}: ScheduleOutfitModalProps) {
  const items = useWardrobeStore((state) => state.items);
  const outfits = useWardrobeStore((state) => state.outfits);
  
  // Use tRPC for plans management
  const { addPlan, updatePlan } = usePlans();

  const [outfitName, setOutfitName] = useState<string>(editingOutfit?.name || '');
  const [selectedCategory, setSelectedCategory] = useState<'casual' | 'formal' | 'work' | 'athletic' | 'evening' | 'special'>(
    editingOutfit?.category || 'casual'
  );
  const [selectedItems, setSelectedItems] = useState<string[]>(
    editingOutfit?.items || []
  );
  const [notes, setNotes] = useState<string>(editingOutfit?.notes || '');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(
    editingOutfit?.reminderEnabled || false
  );
  const [showExistingOutfits, setShowExistingOutfits] = useState<boolean>(false);

  const formattedDate = useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  const selectedItemObjects = useMemo(() => {
    return items.filter((item) => selectedItems.includes(item.id));
  }, [items, selectedItems]);

  const availableItems = useMemo(() => {
    return items.filter((item) => item.cleaningStatus === 'clean');
  }, [items]);

  const handleItemToggle = (itemId: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleExistingOutfitSelect = (outfit: any) => {
    setOutfitName(outfit.name);
    setSelectedCategory(outfit.occasion || 'casual');
    setSelectedItems(outfit.items || []);
    setShowExistingOutfits(false);
  };

  const handleSave = async () => {
    if (!outfitName.trim()) {
      Alert.alert('Error', 'Please enter an outfit name');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please select at least one item');
      return;
    }

    try {
      if (editingOutfit) {
        // Update existing plan
        await updatePlan({
          id: editingOutfit.id,
          name: outfitName.trim(),
          category: selectedCategory,
          items: selectedItems,
          notes: notes.trim() || undefined,
          reminderEnabled,
        });
      } else {
        // Add new plan using the exact script format
        await addPlan({
          selected: selectedDate, // JS Date for the day the user tapped
          name: outfitName.trim(),
          category: selectedCategory,
          items: selectedItems,
          notes: notes.trim() || undefined,
          reminderEnabled,
        });
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to save outfit plan:', error);
      Alert.alert('Error', 'Failed to save outfit plan. Please try again.');
    }
  };

  const resetForm = () => {
    setOutfitName('');
    setSelectedCategory('casual');
    setSelectedItems([]);
    setNotes('');
    setReminderEnabled(false);
    setShowExistingOutfits(false);
  };

  const handleClose = () => {
    onClose();
    if (!editingOutfit) {
      resetForm();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.modalTitle}>
                {editingOutfit ? 'Edit Outfit' : 'Schedule Outfit'}
              </Text>
            </View>
            <Pressable onPress={handleClose}>
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          <Text style={styles.dateText}>{formattedDate}</Text>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Select from Existing Outfits */}
            {!editingOutfit && outfits.length > 0 && (
              <View style={styles.section}>
                <Pressable
                  style={styles.quickSelectButton}
                  onPress={() => setShowExistingOutfits(!showExistingOutfits)}
                >
                  <Text style={styles.quickSelectButtonText}>
                    {showExistingOutfits ? 'Create New Outfit' : 'Use Existing Outfit'}
                  </Text>
                </Pressable>

                {showExistingOutfits && (
                  <View style={styles.existingOutfits}>
                    {outfits.map((outfit) => (
                      <Pressable
                        key={outfit.id}
                        style={styles.existingOutfitCard}
                        onPress={() => handleExistingOutfitSelect(outfit)}
                      >
                        <Text style={styles.existingOutfitName}>{outfit.name}</Text>
                        <Text style={styles.existingOutfitCategory}>
                          {occasionOptions.find((o) => o.value === (outfit.occasion || 'casual'))?.label || 'Casual'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Outfit Name */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Outfit Name</Text>
              <TextInput
                style={styles.textInput}
                value={outfitName}
                onChangeText={setOutfitName}
                placeholder="Enter outfit name..."
                placeholderTextColor={colors.mediumGray}
              />
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.categoryGrid}>
                {occasionOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.categoryOption,
                      selectedCategory === option.value && styles.selectedCategoryOption,
                    ]}
                    onPress={() => setSelectedCategory(option.value)}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        selectedCategory === option.value && styles.selectedCategoryOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Selected Items ({selectedItems.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.selectedItemsContainer}>
                    {selectedItemObjects.map((item) => (
                      <View key={item.id} style={styles.selectedItemWrapper}>
                        <ItemCard item={item} compact />
                        <Pressable
                          style={styles.removeItemButton}
                          onPress={() => handleItemToggle(item.id)}
                        >
                          <Minus size={16} color="white" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Available Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Items</Text>
              <View style={styles.itemsGrid}>
                {availableItems.map((item) => {
                  const isSelected = selectedItems.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.itemOption,
                        isSelected && styles.selectedItemOption,
                      ]}
                      onPress={() => handleItemToggle(item.id)}
                    >
                      <ItemCard item={item} compact />
                      <View
                        style={[
                          styles.itemToggleButton,
                          isSelected && styles.selectedItemToggleButton,
                        ]}
                      >
                        {isSelected ? (
                          <Check size={16} color="white" />
                        ) : (
                          <Plus size={16} color={colors.primary} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              <TextInput
                style={styles.textArea}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes about this outfit..."
                placeholderTextColor={colors.mediumGray}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Reminder */}
            <View style={styles.section}>
              <Pressable
                style={styles.reminderToggle}
                onPress={() => setReminderEnabled(!reminderEnabled)}
              >
                {reminderEnabled ? (
                  <Bell size={20} color={colors.primary} />
                ) : (
                  <BellOff size={20} color={colors.subtext} />
                )}
                <Text
                  style={[
                    styles.reminderText,
                    reminderEnabled && styles.reminderTextActive,
                  ]}
                >
                  Enable reminder notification
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Check size={18} color="white" />
            <Text style={styles.saveButtonText}>
              {editingOutfit ? 'Update Outfit' : 'Schedule Outfit'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  dateText: {
    fontSize: 16,
    color: colors.subtext,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  quickSelectButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  quickSelectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  existingOutfits: {
    gap: 8,
  },
  existingOutfitCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  existingOutfitName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  existingOutfitCategory: {
    fontSize: 12,
    color: colors.subtext,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategoryOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedCategoryOptionText: {
    color: 'white',
    fontWeight: '500',
  },
  selectedItemsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  selectedItemWrapper: {
    position: 'relative',
  },
  removeItemButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemOption: {
    position: 'relative',
    width: '48%',
  },
  selectedItemOption: {
    opacity: 0.7,
  },
  itemToggleButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.background,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  selectedItemToggleButton: {
    backgroundColor: colors.primary,
  },
  textArea: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderText: {
    fontSize: 16,
    color: colors.subtext,
    marginLeft: 12,
  },
  reminderTextActive: {
    color: colors.text,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});