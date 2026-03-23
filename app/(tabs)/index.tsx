import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, ScrollView, Pressable,
  Image, ActivityIndicator, Text
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
import { ImageBackground } from 'react-native';

const WEATHER_CACHE_KEY = 'klotho_weather_cache';
const REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000;
const WEATHER_EMOJI: Record<string, string> = { sunny: '☀️', cloudy: '⛅', rainy: '🌧️' };
const CATEGORY_EMOJI: Record<string, string> = {
  shirts: '👕', pants: '👖', jackets: '🧥', shoes: '👟', accessories: '👜', fragrances: '🌸'
};

function ForecastCard({ day, high, low, weatherCode }: {
  day: string; high: number; low: number; weatherCode: number;
}) {
  const type = getWeatherType(weatherCode);
  const emoji = WEATHER_EMOJI[type] || '⛅';
  const toF = (c: number) => Math.round((c * 9 / 5) + 32);
  return (
    <View style={fc.card}>
      <Text style={fc.day}>{day}</Text>
      <Text style={fc.emoji}>{emoji}</Text>
      <Text style={fc.high}>{toF(high)}°</Text>
      <Text style={fc.low}>{toF(low)}°</Text>
    </View>
  );
}

const fc = StyleSheet.create({
  card: {
    width: 58, backgroundColor: colors.card, borderRadius: tokens.radius.md,
    paddingVertical: 6, paddingHorizontal: 4, marginRight: 6, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  day: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, marginBottom: 2 },
  emoji: { fontSize: 18, marginBottom: 2 },
  high: { fontSize: 12, fontWeight: '700', color: colors.text },
  low: { fontSize: 10, color: colors.textSecondary, marginTop: 1 },
});

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { items, outfits, scheduledOutfits, getItemsByCategory, getTotalWardrobeValue } = useWardrobeStore();
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayName = profile?.displayName || 'User';
  const firstName = displayName.split(' ')[0];
  const totalItems = items.length;
  const totalOutfits = outfits.length;
  const wardrobeValue = getTotalWardrobeValue();

  // Category stats
  const categoryStats = (['shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'] as const).map(cat => {
    const catItems = getItemsByCategory(cat);
    const unworn = catItems.filter((i: any) => i.wearCount === 0).length;
    return { category: cat, total: catItems.length, unworn };
  });

  // Mini calendar — next 7 days
  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const scheduled = scheduledOutfits?.filter((o: any) => o.date === dateStr) || [];
    return {
      _date: d,
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: i === 0,
      outfitCount: scheduled.length,
      outfitName: scheduled[0]?.name || null,
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

  useEffect(() => { void loadWeather(); }, [loadWeather]);
  useEffect(() => {
    refreshTimer.current = setInterval(() => loadWeather(true), REFRESH_INTERVAL_MS);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [loadWeather]);

  const currentTemp = weather ? Math.round((weather.current.temperature * 9 / 5) + 32) : null;

  return (
    <ImageBackground
      source={require('../../assets/images/closet-backdrop.png')}
      style={{ flex: 1 }}
      imageStyle={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    >
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.content}>
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
            <Bookmark size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Location row */}
        <Pressable style={s.locationRow} onPress={() => router.push('/location-settings' as any)}>
          <MapPin size={13} color={colors.textSecondary} />
          <Text style={s.locationText}>
            {weather?.current.location || (profile as any)?.city || 'Set location'}
          </Text>
          {currentTemp !== null && <Text style={s.currentTemp}> · {currentTemp}°F</Text>}
        </Pressable>

        {/* Forecast strip */}
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
                  high={day.high} low={day.low} weatherCode={day.weatherCode}
                />
              );
            })}
          </ScrollView>
        ) : (
          <Pressable style={s.weatherEmpty} onPress={() => router.push('/location-settings' as any)}>
            <Text style={s.weatherEmptyText}>📍 Tap to set location for weather</Text>
          </Pressable>
        )}

        {/* AI suggestion */}
        {weather && (
          <Pressable style={s.suggestionCard} onPress={() => router.push('/ai-recommendations' as any)}>
            <Sparkles size={13} color={colors.primary} />
            <Text style={s.suggestionText} numberOfLines={1}>{getOutfitSuggestion(weather.current)}</Text>
            <Text style={s.suggestionCta}>→</Text>
          </Pressable>
        )}

        {/* Mini Calendar */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Outfits Planned</Text>
          <Pressable onPress={() => router.push('/(tabs)/calendar' as any)}>
            <Text style={s.sectionLink}>View all</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.calendarStrip}>
          {calendarDays.map(({ _date, dateStr, dayName, dayNum, isToday, outfitCount }) => (
            <Pressable
              key={dateStr}
              style={[s.calDay, isToday && s.calDayToday]}
              onPress={() => router.push('/(tabs)/calendar' as any)}
            >
              <Text style={[s.calDayName, isToday && s.calDayTextToday]}>{dayName}</Text>
              <Text style={[s.calDayNum, isToday && s.calDayTextToday]}>{dayNum}</Text>
              {outfitCount > 0 ? (
                <View style={s.calDot} />
              ) : (
                <View style={s.calDotEmpty} />
              )}
            </Pressable>
          ))}
        </ScrollView>

        {/* Stats row */}
        <View style={s.statsRow}>
          <Pressable style={s.statBox} onPress={() => router.push('/(tabs)/wardrobe' as any)}>
            <Shirt size={16} color={colors.primary} />
            <Text style={s.statNum}>{totalItems}</Text>
            <Text style={s.statLabel}>Items</Text>
          </Pressable>
          <Pressable style={s.statBox} onPress={() => router.push('/(tabs)/outfits' as any)}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={s.statNum}>{totalOutfits}</Text>
            <Text style={s.statLabel}>Outfits</Text>
          </Pressable>
          <Pressable style={s.statBox} onPress={() => router.push('/closet-analytics' as any)}>
            <TrendingUp size={16} color={colors.primary} />
            <Text style={s.statNum}>${wardrobeValue.toLocaleString()}</Text>
            <Text style={s.statLabel}>Value</Text>
          </Pressable>
        </View>

        {/* Category stats */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>My Closet</Text>
          <Pressable onPress={() => router.push('/(tabs)/wardrobe' as any)}>
            <Text style={s.sectionLink}>View all</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryStrip}>
          {categoryStats.map(({ category, total, unworn }) => (
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
                  <Text style={s.catBadgeText}>{unworn} new</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { flex: 1, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg, paddingTop: 4, paddingBottom: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatar: { width: 38, height: 38 },
  avatarInitial: { fontSize: 16, fontWeight: '700', color: colors.background },
  welcomeText: { fontSize: 15, fontWeight: '700', color: colors.text },
  profileLink: { fontSize: 11, color: colors.primary, marginTop: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: tokens.spacing.lg, marginBottom: 4 },
  locationText: { fontSize: 12, color: colors.textSecondary },
  currentTemp: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  forecastStrip: { paddingHorizontal: tokens.spacing.lg, paddingBottom: 6 },
  weatherLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  weatherLoadingText: { fontSize: 12, color: colors.textSecondary },
  weatherEmpty: { paddingHorizontal: tokens.spacing.lg, paddingVertical: 6 },
  weatherEmptyText: { fontSize: 12, color: colors.textSecondary },
  suggestionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: tokens.spacing.lg, marginBottom: 8,
    backgroundColor: colors.primaryLight, borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.sm, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  suggestionText: { flex: 1, fontSize: 11, color: colors.text },
  suggestionCta: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg, marginBottom: 4,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  sectionLink: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  calendarStrip: { paddingHorizontal: tokens.spacing.lg, paddingBottom: 8, gap: 6 },
  calDay: {
    width: 46, alignItems: 'center', backgroundColor: 'rgba(11,11,13,0.75)',
    borderRadius: tokens.radius.md, paddingVertical: 6,
    borderWidth: 1.5, borderColor: colors.primary + '60',
  },
  calDayToday: { backgroundColor: colors.primary, borderColor: colors.primary },
  calDayName: { fontSize: 9, color: colors.textSecondary, fontWeight: '600', marginBottom: 1 },
  calDayNum: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 3 },
  calDayTextToday: { color: colors.background },
  calDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary },
  calDotEmpty: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'transparent' },
  statsRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: tokens.spacing.lg, marginBottom: 8,
  },
  statBox: {
    flex: 1, backgroundColor: 'rgba(11,11,13,0.75)', borderRadius: tokens.radius.md,
    paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', gap: 2,
    borderWidth: 1.5, borderColor: colors.primary + '60',
  },
  statNum: { fontSize: 16, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '500' },
  categoryStrip: { paddingHorizontal: tokens.spacing.lg, paddingBottom: 8, gap: 8 },
  catCard: {
    width: 80, backgroundColor: 'rgba(11,11,13,0.75)', borderRadius: tokens.radius.md,
    paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary + '60',
  },
  catEmoji: { fontSize: 20, marginBottom: 2 },
  catName: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, marginBottom: 1, textTransform: 'capitalize' },
  catTotal: { fontSize: 17, fontWeight: '700', color: colors.text },
  catBadge: { backgroundColor: colors.primary + '25', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1, marginTop: 2 },
  catBadgeText: { fontSize: 8, fontWeight: '600', color: colors.text },
});
