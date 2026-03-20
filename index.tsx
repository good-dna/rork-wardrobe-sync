import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Bookmark, Plus } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { getCurrentLocation, getWeatherIcon, formatTemperature, formatDate, WeatherKitForecastDay, fetchWeatherKit } from '@/services/weatherKitService';
import Typography from '@/components/ui/Typography';
import SegmentedControl from '@/components/ui/SegmentedControl';
import ForecastCard from '@/components/ui/ForecastCard';
import ClosetSectionRow from '@/components/ui/ClosetSectionRow';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { items, getItemsByCategory } = useWardrobeStore();
  const [selectedTab, setSelectedTab] = useState(0);

  const [forecastData, setForecastData] = useState<{ day: string; date: string; temperature: string; weatherType: 'sunny' | 'cloudy' | 'rainy' }[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const location = profile?.locationPreferences?.location;
  const displayName = profile?.displayName || 'User';
  const firstName = displayName.split(' ')[0];

  const topsItems = getItemsByCategory('shirts');
  const pantsItems = getItemsByCategory('pants');
  const shoesItems = getItemsByCategory('shoes');
  const totalItems = items.length;

  const handleItemPress = (id: string) => {
    router.push(`/item/${id}` as any);
  };

  const handleAddItem = (category?: string) => {
    router.push('/add-item' as any);
  };

  // FIX: Correct path — profile is a tab, not a standalone screen
  const handleProfilePress = () => {
    router.push('/(tabs)/profile' as any);
  };

  // FIX: Correct path — calendar is a tab, not a standalone screen
  const handleCalendarPress = () => {
    router.push('/(tabs)/calendar' as any);
  };

  // FIX: Bookmark now navigates to wishlist (previously a dead button with no handler)
  const handleBookmarkPress = () => {
    router.push('/(tabs)/wishlist' as any);
  };

  useEffect(() => {
    const fetchLocationAndWeather = async () => {
      const coords = await getCurrentLocation();
      const locationToUse = coords ||
        (profile?.locationPreferences?.location ? {
          latitude: profile.locationPreferences.location.latitude,
          longitude: profile.locationPreferences.location.longitude
        } : null);

      if (locationToUse) {
        setIsLoadingWeather(true);
        try {
          const weatherData = await fetchWeatherKit(
            locationToUse.latitude,
            locationToUse.longitude,
            'en'
          );

          if (weatherData?.forecastDaily?.days) {
            const days = weatherData.forecastDaily.days.slice(0, 3);
            const formatted = days.map((day: WeatherKitForecastDay) => {
              const { day: dayName, date } = formatDate(day.forecastStart);
              return {
                day: dayName,
                date,
                temperature: formatTemperature(day.temperatureMax),
                weatherType: getWeatherIcon(day.conditionCode),
              };
            });
            setForecastData(formatted);
          }
        } catch (error) {
          console.error('Error fetching weather:', error);
        } finally {
          setIsLoadingWeather(false);
        }
      }
    };
    fetchLocationAndWeather();
  }, [profile]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                {profile?.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Typography variant="h3" color={colors.background}>
                      {firstName.charAt(0)}
                    </Typography>
                  </View>
                )}
              </View>
              <View style={styles.greetingContainer}>
                <Typography variant="h2" style={styles.greeting}>
                  Welcome {displayName}
                </Typography>
                <Pressable onPress={handleProfilePress}>
                  <Typography variant="small" color={colors.primary} style={styles.profileLink}>
                    See your profile
                  </Typography>
                </Pressable>
              </View>
            </View>
            {/* FIX: Bookmark now has an onPress handler that goes to wishlist */}
            <Pressable style={styles.bookmarkButton} onPress={handleBookmarkPress}>
              <Bookmark size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.locationRow}>
            <View style={styles.locationLeft}>
              <MapPin size={16} color={colors.textSecondary} />
              <Typography variant="body" style={styles.locationText}>
                {/* FIX: Replaced hardcoded 'Comilla' fallback with a meaningful prompt */}
                {location?.city || 'Set your location'}
              </Typography>
            </View>
            <Pressable onPress={handleCalendarPress}>
              <Typography variant="caption" color={colors.primary} style={styles.calendarLink}>
                OOTD Calendar
              </Typography>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.forecastContainer}
            contentContainerStyle={styles.forecastContent}
          >
            {isLoadingWeather ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : forecastData.length > 0 ? (
              forecastData.map((forecast, index) => (
                <ForecastCard
                  key={index}
                  day={forecast.day}
                  date={forecast.date}
                  temperature={forecast.temperature}
                  weatherType={forecast.weatherType}
                />
              ))
            ) : (
              <View style={styles.weatherFallback}>
                <Typography variant="small" color={colors.textSecondary}>
                  Weather data unavailable
                </Typography>
              </View>
            )}
          </ScrollView>

          <View style={styles.segmentContainer}>
            <SegmentedControl
              options={['Closet', 'Outfit']}
              selectedIndex={selectedTab}
              onSelectIndex={setSelectedTab}
            />
          </View>

          {selectedTab === 0 ? (
            <>
              <View style={styles.closetHeader}>
                <View>
                  <Typography variant="h2" style={styles.closetTitle}>
                    Your Closet
                  </Typography>
                  <Typography variant="small" color={colors.textSecondary}>
                    {totalItems} items
                  </Typography>
                </View>
                <Pressable style={styles.addButton} onPress={() => handleAddItem()}>
                  <Plus size={20} color={colors.background} strokeWidth={2.5} />
                </Pressable>
              </View>

              <ClosetSectionRow
                title="Tops"
                items={topsItems.map(item => ({
                  id: item.id,
                  title: item.name,
                  imageUrl: item.imageUrl,
                  wornCount: item.wearCount,
                }))}
                onItemPress={handleItemPress}
                onAddPress={() => handleAddItem('shirts')}
              />

              <ClosetSectionRow
                title="Pants"
                items={pantsItems.map(item => ({
                  id: item.id,
                  title: item.name,
                  imageUrl: item.imageUrl,
                  wornCount: item.wearCount,
                }))}
                onItemPress={handleItemPress}
                onAddPress={() => handleAddItem('pants')}
              />

              <ClosetSectionRow
                title="Shoes"
                items={shoesItems.map(item => ({
                  id: item.id,
                  title: item.name,
                  imageUrl: item.imageUrl,
                  wornCount: item.wearCount,
                }))}
                onItemPress={handleItemPress}
                onAddPress={() => handleAddItem('shoes')}
              />
            </>
          ) : (
            <View style={styles.emptyOutfitContainer}>
              <Typography variant="body" color={colors.textSecondary} style={styles.emptyText}>
                Your outfits will appear here
              </Typography>
              <Pressable style={styles.createOutfitButton} onPress={() => router.push('/add-outfit' as any)}>
                <Typography variant="body" color={colors.primary} style={styles.createOutfitText}>
                  Create Your First Outfit
                </Typography>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: tokens.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontWeight: '700',
    marginBottom: 2,
  },
  profileLink: {
    fontSize: 12,
  },
  bookmarkButton: {
    padding: tokens.spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: tokens.spacing.xs,
    fontWeight: '500',
  },
  calendarLink: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  forecastContainer: {
    marginBottom: tokens.spacing.lg,
  },
  forecastContent: {
    paddingHorizontal: tokens.spacing.lg,
  },
  segmentContainer: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  closetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  closetTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyOutfitContainer: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    marginBottom: tokens.spacing.md,
    textAlign: 'center',
  },
  createOutfitButton: {
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    backgroundColor: colors.primaryLight,
    borderRadius: tokens.radius.lg,
  },
  createOutfitText: {
    fontWeight: '600',
  },
  loadingContainer: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  weatherFallback: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
});
