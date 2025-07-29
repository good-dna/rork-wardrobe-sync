import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Sparkles, RefreshCw } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Item, OutfitSuggestion, Season, Occasion } from '@/types/wardrobe';
import { useWardrobeStore } from '@/store/wardrobeStore';
import ItemCard from './ItemCard';

interface OutfitGeneratorProps {
  onSave?: (outfit: OutfitSuggestion) => void;
}

export default function OutfitGenerator({ onSave }: OutfitGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState<OutfitSuggestion | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season>('all');
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion>('casual');
  
  const items = useWardrobeStore((state) => state.items);
  const addOutfit = useWardrobeStore((state) => state.addOutfit);
  
  const seasons: Season[] = ['spring', 'summer', 'fall', 'winter', 'all'];
  const occasions: Occasion[] = ['casual', 'formal', 'work', 'athletic', 'evening', 'special'];
  
  // Memoize outfit items to prevent unnecessary re-renders
  const outfitItems = React.useMemo(() => {
    if (!generatedOutfit) return [];
    return items.filter(item => generatedOutfit.items.includes(item.id));
  }, [generatedOutfit, items]);
  
  const generateOutfit = useCallback(() => {
    setLoading(true);
    
    // Filter items by season if not 'all'
    let availableItems = items;
    if (selectedSeason !== 'all') {
      availableItems = items.filter(item => 
        item.season.includes(selectedSeason) || item.season.includes('all')
      );
    }
    
    // Simulate AI outfit generation
    setTimeout(() => {
      try {
        // Get one item from each necessary category based on occasion
        const selectedItems: Item[] = [];
        
        // For all occasions, we need a top
        const tops = availableItems.filter(item => item.category === 'shirts');
        if (tops.length > 0) {
          selectedItems.push(tops[Math.floor(Math.random() * tops.length)]);
        }
        
        // For all occasions, we need bottoms
        const bottoms = availableItems.filter(item => item.category === 'pants');
        if (bottoms.length > 0) {
          selectedItems.push(bottoms[Math.floor(Math.random() * bottoms.length)]);
        }
        
        // For formal, work, evening, or if it's cold, add a jacket
        if (['formal', 'work', 'evening'].includes(selectedOccasion) || 
            ['fall', 'winter'].includes(selectedSeason)) {
          const jackets = availableItems.filter(item => item.category === 'jackets');
          if (jackets.length > 0) {
            selectedItems.push(jackets[Math.floor(Math.random() * jackets.length)]);
          }
        }
        
        // Always add shoes
        const shoes = availableItems.filter(item => item.category === 'shoes');
        if (shoes.length > 0) {
          selectedItems.push(shoes[Math.floor(Math.random() * shoes.length)]);
        }
        
        // For formal, evening, or special, add accessories
        if (['formal', 'evening', 'special'].includes(selectedOccasion)) {
          const accessories = availableItems.filter(item => item.category === 'accessories');
          if (accessories.length > 0) {
            selectedItems.push(accessories[Math.floor(Math.random() * accessories.length)]);
          }
          
          // Add fragrance for special occasions
          const fragrances = availableItems.filter(item => item.category === 'fragrances');
          if (fragrances.length > 0) {
            selectedItems.push(fragrances[Math.floor(Math.random() * fragrances.length)]);
          }
        }
        
        // Create outfit name based on occasion and season
        const occasionName = selectedOccasion.charAt(0).toUpperCase() + selectedOccasion.slice(1);
        const seasonName = selectedSeason.charAt(0).toUpperCase() + selectedSeason.slice(1);
        
        const outfitNames = [
          `${occasionName} ${seasonName} Look`,
          `Perfect for ${occasionName} Days`,
          `${seasonName} ${occasionName} Style`,
          `${occasionName} Ensemble`,
          `${seasonName} Vibes`
        ];
        
        const outfitName = outfitNames[Math.floor(Math.random() * outfitNames.length)];
        
        const newOutfit: OutfitSuggestion = {
          id: Date.now().toString(),
          name: outfitName,
          items: selectedItems.map(item => item.id),
          occasion: selectedOccasion,
          season: selectedSeason,
          imageUrl: selectedItems.length > 0 ? selectedItems[0].imageUrl : undefined,
        };
        
        setGeneratedOutfit(newOutfit);
      } catch (error) {
        console.error('Error generating outfit:', error);
      } finally {
        setLoading(false);
      }
    }, 1500);
  }, [items, selectedSeason, selectedOccasion]);
  
  const handleSave = useCallback(() => {
    if (generatedOutfit) {
      addOutfit(generatedOutfit);
      if (onSave) {
        onSave(generatedOutfit);
      }
      setGeneratedOutfit(null);
    }
  }, [generatedOutfit, addOutfit, onSave]);
  
  const handleSeasonSelect = useCallback((season: Season) => {
    setSelectedSeason(season);
  }, []);
  
  const handleOccasionSelect = useCallback((occasion: Occasion) => {
    setSelectedOccasion(occasion);
  }, []);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Outfit Generator</Text>
        <Sparkles size={20} color={colors.primary} />
      </View>
      
      <View style={styles.optionsContainer}>
        <View style={styles.optionSection}>
          <Text style={styles.optionTitle}>Season</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {seasons.map((season) => (
              <Pressable
                key={season}
                style={[
                  styles.optionChip,
                  selectedSeason === season && styles.activeOptionChip
                ]}
                onPress={() => handleSeasonSelect(season)}
              >
                <Text 
                  style={[
                    styles.optionChipText,
                    selectedSeason === season && styles.activeOptionChipText
                  ]}
                >
                  {season}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.optionSection}>
          <Text style={styles.optionTitle}>Occasion</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {occasions.map((occasion) => (
              <Pressable
                key={occasion}
                style={[
                  styles.optionChip,
                  selectedOccasion === occasion && styles.activeOptionChip
                ]}
                onPress={() => handleOccasionSelect(occasion)}
              >
                <Text 
                  style={[
                    styles.optionChipText,
                    selectedOccasion === occasion && styles.activeOptionChipText
                  ]}
                >
                  {occasion}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
      
      <Pressable 
        style={styles.generateButton} 
        onPress={generateOutfit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <View style={styles.generateButtonContent}>
            <Sparkles size={18} color="white" style={styles.generateButtonIcon} />
            <Text style={styles.generateButtonText}>Generate Outfit</Text>
          </View>
        )}
      </Pressable>
      
      {generatedOutfit && (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>{generatedOutfit.name}</Text>
            <Pressable onPress={generateOutfit} disabled={loading}>
              <RefreshCw size={18} color={colors.primary} />
            </Pressable>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.itemsScroll}
          >
            {outfitItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <ItemCard item={item} compact />
              </View>
            ))}
          </ScrollView>
          
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Outfit</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionSection: {
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  optionChip: {
    backgroundColor: colors.lightGray,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeOptionChip: {
    backgroundColor: colors.primary,
  },
  optionChipText: {
    fontSize: 12,
    color: colors.text,
  },
  activeOptionChipText: {
    color: 'white',
    fontWeight: '500',
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemsScroll: {
    marginBottom: 16,
  },
  itemCard: {
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateButtonIcon: {
    marginRight: 8,
  },
});