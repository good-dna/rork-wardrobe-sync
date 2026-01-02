import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, RefreshCw, Save, Shuffle } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Season } from '@/types/wardrobe';

type FormalityLevel = number;
type SeasonType = Season | 'all';
type WeatherSensitivity = number;
type ItemCount = number;

const seasons: { value: SeasonType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
];

export default function GenerateScreen() {
  const router = useRouter();
  const items = useWardrobeStore((state) => state.items);
  const addOutfit = useWardrobeStore((state) => state.addOutfit);
  
  const [formality, setFormality] = useState<FormalityLevel>(50);
  const [selectedSeason, setSelectedSeason] = useState<SeasonType>('all');
  const [weatherSensitivity, setWeatherSensitivity] = useState<WeatherSensitivity>(50);
  const [itemCount, setItemCount] = useState<ItemCount>(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState<string[] | null>(null);
  
  const getFormalityLabel = (value: number): string => {
    if (value <= 25) return 'Very Casual';
    if (value <= 50) return 'Casual';
    if (value <= 75) return 'Smart Casual';
    return 'Formal';
  };
  
  const getWeatherLabel = (value: number): string => {
    if (value <= 33) return 'Low';
    if (value <= 66) return 'Medium';
    return 'High';
  };
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const filteredItems = items.filter(item => {
      if (selectedSeason !== 'all' && !item.season.includes(selectedSeason)) {
        return false;
      }
      return true;
    });
    
    const shuffled = [...filteredItems].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(itemCount, shuffled.length));
    
    setGeneratedOutfit(selected.map(item => item.id));
    setIsGenerating(false);
  };
  
  const handleRegenerate = () => {
    handleGenerate();
  };
  
  const handleSwapItem = (itemId: string) => {
    console.log('Swap item:', itemId);
  };
  
  const handleSave = () => {
    if (!generatedOutfit) return;
    
    const outfitName = `${getFormalityLabel(formality)} Outfit`;
    const occasionType = formality > 75 ? 'formal' : formality > 50 ? 'work' : 'casual';
    
    addOutfit({
      id: Date.now().toString(),
      name: outfitName,
      items: generatedOutfit,
      occasion: occasionType as any,
      season: selectedSeason === 'all' ? 'all' : selectedSeason,
    });
    
    router.push('/(tabs)/calendar');
  };
  
  const selectedItems = generatedOutfit 
    ? items.filter(item => generatedOutfit.includes(item.id))
    : [];
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Auto Generate</Text>
          <Text style={styles.subtitle}>Create the perfect outfit</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.controlsSection}>
          <View style={styles.control}>
            <View style={styles.controlHeader}>
              <Text style={styles.controlLabel}>Formality</Text>
              <Text style={styles.controlValue}>{getFormalityLabel(formality)}</Text>
            </View>
            <View style={styles.sliderContainer}>
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Casual</Text>
                <Text style={styles.sliderLabelText}>Formal</Text>
              </View>
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderFill, 
                    { width: `${formality}%` }
                  ]} 
                />
                <Pressable
                  style={[
                    styles.sliderThumb,
                    { left: `${formality}%` }
                  ]}
                  onTouchMove={(e) => {
                    const locationX = e.nativeEvent.locationX;
                    const width = 300;
                    const newValue = Math.max(0, Math.min(100, (locationX / width) * 100));
                    setFormality(Math.round(newValue));
                  }}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.control}>
            <View style={styles.controlHeader}>
              <Text style={styles.controlLabel}>Season</Text>
              <Text style={styles.controlValue}>
                {seasons.find(s => s.value === selectedSeason)?.label}
              </Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.seasonChips}
            >
              {seasons.map((season) => (
                <Pressable
                  key={season.value}
                  style={[
                    styles.seasonChip,
                    selectedSeason === season.value && styles.seasonChipActive,
                  ]}
                  onPress={() => setSelectedSeason(season.value)}
                >
                  <Text style={[
                    styles.seasonChipText,
                    selectedSeason === season.value && styles.seasonChipTextActive,
                  ]}>
                    {season.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.control}>
            <View style={styles.controlHeader}>
              <Text style={styles.controlLabel}>Weather Sensitivity</Text>
              <Text style={styles.controlValue}>{getWeatherLabel(weatherSensitivity)}</Text>
            </View>
            <View style={styles.sliderContainer}>
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Low</Text>
                <Text style={styles.sliderLabelText}>High</Text>
              </View>
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderFill, 
                    { width: `${weatherSensitivity}%` }
                  ]} 
                />
                <Pressable
                  style={[
                    styles.sliderThumb,
                    { left: `${weatherSensitivity}%` }
                  ]}
                  onTouchMove={(e) => {
                    const locationX = e.nativeEvent.locationX;
                    const width = 300;
                    const newValue = Math.max(0, Math.min(100, (locationX / width) * 100));
                    setWeatherSensitivity(Math.round(newValue));
                  }}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.control}>
            <View style={styles.controlHeader}>
              <Text style={styles.controlLabel}>Number of Items</Text>
              <Text style={styles.controlValue}>{itemCount}</Text>
            </View>
            <View style={styles.itemCountButtons}>
              {[3, 4, 5, 6].map((count) => (
                <Pressable
                  key={count}
                  style={[
                    styles.itemCountButton,
                    itemCount === count && styles.itemCountButtonActive,
                  ]}
                  onPress={() => setItemCount(count)}
                >
                  <Text style={[
                    styles.itemCountButtonText,
                    itemCount === count && styles.itemCountButtonTextActive,
                  ]}>
                    {count}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        
        {generatedOutfit && (
          <View style={styles.previewSection}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Generated Outfit</Text>
              <Pressable onPress={handleRegenerate} style={styles.regenerateButton}>
                <RefreshCw size={16} color={colors.primary} />
                <Text style={styles.regenerateButtonText}>Regenerate</Text>
              </Pressable>
            </View>
            
            <View style={styles.previewGrid}>
              {selectedItems.map((item) => (
                <View key={item.id} style={styles.previewItem}>
                  <View style={styles.previewItemImage}>
                    <Text style={styles.previewItemEmoji}>👕</Text>
                  </View>
                  <Text style={styles.previewItemName}>{item.name}</Text>
                  <Text style={styles.previewItemBrand}>{item.brand}</Text>
                  <Pressable 
                    style={styles.swapButton}
                    onPress={() => handleSwapItem(item.id)}
                  >
                    <Shuffle size={14} color={colors.primary} />
                    <Text style={styles.swapButtonText}>Swap</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        {!generatedOutfit ? (
          <Pressable 
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color={colors.background} />
                <Text style={styles.generateButtonText}>Generating...</Text>
              </>
            ) : (
              <>
                <Sparkles size={20} color={colors.background} />
                <Text style={styles.generateButtonText}>Generate Outfit</Text>
              </>
            )}
          </Pressable>
        ) : (
          <View style={styles.footerActions}>
            <Pressable style={styles.regenerateFooterButton} onPress={handleRegenerate}>
              <RefreshCw size={20} color={colors.primary} />
              <Text style={styles.regenerateFooterButtonText}>Try Again</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Save size={20} color={colors.background} />
              <Text style={styles.saveButtonText}>Save Outfit</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: tokens.spacing.xxl,
  },
  controlsSection: {
    paddingHorizontal: tokens.spacing.lg,
    gap: tokens.spacing.xl,
  },
  control: {
    marginBottom: tokens.spacing.md,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  controlValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  sliderContainer: {
    gap: tokens.spacing.sm,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: tokens.radius.full,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: tokens.radius.full,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 3,
    borderColor: colors.primary,
    top: -8,
    marginLeft: -12,
    ...tokens.shadow.sm,
  },
  seasonChips: {
    gap: tokens.spacing.sm,
  },
  seasonChip: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  seasonChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  seasonChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  seasonChipTextActive: {
    color: colors.background,
  },
  itemCountButtons: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  itemCountButton: {
    flex: 1,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemCountButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemCountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemCountButtonTextActive: {
    color: colors.background,
  },
  previewSection: {
    marginTop: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: tokens.radius.md,
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 4,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
  },
  previewItem: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewItemImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  previewItemEmoji: {
    fontSize: 32,
  },
  previewItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  previewItemBrand: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: tokens.spacing.sm,
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: tokens.radius.sm,
  },
  swapButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 4,
  },
  footer: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing.lg,
    ...tokens.shadow.md,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
    marginLeft: tokens.spacing.sm,
  },
  footerActions: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  regenerateFooterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  regenerateFooterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: tokens.spacing.sm,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing.lg,
    ...tokens.shadow.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
    marginLeft: tokens.spacing.sm,
  },
});
