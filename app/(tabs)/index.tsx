import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, SafeAreaView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Scan, Sparkles, MapPin, Thermometer } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import Typography from '@/components/ui/Typography';
import Card from '@/components/ui/Card';
import TemperatureBadge from '@/components/ui/TemperatureBadge';
import { 
  getCurrentWeatherRecommendations, 
  WeatherRecommendation 
} from '@/services/weatherRecommendationService';
import { 
  convertTemperature, 
  getTemperatureUnit, 
  getMockWeatherData 
} from '@/services/weatherService';


const aiSuggestionOptions = [
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
    subtitle: 'Business meetings',
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
    id: 'weather',
    title: 'Weather-Based',
    subtitle: 'Perfect for today',
    icon: '🌤️',
    color: '#34C759',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { profile, weatherCache } = useUserStore();
  const [weatherRecommendations, setWeatherRecommendations] = useState<WeatherRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  
  // Get current weather data
  const currentWeather = getMockWeatherData('sunny'); // In real app, use actual weather
  const units = profile?.locationPreferences?.units || 'metric';
  const location = profile?.locationPreferences?.location;
  
  useEffect(() => {
    loadWeatherRecommendations();
  }, [profile?.locationPreferences]);
  
  const loadWeatherRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const recommendations = await getCurrentWeatherRecommendations(
        profile?.locationPreferences
      );
      setWeatherRecommendations(recommendations.slice(0, 2)); // Show top 2 recommendations
    } catch (error) {
      console.error('Failed to load weather recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };
  
  const handleScanPress = () => {
    router.push('/add-item');
  };

  const handleWeatherPress = () => {
    router.push('/weather-outfit');
  };

  const handleAIRecommendationPress = () => {
    router.push('/ai-recommendations');
  };

  const handleQuickAIPress = (occasionId: string) => {
    router.push(`/ai-recommendations?occasion=${occasionId}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View>
                <Typography variant="h1" style={styles.greeting}>
                  Welcome, {profile?.displayName?.split(' ')[0] || 'there'}
                </Typography>
                <Typography variant="body" color={colors.textSecondary}>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
              </View>
              <Pressable style={styles.scanButton} onPress={handleScanPress}>
                <Scan size={24} color={colors.background} />
              </Pressable>
            </View>

            {/* Weather & Location Section */}
            <Card style={styles.weatherCard}>
              <View style={styles.weatherHeader}>
                <View style={styles.weatherInfo}>
                  <View style={styles.locationRow}>
                    <MapPin size={16} color={colors.textSecondary} />
                    <Typography variant="caption" color={colors.textSecondary} style={styles.locationText}>
                      {location ? `${location.city}, ${location.region}` : 'Location not set'}
                    </Typography>
                  </View>
                  <View style={styles.temperatureRow}>
                    <Thermometer size={20} color={colors.primary} />
                    <Typography variant="h2" style={styles.temperature}>
                      {convertTemperature(currentWeather.temperature, units)}{getTemperatureUnit(units)}
                    </Typography>
                  </View>
                  <Typography variant="caption" color={colors.textSecondary}>
                    {currentWeather.description}
                  </Typography>
                </View>
                <Pressable style={styles.weatherButton} onPress={handleWeatherPress}>
                  <Typography variant="caption" color={colors.primary} style={styles.weatherButtonText}>
                    View Details
                  </Typography>
                </Pressable>
              </View>
            </Card>

            {/* Weather-Based Recommendations */}
            <View style={styles.sectionHeader}>
              <Typography variant="h2" style={styles.sectionTitle}>
                Weather Recommendations
              </Typography>
              {!location && (
                <Pressable onPress={() => router.push('/location-settings')}>
                  <Typography variant="caption" color={colors.primary}>
                    Set Location
                  </Typography>
                </Pressable>
              )}
            </View>

            {isLoadingRecommendations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Typography variant="caption" color={colors.textSecondary} style={styles.loadingText}>
                  Loading recommendations...
                </Typography>
              </View>
            ) : weatherRecommendations.length > 0 ? (
              <View style={styles.recommendationsContainer}>
                {weatherRecommendations.map((recommendation) => (
                  <Card key={recommendation.id} style={styles.recommendationCard}>
                    <View style={styles.recommendationHeader}>
                      <Typography variant="body" style={styles.recommendationTitle}>
                        {recommendation.title}
                      </Typography>
                      <View style={styles.confidenceBadge}>
                        <Typography variant="small" color={colors.primary}>
                          {recommendation.confidence}%
                        </Typography>
                      </View>
                    </View>
                    <Typography variant="caption" color={colors.textSecondary} style={styles.recommendationDescription}>
                      {recommendation.description}
                    </Typography>
                    <View style={styles.recommendationItems}>
                      {recommendation.items.slice(0, 3).map((item) => (
                        <View key={item.id} style={styles.recommendationItem}>
                          <View style={styles.itemImagePlaceholder}>
                            <Typography variant="small">{item.category.charAt(0).toUpperCase()}</Typography>
                          </View>
                          <Typography variant="small" color={colors.textSecondary} style={styles.itemName}>
                            {item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name}
                          </Typography>
                        </View>
                      ))}
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <Card style={styles.noRecommendationsCard}>
                <Typography variant="body" color={colors.textSecondary} style={styles.noRecommendationsText}>
                  {location ? 'No weather-based recommendations available' : 'Set your location to get personalized weather recommendations'}
                </Typography>
                <Pressable 
                  style={styles.setupLocationButton} 
                  onPress={() => router.push(location ? '/ai-recommendations' : '/location-settings')}
                >
                  <Typography variant="caption" color={colors.primary}>
                    {location ? 'View AI Recommendations' : 'Set Location'}
                  </Typography>
                </Pressable>
              </Card>
            )}

            <View style={styles.sectionHeader}>
              <Typography variant="h2" style={styles.sectionTitle}>
                AI-powered wardrobe suggestion
              </Typography>
            </View>

            <View style={styles.aiOptionsGrid}>
              {aiSuggestionOptions.map((option) => (
                <Pressable
                  key={option.id}
                  style={styles.aiOptionCard}
                  onPress={() => handleQuickAIPress(option.id)}
                >
                  <View style={[styles.aiOptionIcon, { backgroundColor: option.color + '20' }]}>
                    <Typography variant="h3" style={styles.aiOptionEmoji}>
                      {option.icon}
                    </Typography>
                  </View>
                  <Typography variant="body" style={styles.aiOptionTitle}>
                    {option.title}
                  </Typography>
                  <Typography variant="caption" color={colors.textSecondary} style={styles.aiOptionSubtitle}>
                    {option.subtitle}
                  </Typography>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.viewAllAIButton} onPress={handleAIRecommendationPress}>
              <Sparkles size={18} color={colors.primary} />
              <Typography variant="body" color={colors.primary} style={styles.viewAllAIText}>
                View All AI Options
              </Typography>
            </Pressable>

            <View style={styles.sectionHeader}>
              <Typography variant="h3" style={styles.sectionTitle}>
                Your Collections
              </Typography>
              <Pressable onPress={() => router.push('/wardrobe')}>
                <Typography variant="caption" color={colors.primary}>
                  View All
                </Typography>
              </Pressable>
            </View>

            <View style={styles.collectionsGrid}>
              <Card style={styles.collectionCard}>
                <Typography variant="h3" color={colors.text}>
                  42
                </Typography>
                <Typography variant="caption" color={colors.textSecondary}>
                  Total Items
                </Typography>
              </Card>
              
              <Card style={styles.collectionCard}>
                <Typography variant="h3" color={colors.success}>
                  $2,340
                </Typography>
                <Typography variant="caption" color={colors.textSecondary}>
                  Total Value
                </Typography>
              </Card>
            </View>

            <View style={styles.quickActions}>
              <Pressable 
                style={styles.actionButton}
                onPress={() => router.push('/outfits')}
              >
                <Sparkles size={20} color={colors.primary} />
                <Typography variant="caption" color={colors.text} style={styles.actionText}>
                  Generate Outfit
                </Typography>
              </Pressable>
              
              <Pressable 
                style={styles.actionButton}
                onPress={() => router.push('/calendar')}
              >
                <Scan size={20} color={colors.secondary} />
                <Typography variant="caption" color={colors.text} style={styles.actionText}>
                  Plan Outfits
                </Typography>
              </Pressable>
            </View>

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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.xl,
  },
  greeting: {
    marginBottom: tokens.spacing.xs,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadow.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacing.xl,
    marginBottom: tokens.spacing.lg,
  },
  sectionTitle: {
    flex: 1,
  },
  collectionsGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  collectionCard: {
    flex: 1,
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.lg,
    ...tokens.shadow.sm,
  },
  actionText: {
    marginLeft: tokens.spacing.xs,
  },
  aiOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  aiOptionCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    alignItems: 'center',
    ...tokens.shadow.sm,
  },
  aiOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  aiOptionEmoji: {
    fontSize: 20,
  },
  aiOptionTitle: {
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
    fontWeight: '600',
  },
  aiOptionSubtitle: {
    textAlign: 'center',
    fontSize: 12,
  },
  viewAllAIButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    ...tokens.shadow.sm,
  },
  viewAllAIText: {
    marginLeft: tokens.spacing.sm,
    fontWeight: '600',
  },
  weatherCard: {
    marginBottom: tokens.spacing.lg,
    padding: tokens.spacing.lg,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weatherInfo: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  locationText: {
    marginLeft: tokens.spacing.xs,
  },
  temperatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  temperature: {
    marginLeft: tokens.spacing.xs,
    fontWeight: '700',
  },
  weatherButton: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: tokens.radius.md,
  },
  weatherButtonText: {
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing.xl,
  },
  loadingText: {
    marginLeft: tokens.spacing.sm,
  },
  recommendationsContainer: {
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  recommendationCard: {
    padding: tokens.spacing.lg,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  recommendationTitle: {
    fontWeight: '600',
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radius.sm,
  },
  recommendationDescription: {
    marginBottom: tokens.spacing.md,
  },
  recommendationItems: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  recommendationItem: {
    alignItems: 'center',
    flex: 1,
  },
  itemImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.xs,
  },
  itemName: {
    textAlign: 'center',
  },
  noRecommendationsCard: {
    padding: tokens.spacing.xl,
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  noRecommendationsText: {
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  setupLocationButton: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: tokens.radius.md,
  },
});