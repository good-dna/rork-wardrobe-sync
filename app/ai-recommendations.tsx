import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Sparkles, RefreshCw } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';

import Typography from '@/components/ui/Typography';
import Card from '@/components/ui/Card';

import { generateOutfitRecommendation } from '@/services/outfitRecommendationService';
import { fetchWeather, getCurrentLocation } from '@/services/weatherService';
import ItemCard from '@/components/ItemCard';
import { OutfitSuggestion } from '@/types/wardrobe';

const occasionOptions = [
  {
    id: 'casual',
    title: 'Casual Day',
    subtitle: 'Relaxed and comfortable',
    icon: '👕',
    color: colors.primary,
  },
  {
    id: 'work',
    title: 'Work Professional',
    subtitle: 'Business meetings & office',
    icon: '👔',
    color: colors.secondary,
  },
  {
    id: 'formal',
    title: 'Formal Event',
    subtitle: 'Special occasions',
    icon: '🤵',
    color: colors.success,
  },
  {
    id: 'evening',
    title: 'Evening Out',
    subtitle: 'Dinner & social events',
    icon: '🌙',
    color: colors.error,
  },
  {
    id: 'athletic',
    title: 'Active Wear',
    subtitle: 'Gym & sports activities',
    icon: '🏃',
    color: '#FF9500',
  },
  {
    id: 'weather',
    title: 'Weather-Based',
    subtitle: 'Perfect for today\'s weather',
    icon: '🌤️',
    color: '#34C759',
  },
];

