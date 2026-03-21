import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, ScrollView, Pressable, SafeAreaView,
  Image, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Plus, Bookmark, RefreshCw, Sparkles } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import { useWardrobeStore } from '@/store/wardrobeStore';
import Typography from '@/components/ui/Typography';
import SegmentedControl from '@/components/ui/SegmentedControl';
import ClosetSectionRow from '@/components/ui/ClosetSectionRow';
import {
  fetchWeather, getCurrentLocation, geocodeCity, reverseGeocodeCoords,
  shouldRefreshWeather, formatTemperature, getWeatherType,
  getOutfitSuggestion, WeatherResult
} from '@/services/weatherService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEATHER_CACHE_KEY = 'klotho_weather_cache';
const REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { items, getItemsByCategory } = useWardrobeStore();
  const [selectedTab, setSelectedTab] = useState(0);

  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayName = profile?.displayName || 'User';
  const firstName = displayName.split(' ')[0];

  const topsItems = getItemsByCategory('shirts');
  const pantsItems = getItemsByCategory('pants');
  const shoesItems = getItemsByCategory('shoes');
  const totalItems = items.length;

  // Load weather — tries GPS first, falls back to profile city, then cached
  const loadWeather = useCallback(async (force = false) => {
    try {
      // Check cache first
      const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
      if (cached && !force) {
        const parsed: WeatherResult = JSON.parse(cached);
        if (!shouldRefreshWeather(parsed.lastUpdated)) {
          setWeather(parsed);
          return;
        }
      }

      setWeatherLoading(true);

      // Try GPS location first
      let coords = await getCurrentLocation();
      let locationName = 'Your Location';

      if (coords) {
        locationName = await reverseGeocodeCoords(coords.latitude, coords.longitude);
      } else if (profile?.locationPreferences?.location) {
        // Fall back to saved profile location
        coords = {
          latitude: profile.locationPreferences.location.latitude,
          longitude: profile.locationPreferences.location.longitude,
        };
        locationName = profile.locationPreferences.location.city || 'Your Location';
      } else if ((profile as any)?.city) {
        // Fall back to profile city from settings
        const cityCoords = await geocodeCity((profile as any).city);
        if (cityCoords) {
          coords = cityCoords;
          locationName = (profile as any).city;
        }
      }

      if (!coords) {
        setWeatherLoading(false);
        return;
      }

      const result = await fetchWeather(coords.latitude, coords.longitude, locationName);
      setWeather(result);
      await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(result));
    } catch (err) {
      console.warn('Weather fetch failed:', err);
    } finally {
      setWeatherLoading(false);
    }
  }, [profile]);

  // Initial load
  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  // Auto-refresh every 3 hours
  useEffect(() => {
    refreshTimer.current = setInterval(() => {
      loadWeather(true);
    }, REFRESH_INTERVAL_MS);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [loadWeather]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWeather(true);
    setRefreshing(false);
  }, [loadWeather]);

  const handleItemPress = (id: string) => router.push(`/item/${id}` as any);
  const handleAddItem = () => router.push('/add-item' as any);
  const handleProfilePress = () => router.push('/(tabs)/profile' as any);
  const handleCalendarPress = () => router.push('/(tabs)/calendar' as any);
  const handleBookmarkPress = () => router.push('/(tabs)/wishlist' as any);

  const outfitSuggestion = weather ? getOutfitSuggestion(weather.current) : null;

  const weatherIcon = (code: number) => {
    const type = getWeatherType(code);
    if (type === 'sunny') return '☀️';
    if (type === 'rainy') return '🌧️';
    return '⛅';
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                {(profile as any)?.avatar ? (
                  <Image source={{ uri: (profile as any).avatar }} style={styles.avatar} />
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
                  Welcome {firstName}
                </Typography>
                <Pressable onPress={handleProfilePress}>
                  <Typography variant="small" color={colors.primary} style={styles.profileLink}>
                    See your profile
                  </Typography>
                </Pressable>
              </View>
            </View>
            <Pressable style={styles.bookmarkButton} onPress={handleBookmarkPress}>
              <Bookmark size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Location + Calendar row */}
          <View style={styles.locationRow}>
            <Pressable style={styles.locationLeft} onPress={() => router.push('/location-settings' as any)}>
              <MapPin size={16} color={colors.textSecondary} />
              <Typography variant="body" style={styles.locationText}>
                {weather?.current.location || (profile as any)?.city || 'Set location'}
              </Typography>
            </Pressable>
            <Pressable onPress={handleCalendarPress}>
              <Typography variant="caption" color={colors.primary} style={styles.calendarLink}>
                OOTD Calendar
              </Typography>
            </Pressable>
          </View>

          {/* Weather Card */}
          <View style={styles.weatherCard}>
            {weatherLoading ? (
              <View style={styles.weatherLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Typography variant="small" color={colors.textSecondary} style={{ marginLeft: 8 }}>
                  Fetching weather...
                </Typography>
              </View>
            ) : weather ? (
              <>
                {/* Current weather */}
                <View style={styles.weatherCurrent}>
                  <View style={styles.weatherTempRow}>
                    <Typography style={styles.weatherEmoji}>
                      {weatherIcon(weather.current.weatherCode)}
                    </Typography>
                    <View>
                      <Typography style={styles.weatherTemp}>
                        {formatTemperature(weather.current.temperature, 'fahrenheit')}
                      </Typography>
                      <Typography variant="small" color={colors.textSecondary}>
                        Feels like {formatTemperature(weather.current.feelsLike, 'fahrenheit')}
                      </Typography>
                    </View>
                    <View style={styles.weatherDetails}>
                      <Typography variant="small" color={colors.textSecondary}>
                        {weather.current.description}
                      </Typography>
                      <Typography variant="small" color={colors.textSecondary}>
                        💧 {weather.current.humidity}%
                      </Typography>
                      <Typography variant="small" color={colors.textSecondary}>
                        💨 {Math.round(weather.current.windSpeed)} km/h
                      </Typography>
                    </View>
                  </View>

                  {/* 3-day forecast */}
                  <View style={styles.forecastRow}>
                    {weather.forecast.map((day, i) => (
                      <View key={i} style={styles.forecastDay}>
                        <Typography variant="small" color={colors.textSecondary}>{day.day}</Typography>
                        <Typography style={styles.forecastIcon}>{weatherIcon(day.weatherCode)}</Typography>
                        <Typography variant="small" style={styles.forecastHigh}>
                          {Math.round((day.high * 9 / 5) + 32)}°
                        </Typography>
                        <Typography variant="small" color={colors.textSecondary}>
                          {Math.round((day.low * 9 / 5) + 32)}°
                        </Typography>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Outfit suggestion */}
                {outfitSuggestion && (
                  <Pressable
                    style={styles.outfitSuggestion}
                    onPress={() => router.push('/ai-recommendations' as any)}
                  >
                    <Sparkles size={16} color={colors.primary} />
                    <Typography variant="small" color={colors.text} style={styles.outfitSuggestionText}>
                      {outfitSuggestion}
                    </Typography>
                  </Pressable>
                )}

                {/* Last updated */}
                <Pressable style={styles.weatherRefresh} onPress={() => loadWeather(true)}>
                  <RefreshCw size={12} color={colors.textTertiary} />
                  <Typography variant="small" color={colors.textTertiary} style={{ marginLeft: 4 }}>
                    Updated {new Date(weather.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.weatherEmpty} onPress={() => router.push('/location-settings' as any)}>
                <MapPin size={20} color={colors.textSecondary} />
                <Typography variant="small" color={colors.textSecondary} style={{ marginLeft: 8 }}>
                  Tap to set your location for weather
                </Typography>
              </Pressable>
            )}
          </View>

          {/* Closet / Outfit tabs */}
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
                  <Typography variant="h2" style={styles.closetTitle}>Your Closet</Typography>
                  <Typography variant="small" color={colors.textSecondary}>{totalItems} items</Typography>
                </View>
                <Pressable style={styles.addButton} onPress={handleAddItem}>
                  <Plus size={20} color={colors.background} strokeWidth={2.5} />
                </Pressable>
              </View>

              <ClosetSectionRow
                title="Tops"
                items={topsItems.map(item => ({
                  id: item.id, title: item.name,
                  imageUrl: item.imageUrl, wornCount: item.wearCount,
                }))}
                onItemPress={handleItemPress}
                onAddPress={() => handleAddItem()}
              />
              <ClosetSectionRow
                title="Pants"
                items={pantsItems.map(item => ({
                  id: item.id, title: item.name,
                  imageUrl: item.imageUrl, wornCount: item.wearCount,
                }))}
                onItemPress={handleItemPress}
                onAddPress={() => handleAddItem()}
              />
              <ClosetSectionRow
                title="Shoes"
                items={shoesItems.map(item => ({
                  id: item.id, title: item.name,
                  imageUrl: item.imageUrl, wornCount: item.wearCount,
                }))}
                onItemPress={handleItemPress}
                onAddPress={() => handleAddItem()}
              />
            </>
          ) : (
            <View style={styles.emptyOutfitContainer}>
              <Typography variant="body" color={colors.textSecondary} style={styles.emptyText}>
                Your outfits will appear here
              </Typography>
              <Pressable
                style={styles.createOutfitButton}
                onPress={() => router.push('/add-outfit' as any)}
              >
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
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingBottom: 100 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg, paddingTop: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarContainer: { marginRight: tokens.spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  greetingContainer: { flex: 1 },
  greeting: { fontWeight: '700', marginBottom: 2 },
  profileLink: { fontSize: 12 },
  bookmarkButton: { padding: tokens.spacing.xs },
  locationRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.md,
  },
  locationLeft: { flexDirection: 'row', alignItems: 'center' },
  locationText: { marginLeft: tokens.spacing.xs, fontWeight: '500' },
  calendarLink: { fontWeight: '600', letterSpacing: 0.5 },
  // Weather card
  weatherCard: {
    marginHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.lg,
    backgroundColor: colors.card, borderRadius: tokens.radius.xl,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  weatherLoading: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  weatherEmpty: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  weatherCurrent: { padding: tokens.spacing.md },
  weatherTempRow: {
    flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  weatherEmoji: { fontSize: 40 },
  weatherTemp: { fontSize: 32, fontWeight: '700', color: colors.text },
  weatherDetails: { flex: 1, gap: 2 },
  forecastRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: tokens.spacing.md,
  },
  forecastDay: { alignItems: 'center', gap: 4 },
  forecastIcon: { fontSize: 20 },
  forecastHigh: { fontWeight: '600', color: colors.text },
  outfitSuggestion: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: tokens.spacing.md, backgroundColor: colors.primaryLight,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  outfitSuggestionText: { flex: 1, lineHeight: 18 },
  weatherRefresh: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 8, borderTopWidth: 1, borderTopColor: colors.border,
  },
  // Closet section
  segmentContainer: {
    paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.lg,
  },
  closetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.lg,
  },
  closetTitle: { fontWeight: '700', marginBottom: 2 },
  addButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  emptyOutfitContainer: {
    paddingHorizontal: tokens.spacing.lg, paddingVertical: tokens.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: { marginBottom: tokens.spacing.md, textAlign: 'center' },
  createOutfitButton: {
    paddingVertical: tokens.spacing.md, paddingHorizontal: tokens.spacing.lg,
    backgroundColor: colors.primaryLight, borderRadius: tokens.radius.lg,
  },
  createOutfitText: { fontWeight: '600' },
});
