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
  FlatList
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { X, Check, Search } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { OutfitSuggestion, Season, Occasion } from '@/types/wardrobe';
import ItemCard from '@/components/ItemCard';
import OutfitGenerator from '@/components/OutfitGenerator';

export default function AddOutfitScreen() {
  const router = useRouter();
  const items = useWardrobeStore((state) => state.items);
  const addOutfit = useWardrobeStore((state) => state.addOutfit);
  
  const [name, setName] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<Occasion>('casual');
  const [season, setSeason] = useState<Season>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
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
  
  const handleSave = () => {
    if (!name || selectedItems.length === 0) {
      // Show validation error
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
    router.back();
  };
  
  const toggleItemSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };
  
  const handleGeneratedOutfit = (outfit: OutfitSuggestion) => {
    setName(outfit.name);
    setSelectedItems(outfit.items);
    setOccasion(outfit.occasion);
    setSeason(outfit.season);
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
        <OutfitGenerator onSave={handleGeneratedOutfit} />
        
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
    padding: 16,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  chipsContainer: {
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: colors.primary,
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
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  selectedCount: {
    marginBottom: 12,
  },
  selectedCountText: {
    fontSize: 14,
    color: colors.subtext,
  },
  itemsList: {
    marginBottom: 16,
  },
  itemCard: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 12,
  },
  selectedItemCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});