export default function AIRecommendationsScreen() {
  const router = useRouter();
  const { occasion } = useLocalSearchParams<{ occasion?: string }>();
  const items = useWardrobeStore((state) => state.items);
  const addOutfit = useWardrobeStore((state) => state.addOutfit);

  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [generatedOutfit, setGeneratedOutfit] = useState<OutfitSuggestion | null>(null);

  const handleOccasionSelect = useCallback(async (occasionId: string) => {
    setSelectedOccasion(occasionId);
    setLoading(true);
    setRecommendation(null);
    setGeneratedOutfit(null);

    try {
      if (occasionId === 'weather') {
        // Generate weather-based recommendation
        const coords = await getCurrentLocation();
        const weatherResult = coords ? await fetchWeather(coords.latitude, coords.longitude) : null;
        if (weatherResult) {
          const weatherRecommendation = generateOutfitRecommendation(items, weatherResult.current);
          
          if (weatherRecommendation) {
            setRecommendation(weatherRecommendation);
            setGeneratedOutfit(weatherRecommendation.outfit);
          }
        }

      } else {
        // Generate occasion-based recommendation
        setTimeout(() => {
          const availableItems = items.filter(item => {
            if (occasionId === 'formal') {
              return item.tags.some(tag => 
                tag.toLowerCase().includes('formal') || 
                tag.toLowerCase().includes('dress') ||
                tag.toLowerCase().includes('suit')
              );
            }
            if (occasionId === 'athletic') {
              return item.tags.some(tag => 
                tag.toLowerCase().includes('sport') || 
                tag.toLowerCase().includes('athletic') ||
                tag.toLowerCase().includes('gym')
              );
            }
            return true;
          });

          const selectedItems = [];
          
          // Get one item from each category
          const tops = availableItems.filter(item => item.category === 'shirts');
          const bottoms = availableItems.filter(item => item.category === 'pants');
          const shoes = availableItems.filter(item => item.category === 'shoes');
          const jackets = availableItems.filter(item => item.category === 'jackets');
          const accessories = availableItems.filter(item => item.category === 'accessories');
          
          if (tops.length > 0) selectedItems.push(tops[Math.floor(Math.random() * tops.length)]);
          if (bottoms.length > 0) selectedItems.push(bottoms[Math.floor(Math.random() * bottoms.length)]);
          if (shoes.length > 0) selectedItems.push(shoes[Math.floor(Math.random() * shoes.length)]);
          
          if (['formal', 'work', 'evening'].includes(occasionId) && jackets.length > 0) {
            selectedItems.push(jackets[Math.floor(Math.random() * jackets.length)]);
          }
          
          if (['formal', 'evening'].includes(occasionId) && accessories.length > 0) {
            selectedItems.push(accessories[Math.floor(Math.random() * accessories.length)]);
          }

          const occasionData = occasionOptions.find(opt => opt.id === occasionId);
          const outfit: OutfitSuggestion = {
            id: Date.now().toString(),
            name: `${occasionData?.title} Look`,
            items: selectedItems.map(item => item.id),
            occasion: occasionId as any,
            season: 'all',
            imageUrl: selectedItems.length > 0 ? selectedItems[0].imageUrl : undefined,
          };
          
          setGeneratedOutfit(outfit);
        }, 1500);
      }
    } catch (error) {
      console.error('Error generating recommendation:', error);
    } finally {
      setLoading(false);
    }
  }, [items]);

  // Auto-select and generate outfit if occasion is provided via URL
  useEffect(() => {
    if (occasion && typeof occasion === 'string' && !selectedOccasion) {
      void handleOccasionSelect(occasion);
    }
  }, [occasion, selectedOccasion, handleOccasionSelect]);

  const handleSaveOutfit = () => {
    if (generatedOutfit) {
      addOutfit(generatedOutfit);
      router.back();
    }
  };

  const handleRegenerateOutfit = () => {
    if (selectedOccasion) {
      void handleOccasionSelect(selectedOccasion);
    }
  };

  const outfitItems = React.useMemo(() => {
    if (!generatedOutfit) return [];
    return items.filter(item => generatedOutfit.items.includes(item.id));
  }, [generatedOutfit, items]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text} />
            </Pressable>
            <Typography variant="h2" style={styles.headerTitle}>
              AI Recommendations
            </Typography>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.welcomeSection}>
              <Typography variant="h1" style={styles.welcomeTitle}>
                What&apos;s the occasion?
              </Typography>
              <Typography variant="body" color={colors.textSecondary} style={styles.welcomeSubtitle}>
                Let AI create the perfect outfit for your day
              </Typography>
            </View>

            <View style={styles.optionsGrid}>
              {occasionOptions.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.occasionCard,
                    selectedOccasion === option.id && styles.selectedOccasionCard,
                    loading && selectedOccasion === option.id && styles.loadingOccasionCard
                  ]}
                  onPress={() => handleOccasionSelect(option.id)}
                  disabled={loading}
                >
                  <View style={[styles.occasionIcon, { backgroundColor: option.color + '20' }]}>
                    <Typography variant="h2" style={styles.occasionEmoji}>
                      {option.icon}
                    </Typography>
                  </View>
                  <Typography variant="h3" style={styles.occasionTitle}>
                    {option.title}
                  </Typography>
                  <Typography variant="caption" color={colors.textSecondary} style={styles.occasionSubtitle}>
                    {option.subtitle}
                  </Typography>
                  {loading && selectedOccasion === option.id && (
                    <View style={styles.loadingOverlay}>
                      <Sparkles size={20} color={colors.primary} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            {generatedOutfit && (
              <Card style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Typography variant="h2" style={styles.resultTitle}>
                    {generatedOutfit.name}
                  </Typography>
                  <Pressable onPress={handleRegenerateOutfit} disabled={loading}>
                    <RefreshCw size={20} color={colors.primary} />
                  </Pressable>
                </View>

                {recommendation && (
                  <View style={styles.weatherInfo}>
                    <Typography variant="caption" color={colors.textSecondary}>
                      {recommendation.weatherSummary}
                    </Typography>
                  </View>
                )}

                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.itemsScroll}
                >
                  {outfitItems.map((item) => (
                    <View key={item.id} style={styles.itemCardContainer}>
                      <ItemCard item={item} compact />
                    </View>
                  ))}
                </ScrollView>

                {recommendation?.reasonings && (
                  <View style={styles.reasoningsSection}>
                    <Typography variant="h3" style={styles.reasoningsTitle}>
                      Why this outfit?
                    </Typography>
                    {recommendation.reasonings.map((reasoning: any, index: number) => (
                      <View key={index} style={styles.reasoningItem}>
                        <Typography variant="caption" color={colors.primary} style={styles.reasoningCategory}>
                          {reasoning.category}
                        </Typography>
                        <Typography variant="caption" color={colors.textSecondary}>
                          {reasoning.reason}
                        </Typography>
                      </View>
                    ))}
                  </View>
                )}

                <Pressable style={styles.saveButton} onPress={handleSaveOutfit}>
                  <Typography variant="body" color={colors.background} style={styles.saveButtonText}>
                    Save to My Outfits
                  </Typography>
                </Pressable>
              </Card>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  welcomeSubtitle: {
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  occasionCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    alignItems: 'center',
    ...tokens.shadow.sm,
  },
  selectedOccasionCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  loadingOccasionCard: {
    opacity: 0.7,
  },
  occasionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
  },
  occasionEmoji: {
    fontSize: 24,
  },
  occasionTitle: {
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  occasionSubtitle: {
    textAlign: 'center',
    fontSize: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card + '80',
    borderRadius: tokens.radius.xl,
  },
  resultCard: {
    padding: tokens.spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  resultTitle: {
    flex: 1,
  },
  weatherInfo: {
    marginBottom: tokens.spacing.md,
  },
  itemsScroll: {
    marginBottom: tokens.spacing.lg,
  },
  itemCardContainer: {
    marginRight: tokens.spacing.sm,
  },
  reasoningsSection: {
    marginBottom: tokens.spacing.lg,
  },
  reasoningsTitle: {
    marginBottom: tokens.spacing.md,
  },
  reasoningItem: {
    marginBottom: tokens.spacing.sm,
  },
  reasoningCategory: {
    fontWeight: '600',
    marginBottom: tokens.spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
    ...tokens.shadow.sm,
  },
  saveButtonText: {
    fontWeight: '600',
  },
});