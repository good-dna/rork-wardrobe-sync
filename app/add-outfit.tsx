import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { X, Check, Search, Calendar as CalendarIcon } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { OutfitSuggestion, Season, Occasion } from '@/types/wardrobe';
import { usePlans } from '@/hooks/usePlans';
import ItemCard from '@/components/ItemCard';

export default function AddOutfitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const items = useWardrobeStore((state) => state.items);
  const addOutfit = useWardrobeStore((state) => state.addOutfit);
  const { addPlanAsync } = usePlans({});
  
  const [name, setName] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<Occasion>('casual');
  const [season, setSeason] = useState<Season>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const selectedDate = params.date ? new Date(params.date as string) : null;
  
  const seasons: Season[] = ['spring', 'summer', 'fall', 'winter', 'all'];
  const occasions: Occasion[] = ['casual', 'formal', 'work', 'athletic', 'evening', 'special'];
  
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleClose = () => {
    router.back();
  };
  
  const handleSave = async () => {
    if (!name || selectedItems.length === 0) {
      alert('Please provide a name and select at least one item');
      return;
    }
    
    const newOutfit: OutfitSuggestion = {
      id: Date.now().toString(),
      name,
      items: selectedItems,
      occasion,
      season,
      imageUrl: items.find(item => item.id === selectedItems[0])?.imageUrl,
    };
    
    addOutfit(newOutfit);
    
    if (selectedDate && addPlanAsync) {
      try {
        await addPlanAsync({
          selected: selectedDate,
          outfitId: newOutfit.id,
          name,
          category: occasion,
          items: selectedItems,
          reminderEnabled: false,
        });
      } catch (error) {
        console.error('Failed to schedule outfit:', error);
      }
    }
    
    router.back();
  };
  
  const toggleItemSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen 
        options={{
          headerLeft: () => (
            <Pressable onPress={handleClose} style={styles.headerButton}>
              <X size={24} color={colors.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleSave} style={styles.headerButton}>
              <Check size={24} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {selectedDate && (
          <View style={styles.dateInfo}>
            <CalendarIcon size={16} color={colors.primary} />
            <Text style={styles.dateInfoText}>
              Scheduling for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        )}
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Outfit Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Casual Friday"
            placeholderTextColor={colors.mediumGray}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Occasion</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {occasions.map((occ) => (
              <Pressable
                key={occ}
                style={[
                  styles.chip,
                  occasion === occ && styles.selectedChip
                ]}
                onPress={() => setOccasion(occ)}
              >
                <Text 
                  style={[
                    styles.chipText,
                    occasion === occ && styles.selectedChipText
                  ]}
                >
                  {occ.charAt(0).toUpperCase() + occ.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Season</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {seasons.map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.chip,
                  season === s && styles.selectedChip
                ]}
                onPress={() => setSeason(s)}
              >
                <Text 
                  style={[
                    styles.chipText,
                    season === s && styles.selectedChipText
                  ]}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Items *</Text>
          <View style={styles.searchContainer}>
            <Search size={18} color={colors.subtext} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search items..."
              placeholderTextColor={colors.mediumGray}
            />
          </View>
          
          <View style={styles.selectedCount}>
            <Text style={styles.selectedCountText}>
              {selectedItems.length} items selected
            </Text>
          </View>
          
          <View style={styles.itemsList}>
            {filteredItems.map((item) => (
              <Pressable 
                key={item.id} 
                style={[
                  styles.itemCard,
                  selectedItems.includes(item.id) && styles.selectedItemCard
                ]}
                onPress={() => toggleItemSelection(item.id)}
              >
                <ItemCard item={item} />
                {selectedItems.includes(item.id) && (
                  <View style={styles.selectedOverlay}>
                    <Check size={24} color="white" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  dateInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: tokens.spacing.sm,
  },
  formGroup: {
    marginBottom: tokens.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: tokens.spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipsContainer: {
    paddingVertical: tokens.spacing.xs,
    gap: tokens.spacing.sm,
  },
  chip: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedChipText: {
    color: 'white',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: tokens.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  selectedCount: {
    marginBottom: tokens.spacing.md,
  },
  selectedCountText: {
    fontSize: 14,
    color: colors.subtext,
  },
  itemsList: {
    gap: tokens.spacing.sm,
  },
  itemCard: {
    position: 'relative',
    borderRadius: tokens.radius.lg,
  },
  selectedItemCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  selectedOverlay: {
    position: 'absolute',
    top: tokens.spacing.sm,
    right: tokens.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadow.md,
  },
});