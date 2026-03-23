import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet, View, ScrollView, Pressable,
  Image, ActivityIndicator, RefreshControl, Text, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Bookmark, Sparkles, TrendingUp, Shirt } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import { useWardrobeStore } from '@/store/wardrobeStore';
import {
  fetchWeather, getCurrentLocation, geocodeCity, reverseGeocodeCoords,
  shouldRefreshWeather, getWeatherType, getOutfitSuggestion, WeatherResult
} from '@/services/weatherService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEATHER_CACHE_KEY = 'klotho_weather_cache';
const REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000;
const WEATHER_EMOJI: Record<string, string> = { sunny: '☀️', cloudy: '⛅', rainy: '🌧️' };
const CATEGORY_EMOJI: Record<string, string> = {
  shirts: '👕', pants: '👖', jackets: '🧥', shoes: '👟', accessories: '👜', fragrances: '🌸'
};

function ForecastCard({ day, date, high, low, weatherCode }: {
  day: string; date: string; high: number; low: number; weatherCode: number;
}) {
  const type = getWeatherType(weatherCode);
  const emoji = WEATHER_EMOJI[type] || '⛅';
  const toF = (c: number) => Math.round((c * 9 / 5) + 32);
  return (
    <View style={fc.card}>
      <Text style={fc.day}>{day}</Text>
      <Text style={fc.date}>{date}</Text>
      <Text style={fc.emoji}>{emoji}</Text>
      <Text style={fc.high}>{toF(high)}°F</Text>
      <Text style={fc.low}>{toF(low)}°F</Text>
    </View>
  );
}

