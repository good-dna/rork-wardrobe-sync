import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, ScrollView, Pressable,
  Image, ActivityIndicator, RefreshControl, Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Bookmark, Plus, Sparkles } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import { useWardrobeStore } from '@/store/wardrobeStore';
import ClosetSectionRow from '@/components/ui/ClosetSectionRow';
import {
  fetchWeather, getCurrentLocation, geocodeCity, reverseGeocodeCoords,
  shouldRefreshWeather, getWeatherType, getOutfitSuggestion, WeatherResult
} from '@/services/weatherService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEATHER_CACHE_KEY = 'klotho_weather_cache';
const REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000;
const WEATHER_EMOJI: Record<string, string> = { sunny: '☀️', cloudy: '⛅', rainy: '🌧️' };

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
    width: 95, backgroundColor: colors.card, borderRadius: tokens.radius.lg,
    padding: 12, marginRight: 10, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  day: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 2 },
  date: { fontSize: 10, color: colors.textSecondary, marginBottom: 6 },
  emoji: { fontSize: 28, marginBottom: 4 },
  high: { fontSize: 14, fontWeight: '700', color: colors.text },
  low: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { items, getItemsByCategory } = useWardrobeStore();
  const [selectedTab, setSelectedTab] = useState<'closet' | 'outfit'>('closet');
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayName = profile?.displayName || 'User';
  const firstName = displayName.split(' ')[0];
  const totalItems = items.length;
  const toItem = (item: any) => ({ id: item.id, title: item.name, imageUrl: item.imageUrl, wornCount: item.wearCount });

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

  useEffect(() => { loadWeather(); }, [loadWeather]);
  useEffect(() => {
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

        {/* Location + OOTD row */}
        <View style={s.locationRow}>
          <Pressable style={s.locationLeft} onPress={() => router.push('/location-settings' as any)}>
            <MapPin size={15} color={colors.textSecondary} />
            <Text style={s.locationText}>
              {weather?.current.location || (profile as any)?.city || 'Set location'}
            </Text>
            {currentTemp !== null && <Text style={s.currentTemp}> · {currentTemp}°F</Text>}
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/calendar' as any)}>
            <Text style={s.ootdLink}>OOTD Calendar</Text>
          </Pressable>
        </View>

        {/* Forecast cards */}
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
                  high={day.high}
                  low={day.low}
                  weatherCode={day.weatherCode}
                />
              );
            })}
          </ScrollView>
        ) : (
          <Pressable style={s.weatherEmpty} onPress={() => router.push('/location-settings' as any)}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={s.weatherEmptyText}>  Tap to set location for weather</Text>
          </Pressable>
        )}

        {/* AI suggestion banner */}
        {weather && (
          <Pressable style={s.suggestionCard} onPress={() => router.push('/ai-recommendations' as any)}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={s.suggestionText} numberOfLines={2}>{getOutfitSuggestion(weather.current)}</Text>
            <Text style={s.suggestionCta}>Get outfit →</Text>
          </Pressable>
        )}

        {/* Tab row */}
        <View style={s.tabRow}>
          {(['closet', 'outfit'] as const).map((tab) => (
            <Pressable key={tab} onPress={() => setSelectedTab(tab)} style={s.tabBtn}>
              <Text style={[s.tabLabel, selectedTab === tab && s.tabLabelActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {selectedTab === tab && <View style={s.tabUnderline} />}
            </Pressable>
          ))}
        </View>

        {selectedTab === 'closet' ? (
          <>
            <View style={s.closetHeader}>
              <View>
                <Text style={s.closetTitle}>Your Closet</Text>
                <Text style={s.closetCount}>{totalItems} items</Text>
              </View>
              <Pressable style={s.addButton} onPress={() => router.push('/add-item' as any)}>
                <Plus size={20} color={colors.background} strokeWidth={2.5} />
              </Pressable>
            </View>
            {[
              { title: 'Tops', items: getItemsByCategory('shirts') },
              { title: 'Pants', items: getItemsByCategory('pants') },
              { title: 'Shoes', items: getItemsByCategory('shoes') },
              { title: 'Jackets', items: getItemsByCategory('jackets') },
              { title: 'Accessories', items: getItemsByCategory('accessories') },
              { title: 'Fragrances', items: getItemsByCategory('fragrances') },
            ].map(({ title, items: sectionItems }) => (
              <ClosetSectionRow
                key={title}
                title={title}
                items={sectionItems.map(toItem)}
                onItemPress={(id) => router.push(`/item/${id}` as any)}
                onAddPress={() => router.push('/add-item' as any)}
              />
            ))}
          </>
        ) : (
          <View style={s.emptyOutfit}>
            <Sparkles size={48} color={colors.textSecondary} />
            <Text style={s.emptyOutfitTitle}>No outfits yet</Text>
            <Text style={s.emptyOutfitSub}>Create outfit combinations from your wardrobe</Text>
            <Pressable style={s.createOutfitBtn} onPress={() => router.push('/add-outfit' as any)}>
              <Text style={s.createOutfitBtnText}>Create Your First Outfit</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 120 },
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.md,
  },
  locationLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  currentTemp: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  ootdLink: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  forecastStrip: { paddingHorizontal: tokens.spacing.lg, paddingBottom: tokens.spacing.md },
  weatherLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: tokens.spacing.md },
  weatherLoadingText: { fontSize: 13, color: colors.textSecondary },
  weatherEmpty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: tokens.spacing.md },
  weatherEmptyText: { fontSize: 13, color: colors.textSecondary },
  suggestionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.lg,
    backgroundColor: colors.primaryLight, borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md, borderWidth: 1, borderColor: colors.primary + '30',
  },
  suggestionText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  suggestionCta: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: tokens.spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: tokens.spacing.lg,
  },
  tabBtn: { marginRight: 24, paddingBottom: 0 },
  tabLabel: { fontSize: 16, fontWeight: '500', color: colors.textSecondary, paddingBottom: 10 },
  tabLabelActive: { color: colors.primary, fontWeight: '700' },
  tabUnderline: { height: 2, backgroundColor: colors.primary, borderRadius: 1 },
  closetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.md,
  },
  closetTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  closetCount: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  addButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  emptyOutfit: { alignItems: 'center', paddingVertical: tokens.spacing.xxl, paddingHorizontal: tokens.spacing.xl },
  emptyOutfitTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: tokens.spacing.lg, marginBottom: tokens.spacing.sm },
  emptyOutfitSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: tokens.spacing.xl },
  createOutfitBtn: { backgroundColor: colors.primary, paddingVertical: tokens.spacing.md, paddingHorizontal: tokens.spacing.xl, borderRadius: tokens.radius.lg },
  createOutfitBtnText: { fontSize: 15, fontWeight: '600', color: colors.background },
});
