import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable,
  TextInput, Switch, Alert, ActivityIndicator, Platform
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  MapPin, Search, Thermometer, Cloud, Sun,
  Wind, Droplets, Eye, ChevronRight, Save, X, RefreshCw
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import {
  LocationData, UnitSystem, TemperatureBasis,
  WeatherFlags, LocationPreferences
} from '@/types/wardrobe';
import {
  getCurrentLocation,
  shouldRefreshWeather,
  convertTemperature,
  getTemperatureUnit,
} from '@/services/weatherService';

export default function LocationSettingsScreen() {
  const router = useRouter();
  const { profile, updateLocationPreferences, updateWeatherCache, weatherCache } = useUserStore();

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [location, setLocation] = useState<LocationData | undefined>(profile?.locationPreferences?.location);
  const [units, setUnits] = useState<UnitSystem>(profile?.locationPreferences?.units || 'imperial');
  const [tempBasis, setTempBasis] = useState<TemperatureBasis>(profile?.locationPreferences?.tempBasis || 'actual');
  const [weatherFlags, setWeatherFlags] = useState<WeatherFlags>(
    profile?.locationPreferences?.weatherFlags || {
      rain: true, wind: true, uv: true, humidity: true, pollen: false,
    }
  );

  // Real location search using Open-Meteo geocoding API
  const handleSearch = async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`
      );
      const data = await res.json();
      if (data.results?.length > 0) {
        const mapped: LocationData[] = data.results.map((r: any) => ({
          placeId: String(r.id),
          city: r.name,
          region: r.admin1 || r.country,
          country: r.country,
          latitude: r.latitude,
          longitude: r.longitude,
          timezone: r.timezone || 'UTC',
        }));
        setSearchResults(mapped);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search locations');
    } finally {
      setIsSearching(false);
    }
  };

  // Use GPS to get current location
  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const coords = await getCurrentLocation();
      if (coords) {
        // Reverse geocode using Nominatim (free, no key needed)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
        );
        const geo = await res.json();
        const locationData: LocationData = {
          placeId: 'current',
          city: geo.address?.city || geo.address?.town || geo.address?.village || 'Your Location',
          region: geo.address?.state || '',
          country: geo.address?.country || '',
          latitude: coords.latitude,
          longitude: coords.longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        setLocation(locationData);
        setShowSearch(false);
        Alert.alert('Success', `Location set to ${locationData.city}`);
      } else {
        Alert.alert('Error', 'Location permission denied or unavailable');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLocation = (selectedLocation: LocationData) => {
    setLocation(selectedLocation);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRefreshWeather = () => {
    Alert.alert('Success', 'Pull down on the home screen to refresh weather data');
  };

  const handleSave = async () => {
    if (!location) {
      Alert.alert('Error', 'Please select a location');
      return;
    }
    setIsLoading(true);
    try {
      const preferences: Partial<LocationPreferences> = {
        location, units, tempBasis, weatherFlags,
        lastWeatherSync: Date.now(),
      };
      updateLocationPreferences(preferences);
      Alert.alert('Success', 'Location preferences saved', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery) handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const needsWeatherRefresh = shouldRefreshWeather(profile?.locationPreferences?.lastWeatherSync);
  const lastSync = profile?.locationPreferences?.lastWeatherSync
    ? new Date(profile.locationPreferences.lastWeatherSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Never';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Location & Preferences',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable style={styles.headerButton} onPress={() => router.back()}>
                <X size={20} color={colors.subtext} />
              </Pressable>
              <Pressable
                style={[styles.headerButton, styles.saveHeaderButton]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator size="small" color="white" />
                  : <Save size={20} color="white" />
                }
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Pressable style={styles.locationCard} onPress={() => setShowSearch(!showSearch)}>
            <View style={styles.locationInfo}>
              <MapPin size={20} color={colors.primary} />
              <View style={styles.locationText}>
                <Text style={styles.locationName}>
                  {location ? `${location.city}, ${location.region}` : 'Select location'}
                </Text>
                {location && <Text style={styles.locationCountry}>{location.country}</Text>}
              </View>
            </View>
            <ChevronRight size={20} color={colors.subtext} />
          </Pressable>

          {showSearch && (
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={16} color={colors.subtext} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for a city..."
                  placeholderTextColor={colors.subtext}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {isSearching && <ActivityIndicator size="small" color={colors.primary} />}
              </View>

              <Pressable style={styles.currentLocationButton} onPress={handleUseCurrentLocation} disabled={isLoading}>
                <MapPin size={16} color={colors.primary} />
                <Text style={styles.currentLocationText}>Use current location</Text>
              </Pressable>

              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  {searchResults.map((result) => (
                    <Pressable key={result.placeId} style={styles.searchResult} onPress={() => handleSelectLocation(result)}>
                      <Text style={styles.searchResultName}>{result.city}, {result.region}</Text>
                      <Text style={styles.searchResultCountry}>{result.country}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Weather Sync Status */}
        {location && (
          <View style={styles.section}>
            <View style={styles.weatherSyncHeader}>
              <Text style={styles.sectionTitle}>Weather Data</Text>
              <Pressable style={styles.refreshButton} onPress={handleRefreshWeather}>
                <RefreshCw size={16} color={colors.primary} />
                <Text style={styles.refreshText}>Refresh</Text>
              </Pressable>
            </View>
            <View style={styles.syncStatus}>
              <Text style={styles.syncText}>Last updated: {lastSync}</Text>
              {needsWeatherRefresh && (
                <Text style={styles.syncWarning}>Weather data may be outdated</Text>
              )}
            </View>
          </View>
        )}

        {/* Unit System */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unit System</Text>
          <View style={styles.optionGroup}>
            {(['metric', 'imperial'] as UnitSystem[]).map((u) => (
              <Pressable key={u} style={[styles.option, units === u && styles.selectedOption]} onPress={() => setUnits(u)}>
                <View style={styles.optionContent}>
                  <Thermometer size={20} color={units === u ? colors.primary : colors.subtext} />
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, units === u && styles.selectedOptionText]}>
                      {u === 'metric' ? 'Metric' : 'Imperial'}
                    </Text>
                    <Text style={styles.optionSubtitle}>{u === 'metric' ? 'Celsius, km/h' : 'Fahrenheit, mph'}</Text>
                  </View>
                </View>
                <View style={[styles.radio, units === u && styles.radioSelected]} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Temperature Basis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temperature Preference</Text>
          <View style={styles.optionGroup}>
            <Pressable style={[styles.option, tempBasis === 'actual' && styles.selectedOption]} onPress={() => setTempBasis('actual')}>
              <View style={styles.optionContent}>
                <Sun size={20} color={tempBasis === 'actual' ? colors.primary : colors.subtext} />
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, tempBasis === 'actual' && styles.selectedOptionText]}>Actual Temperature</Text>
                  <Text style={styles.optionSubtitle}>Use measured temperature</Text>
                </View>
              </View>
              <View style={[styles.radio, tempBasis === 'actual' && styles.radioSelected]} />
            </Pressable>
            <Pressable style={[styles.option, tempBasis === 'feelsLike' && styles.selectedOption]} onPress={() => setTempBasis('feelsLike')}>
              <View style={styles.optionContent}>
                <Eye size={20} color={tempBasis === 'feelsLike' ? colors.primary : colors.subtext} />
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, tempBasis === 'feelsLike' && styles.selectedOptionText]}>Feels Like</Text>
                  <Text style={styles.optionSubtitle}>Use perceived temperature</Text>
                </View>
              </View>
              <View style={[styles.radio, tempBasis === 'feelsLike' && styles.radioSelected]} />
            </Pressable>
          </View>
        </View>

        {/* Weather Sensitivity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weather Sensitivity</Text>
          <Text style={styles.sectionSubtitle}>Choose which conditions affect outfit recommendations</Text>
          <View style={styles.toggleGroup}>
            {[
              { key: 'rain', icon: <Cloud size={20} color={colors.primary} />, title: 'Rain', subtitle: 'Waterproof recommendations' },
              { key: 'wind', icon: <Wind size={20} color={colors.primary} />, title: 'Wind', subtitle: 'Wind-resistant clothing' },
              { key: 'uv', icon: <Sun size={20} color={colors.primary} />, title: 'UV Index', subtitle: 'Sun protection accessories' },
              { key: 'humidity', icon: <Droplets size={20} color={colors.primary} />, title: 'Humidity', subtitle: 'Breathable fabrics' },
            ].map(({ key, icon, title, subtitle }) => (
              <View key={key} style={styles.toggleItem}>
                <View style={styles.toggleContent}>
                  {icon}
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleTitle}>{title}</Text>
                    <Text style={styles.toggleSubtitle}>{subtitle}</Text>
                  </View>
                </View>
                <Switch
                  value={weatherFlags[key as keyof WeatherFlags]}
                  onValueChange={(val) => setWeatherFlags(prev => ({ ...prev, [key]: val }))}
                  trackColor={{ false: colors.lightGray, true: colors.primary }}
                  thumbColor={Platform.OS === 'ios' ? undefined : weatherFlags[key as keyof WeatherFlags] ? colors.primary : colors.mediumGray}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerButton: { padding: 8, borderRadius: 8 },
  saveHeaderButton: { backgroundColor: colors.primary, paddingHorizontal: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: colors.subtext, marginBottom: 16 },
  locationCard: {
    backgroundColor: colors.card, borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  locationInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationText: { marginLeft: 12, flex: 1 },
  locationName: { fontSize: 16, fontWeight: '500', color: colors.text },
  locationCountry: { fontSize: 14, color: colors.subtext, marginTop: 2 },
  searchContainer: { marginTop: 12, backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.lightGray, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: colors.text },
  currentLocationButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
  currentLocationText: { marginLeft: 8, fontSize: 16, color: colors.primary, fontWeight: '500' },
  searchResults: { borderTopWidth: 1, borderTopColor: colors.lightGray, paddingTop: 12 },
  searchResult: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  searchResultName: { fontSize: 16, fontWeight: '500', color: colors.text },
  searchResultCountry: { fontSize: 14, color: colors.subtext, marginTop: 2 },
  weatherSyncHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  refreshButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: colors.card, borderRadius: 8,
  },
  refreshText: { marginLeft: 4, fontSize: 14, color: colors.primary, fontWeight: '500' },
  syncStatus: { backgroundColor: colors.card, borderRadius: 8, padding: 12, marginBottom: 12 },
  syncText: { fontSize: 14, color: colors.text },
  syncWarning: { fontSize: 12, color: colors.warning, marginTop: 4 },
  optionGroup: { backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.lightGray,
  },
  selectedOption: { backgroundColor: colors.primaryLight },
  optionContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  optionText: { marginLeft: 12, flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '500', color: colors.text },
  selectedOptionText: { color: colors.primary },
  optionSubtitle: { fontSize: 14, color: colors.subtext, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.mediumGray },
  radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  toggleGroup: { backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' },
  toggleItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.lightGray,
  },
  toggleContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toggleText: { marginLeft: 12, flex: 1 },
  toggleTitle: { fontSize: 16, fontWeight: '500', color: colors.text },
  toggleSubtitle: { fontSize: 14, color: colors.subtext, marginTop: 2 },
});