const fc = StyleSheet.create({
  card: {
    width: 80, backgroundColor: 'rgba(11,11,13,0.85)', borderRadius: tokens.radius.lg,
    padding: 10, marginRight: 8, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(245,200,91,0.3)',
  },
  day: { fontSize: 11, fontWeight: '600', color: colors.text, marginBottom: 2 },
  date: { fontSize: 10, color: colors.textSecondary, marginBottom: 4 },
  emoji: { fontSize: 22, marginBottom: 4 },
  high: { fontSize: 13, fontWeight: '700', color: colors.text },
  low: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
});

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { items, outfits, scheduledOutfits, getItemsByCategory, getTotalWardrobeValue } = useWardrobeStore();
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayName = profile?.displayName || 'User';
  const firstName = displayName.split(' ')[0];
  const totalItems = items.length;
  const totalOutfits = outfits.length;
  const wardrobeValue = getTotalWardrobeValue();

  const categoryStats = (['shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'] as const).map(cat => {
    const catItems = getItemsByCategory(cat);
    const unworn = catItems.filter((i: any) => i.wearCount === 0).length;
    const isNew = (i: any) => (Date.now() - new Date(i.purchaseDate || Date.now()).getTime()) / 86400000 <= 30;
    const newCount = catItems.filter(isNew).length;
    return { category: cat, total: catItems.length, unworn, newCount };
  });

  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const scheduled = scheduledOutfits?.filter((o: any) => o.date === dateStr) || [];
    return {
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: i === 0,
      outfitCount: scheduled.length,
    };
  });

  const loadWeather = useCallback(async (force = false) => {
    try {
      const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
      if (cached && !force) {
        const parsed: WeatherResult = JSON.parse(cached);
        if (!shouldRefreshWeather(parsed.lastUpdated)) { setWeather(parsed); return; }
      }
      setWeatherLoading(true);
      let coords = await getCurrentLocation();
      let locationName = 'Your Location';
      if (coords) {
        locationName = await reverseGeocodeCoords(coords.latitude, coords.longitude);
      } else if (profile?.locationPreferences?.location) {
        coords = { latitude: profile.locationPreferences.location.latitude, longitude: profile.locationPreferences.location.longitude };
        locationName = profile.locationPreferences.location.city || 'Your Location';
      } else if ((profile as any)?.city) {
        const c = await geocodeCity((profile as any).city);
        if (c) { coords = c; locationName = (profile as any).city; }
      }
      if (!coords) { setWeatherLoading(false); return; }
      const result = await fetchWeather(coords.latitude, coords.longitude, locationName);
      setWeather(result);
      await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(result));
    } catch (err) { console.warn('Weather fetch failed:', err); }
    finally { setWeatherLoading(false); }
  }, [profile]);

  React.useEffect(() => { loadWeather(); }, [loadWeather]);
  React.useEffect(() => {
    refreshTimer.current = setInterval(() => loadWeather(true), REFRESH_INTERVAL_MS);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [loadWeather]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWeather(true);
    setRefreshing(false);
  }, [loadWeather]);

  const currentTemp = weather ? Math.round((weather.current.temperature * 9 / 5) + 32) : null;

  return (
    <ImageBackground
      source={require('../../assets/images/closet-backdrop.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView style={s.container} edges={['top']}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.avatarCircle}>
                {(profile as any)?.avatar
                  ? <Image source={{ uri: (profile as any).avatar }} style={s.avatar} />
                  : <Text style={s.avatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
                }
              </View>
              <View>
                <Text style={s.welcomeText}>Welcome {firstName}</Text>
                <Pressable onPress={() => router.push('/(tabs)/profile' as any)}>
                  <Text style={s.profileLink}>See your profile</Text>
                </Pressable>
              </View>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/wishlist' as any)}>
              <Bookmark size={22} color={colors.text} />
            </Pressable>
          </View>

          {/* Location row */}
          <Pressable style={s.locationRow} onPress={() => router.push('/location-settings' as any)}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={s.locationText}>
              {weather?.current.location || (profile as any)?.city || 'Set location'}
            </Text>
            {currentTemp !== null && <Text style={s.currentTemp}> · {currentTemp}°F</Text>}
          </Pressable>

          {/* Weather box */}
          <View style={s.sectionBox}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Weather</Text>
            </View>
            {weatherLoading ? (
              <View style={s.weatherLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={s.weatherLoadingText}>  Fetching weather...</Text>
              </View>
            ) : weather?.forecast?.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.forecastStrip}>
                {weather.forecast.map((day, i) => {
                  const d = new Date(day.date);
                  return (
                    <ForecastCard
                      key={i}
                      day={d.toLocaleDateString('en-US', { weekday: 'short' })}
                      date={d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      high={day.high} low={day.low} weatherCode={day.weatherCode}
                    />
                  );
                })}
              </ScrollView>
            ) : (
              <Pressable onPress={() => router.push('/location-settings' as any)}>
                <Text style={s.weatherEmptyText}>📍 Tap to set location for weather</Text>
              </Pressable>
            )}
            {weather && (
              <Pressable style={s.suggestionCard} onPress={() => router.push('/ai-recommendations' as any)}>
                <Sparkles size={14} color={colors.primary} />
                <Text style={s.suggestionText} numberOfLines={1}>{getOutfitSuggestion(weather.current)}</Text>
                <Text style={s.suggestionCta}>→</Text>
              </Pressable>
            )}
          </View>

          {/* Outfits Planned box */}
          <View style={s.sectionBox}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Outfits Planned</Text>
              <Pressable onPress={() => router.push('/(tabs)/calendar' as any)}>
                <Text style={s.sectionLink}>View all</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.calendarStrip}>
              {calendarDays.map(({ dateStr, dayName, dayNum, isToday, outfitCount }) => (
                <Pressable
                  key={dateStr}
                  style={[s.calDay, isToday && s.calDayToday]}
                  onPress={() => router.push('/(tabs)/calendar' as any)}
                >
                  <Text style={[s.calDayName, isToday && s.calDayTextToday]}>{dayName}</Text>
                  <Text style={[s.calDayNum, isToday && s.calDayTextToday]}>{dayNum}</Text>
                  {outfitCount > 0
                    ? <View style={s.calDot} />
                    : <View style={s.calDotEmpty} />
                  }
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Stats row */}
          <View style={s.statsRow}>
            <Pressable style={s.statBox} onPress={() => router.push('/(tabs)/wardrobe' as any)}>
              <Shirt size={18} color={colors.primary} />
              <Text style={s.statNum}>{totalItems}</Text>
              <Text style={s.statLabel}>Items</Text>
            </Pressable>
            <Pressable style={s.statBox} onPress={() => router.push('/(tabs)/outfits' as any)}>
              <Sparkles size={18} color={colors.primary} />
              <Text style={s.statNum}>{totalOutfits}</Text>
              <Text style={s.statLabel}>Outfits</Text>
            </Pressable>
            <Pressable style={s.statBox} onPress={() => router.push('/closet-analytics' as any)}>
              <TrendingUp size={18} color={colors.primary} />
              <Text style={s.statNum}>${wardrobeValue.toLocaleString()}</Text>
              <Text style={s.statLabel}>Est. Value</Text>
            </Pressable>
          </View>

          {/* My Closet box */}
          <View style={s.sectionBox}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>My Closet</Text>
              <Pressable onPress={() => router.push('/(tabs)/wardrobe' as any)}>
                <Text style={s.sectionLink}>View all</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryStrip}>
              {categoryStats.map(({ category, total, unworn, newCount }) => (
                <Pressable
                  key={category}
                  style={s.catCard}
                  onPress={() => router.push('/(tabs)/wardrobe' as any)}
                >
                  <Text style={s.catEmoji}>{CATEGORY_EMOJI[category]}</Text>
                  <Text style={s.catName}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                  <Text style={s.catTotal}>{total}</Text>
                  {unworn > 0 && (
                    <View style={s.catBadge}>
                      <Text style={s.catBadgeText}>{unworn} unworn</Text>
                    </View>
                  )}
                  {newCount > 0 && (
                    <View style={[s.catBadge, s.catBadgeNew]}>
                      <Text style={s.catBadgeText}>{newCount} new</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>

        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const BOX_BG = 'rgba(11,11,13,0.82)';
const BOX_BORDER = 'rgba(245,200,91,0.25)';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  content: { paddingBottom: 30 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg, paddingTop: tokens.spacing.sm, paddingBottom: tokens.spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatar: { width: 44, height: 44 },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: colors.background },
  welcomeText: { fontSize: 16, fontWeight: '700', color: colors.text },
  profileLink: { fontSize: 12, color: colors.primary, marginTop: 2 },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.md,
  },
  locationText: { fontSize: 13, color: colors.textSecondary },
  currentTemp: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  // Section boxes
  sectionBox: {
    marginHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.md,
    backgroundColor: BOX_BG, borderRadius: tokens.radius.xl,
    borderWidth: 1, borderColor: BOX_BORDER,
    paddingTop: tokens.spacing.md, overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: tokens.spacing.md, marginBottom: tokens.spacing.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  sectionLink: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  // Weather
  forecastStrip: { paddingHorizontal: tokens.spacing.md, paddingBottom: tokens.spacing.md, gap: 8 },
  weatherLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: tokens.spacing.md },
  weatherLoadingText: { fontSize: 13, color: colors.textSecondary },
  weatherEmptyText: { fontSize: 13, color: colors.textSecondary, padding: tokens.spacing.md },
  suggestionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: tokens.spacing.md, marginBottom: tokens.spacing.md,
    backgroundColor: colors.primaryLight, borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  suggestionText: { flex: 1, fontSize: 12, color: colors.text },
  suggestionCta: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  // Calendar
  calendarStrip: { paddingHorizontal: tokens.spacing.md, paddingBottom: tokens.spacing.md, gap: 8 },
  calDay: {
    width: 52, alignItems: 'center', backgroundColor: 'rgba(28,28,33,0.9)',
    borderRadius: tokens.radius.lg, paddingVertical: 10,
    borderWidth: 1, borderColor: BOX_BORDER,
  },
  calDayToday: { backgroundColor: colors.primary, borderColor: colors.primary },
  calDayName: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  calDayNum: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  calDayTextToday: { color: '#000' },
  calDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  calDotEmpty: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  // Stats
  statsRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.md,
  },
  statBox: {
    flex: 1, backgroundColor: BOX_BG, borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: BOX_BORDER,
  },
  statNum: { fontSize: 18, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  // Category
  categoryStrip: { paddingHorizontal: tokens.spacing.md, paddingBottom: tokens.spacing.md, gap: 10 },
  catCard: {
    width: 88, backgroundColor: 'rgba(28,28,33,0.9)', borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: BOX_BORDER,
  },
  catEmoji: { fontSize: 24, marginBottom: 4 },
  catName: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 2, textTransform: 'capitalize' },
  catTotal: { fontSize: 20, fontWeight: '700', color: colors.text },
  catBadge: { backgroundColor: colors.primary + '25', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  catBadgeNew: { backgroundColor: colors.success + '25' },
  catBadgeText: { fontSize: 9, fontWeight: '600', color: colors.text },
});
