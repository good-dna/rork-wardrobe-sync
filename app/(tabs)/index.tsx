import React from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, TrendingUp, Heart, Calendar as CalendarIcon, Plus } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import Typography from '@/components/ui/Typography';
import { trpc } from '@/lib/trpc';
import { 
  convertTemperature, 
  getTemperatureUnit, 
  getMockWeatherData 
} from '@/services/weatherService';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const insets = useSafeAreaInsets();
  
  // Get current weather data
  const currentWeather = getMockWeatherData('sunny');
  const units = profile?.locationPreferences?.units || 'metric';
  const location = profile?.locationPreferences?.location;
  
  // Fetch data using tRPC
  const itemStatsQuery = trpc.wardrobe.items.stats.useQuery();
  const outfitStatsQuery = trpc.wardrobe.outfits.stats.useQuery();
  const plansQuery = trpc.plans.getAll.useQuery();
  const outfitRecommendationsQuery = trpc.wardrobe.outfits.recommendations.useQuery({ limit: 3 });
  
  // Calculate stats
  const totalItems = itemStatsQuery.data?.totalItems || 0;
  const favoriteOutfits = outfitStatsQuery.data?.favoriteOutfits || 0;
  const totalOutfits = outfitStatsQuery.data?.totalOutfits || 0;
  const upcomingPlans = plansQuery.data?.plans?.filter(plan => {
    const planDate = new Date(plan.date_ymd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return planDate >= today;
  }).length || 0;
  
  const handleAddPress = () => {
    router.push('/add-item');
  };

  const handleStatsPress = (type: string) => {
    switch (type) {
      case 'items':
        router.push('/wardrobe');
        break;
      case 'favorites':
        router.push('/outfits?filter=favorites');
        break;
      case 'outfits':
        router.push('/outfits');
        break;
      case 'plans':
        router.push('/calendar');
        break;
    }
  };

  const handleRecommendationPress = (outfitId: string) => {
    router.push(`/outfit/${outfitId}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Typography variant="h1" style={styles.greeting}>
              {`Welcome back, ${profile?.displayName?.split(' ')[0] || 'there'}`}
            </Typography>
            <View style={styles.weatherChip}>
              <MapPin size={14} color={colors.textSecondary} />
              <Typography variant="small" color={colors.textSecondary} style={styles.locationText}>
                {location ? `${location.city}` : 'Set location'}
              </Typography>
              <View style={styles.temperatureChip}>
                <Typography variant="small" color={colors.text}>
                  {convertTemperature(currentWeather.temperature, units)}{getTemperatureUnit(units)}
                </Typography>
              </View>
            </View>
          </View>
          <Pressable style={styles.profileAvatar} onPress={() => router.push('/profile')}>
            <Typography variant="h3" color={colors.primary}>
              {profile?.displayName?.charAt(0) || 'U'}
            </Typography>
          </Pressable>
        </View>

        {/* Stats Cards Grid */}
        <View style={styles.statsGrid}>
          <Pressable style={styles.statCard} onPress={() => handleStatsPress('items')}>
            <View style={styles.statIcon}>
              <TrendingUp size={20} color={colors.primary} />
            </View>
            <Typography variant="h2" color={colors.text} style={styles.statNumber}>
              {totalItems.toString()}
            </Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              Total Items
            </Typography>
          </Pressable>
          
          <Pressable style={styles.statCard} onPress={() => handleStatsPress('favorites')}>
            <View style={styles.statIcon}>
              <Heart size={20} color={colors.error} />
            </View>
            <Typography variant="h2" color={colors.text} style={styles.statNumber}>
              {favoriteOutfits.toString()}
            </Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              Favorites
            </Typography>
          </Pressable>
          
          <Pressable style={styles.statCard} onPress={() => handleStatsPress('outfits')}>
            <View style={styles.statIcon}>
              <TrendingUp size={20} color={colors.success} />
            </View>
            <Typography variant="h2" color={colors.text} style={styles.statNumber}>
              {totalOutfits.toString()}
            </Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              Outfits
            </Typography>
          </Pressable>
          
          <Pressable style={styles.statCard} onPress={() => handleStatsPress('plans')}>
            <View style={styles.statIcon}>
              <CalendarIcon size={20} color={colors.info} />
            </View>
            <Typography variant="h2" color={colors.text} style={styles.statNumber}>
              {upcomingPlans.toString()}
            </Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              Upcoming Plans
            </Typography>
          </Pressable>
        </View>

        {/* Today's Recommendations */}
        <View style={styles.sectionHeader}>
          <Typography variant="h2" style={styles.sectionTitle}>
            Today&apos;s Recommendations
          </Typography>
        </View>

        {outfitRecommendationsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Typography variant="caption" color={colors.textSecondary} style={styles.loadingText}>
              Loading recommendations...
            </Typography>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendationsCarousel}
          >
            {outfitRecommendationsQuery.data?.map((outfit: any) => (
              <Pressable 
                key={outfit.id} 
                style={styles.recommendationCard}
                onPress={() => handleRecommendationPress(outfit.id)}
              >
                <View style={styles.outfitImageContainer}>
                  {outfit.image_url ? (
                    <Image source={{ uri: outfit.image_url }} style={styles.outfitImage} />
                  ) : (
                    <View style={styles.outfitImagePlaceholder}>
                      <Typography variant="h3" color={colors.textSecondary}>
                        {outfit.name.charAt(0)}
                      </Typography>
                    </View>
                  )}
                </View>
                <View style={styles.outfitInfo}>
                  <Typography variant="body" style={styles.outfitName} numberOfLines={1}>
                    {outfit.name}
                  </Typography>
                  <View style={styles.outfitTags}>
                    {outfit.tags?.slice(0, 2).map((tag: string) => (
                      <View key={tag} style={styles.tag}>
                        <Typography variant="small" color={colors.textSecondary}>
                          {tag}
                        </Typography>
                      </View>
                    ))}
                  </View>
                  <Pressable style={styles.tryButton}>
                    <Typography variant="small" color={colors.primary} style={styles.tryButtonText}>
                      Try
                    </Typography>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Activity Feed */}
        <View style={styles.sectionHeader}>
          <Typography variant="h2" style={styles.sectionTitle}>
            Recent Activity
          </Typography>
        </View>

        <View style={styles.activityCard}>
          <Typography variant="body" color={colors.textSecondary} style={styles.activityPlaceholder}>
            Your recent wardrobe activity will appear here
          </Typography>
        </View>

      </ScrollView>
      
      {/* Add Item FAB */}
      <Pressable style={styles.fab} onPress={handleAddPress}>
        <Plus size={24} color={colors.background} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  headerLeft: {
    flex: 1,
  },
  greeting: {
    marginBottom: tokens.spacing.sm,
    color: colors.text,
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    alignSelf: 'flex-start',
  },
  locationText: {
    marginLeft: tokens.spacing.xs,
    marginRight: tokens.spacing.sm,
  },
  temperatureChip: {
    backgroundColor: colors.primary,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radius.sm,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.card,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    marginBottom: tokens.spacing.sm,
  },
  statNumber: {
    marginBottom: tokens.spacing.xs,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
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
  recommendationsCarousel: {
    paddingRight: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  recommendationCard: {
    width: 200,
    backgroundColor: colors.card,
    borderRadius: tokens.radius.lg,
    marginRight: tokens.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  outfitImageContainer: {
    height: 120,
  },
  outfitImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  outfitImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outfitInfo: {
    padding: tokens.spacing.md,
  },
  outfitName: {
    fontWeight: '600',
    marginBottom: tokens.spacing.xs,
    color: colors.text,
  },
  outfitTags: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  tag: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: tokens.radius.sm,
  },
  tryButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
    alignSelf: 'flex-start',
  },
  tryButtonText: {
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: colors.card,
    padding: tokens.spacing.xl,
    borderRadius: tokens.radius.lg,
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityPlaceholder: {
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: tokens.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadow.lg,
  },
});