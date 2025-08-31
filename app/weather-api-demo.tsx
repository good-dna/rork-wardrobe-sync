import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { 
  MapPin, 
  Droplets, 
  Wind, 
  Sun, 
  Eye, 
  Gauge,
  Search,
  RefreshCw,
  Calendar
} from 'lucide-react-native';
import {
  getCurrentWeatherWithLocation,
  getWeatherForecast,
  searchLocations,
  getWeatherRecommendations,
  getWeatherIconUrl,
  formatWeatherDescription,
  getTemperatureUnit,
  getSpeedUnit,
  formatWeatherSyncTime,
  type WeatherData,
  type LocationData,
  type DailyForecast,
  type WeatherRecommendation,
  type UnitSystem
} from '@/services/weatherApiService';

interface WeatherCardProps {
  weather: WeatherData;
  units: UnitSystem;
}

function WeatherCard({ weather, units }: WeatherCardProps) {
  return (
    <View style={styles.weatherCard}>
      <View style={styles.weatherHeader}>
        <View style={styles.locationRow}>
          <MapPin size={16} color="#666" />
          <Text style={styles.locationText}>{weather.location}</Text>
        </View>
        <Text style={styles.lastUpdated}>
          {formatWeatherSyncTime(weather.timestamp)}
        </Text>
      </View>
      
      <View style={styles.mainWeather}>
        <Image 
          source={{ uri: getWeatherIconUrl(weather.icon, '4x') }}
          style={styles.weatherIcon}
        />
        <View style={styles.temperatureContainer}>
          <Text style={styles.temperature}>
            {weather.temperature}{getTemperatureUnit(units)}
          </Text>
          <Text style={styles.feelsLike}>
            Feels like {weather.feelsLike}{getTemperatureUnit(units)}
          </Text>
          <Text style={styles.description}>
            {formatWeatherDescription(weather.description)}
          </Text>
        </View>
      </View>
      
      <View style={styles.weatherDetails}>
        <View style={styles.detailItem}>
          <Droplets size={16} color="#4A90E2" />
          <Text style={styles.detailLabel}>Humidity</Text>
          <Text style={styles.detailValue}>{weather.humidity}%</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Wind size={16} color="#4A90E2" />
          <Text style={styles.detailLabel}>Wind</Text>
          <Text style={styles.detailValue}>
            {Math.round(weather.windSpeed)} {getSpeedUnit(units)}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Sun size={16} color="#4A90E2" />
          <Text style={styles.detailLabel}>UV Index</Text>
          <Text style={styles.detailValue}>{weather.uvIndex}</Text>
        </View>
        
        {weather.visibility && (
          <View style={styles.detailItem}>
            <Eye size={16} color="#4A90E2" />
            <Text style={styles.detailLabel}>Visibility</Text>
            <Text style={styles.detailValue}>
              {Math.round(weather.visibility / 1000)}km
            </Text>
          </View>
        )}
        
        {weather.pressure && (
          <View style={styles.detailItem}>
            <Gauge size={16} color="#4A90E2" />
            <Text style={styles.detailLabel}>Pressure</Text>
            <Text style={styles.detailValue}>{weather.pressure}hPa</Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface ForecastCardProps {
  forecast: DailyForecast[];
  units: UnitSystem;
}

function ForecastCard({ forecast, units }: ForecastCardProps) {
  return (
    <View style={styles.forecastCard}>
      <View style={styles.cardHeader}>
        <Calendar size={20} color="#333" />
        <Text style={styles.cardTitle}>5-Day Forecast</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.forecastContainer}>
          {forecast.map((day, index) => (
            <View key={day.date} style={styles.forecastItem}>
              <Text style={styles.forecastDate}>
                {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Image 
                source={{ uri: getWeatherIconUrl(day.icon) }}
                style={styles.forecastIcon}
              />
              <Text style={styles.forecastHigh}>
                {day.high}{getTemperatureUnit(units)}
              </Text>
              <Text style={styles.forecastLow}>
                {day.low}{getTemperatureUnit(units)}
              </Text>
              <Text style={styles.forecastPrecip}>
                {day.precipProb}%
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

interface RecommendationCardProps {
  recommendations: WeatherRecommendation[];
}

function RecommendationCard({ recommendations }: RecommendationCardProps) {
  if (recommendations.length === 0) return null;
  
  return (
    <View style={styles.recommendationCard}>
      <Text style={styles.cardTitle}>Weather Recommendations</Text>
      
      {recommendations.slice(0, 2).map((rec) => (
        <View key={rec.id} style={styles.recommendationItem}>
          <View style={styles.recommendationHeader}>
            <Text style={styles.recommendationTitle}>{rec.title}</Text>
            <Text style={styles.confidenceScore}>{rec.confidence}%</Text>
          </View>
          <Text style={styles.recommendationDescription}>{rec.description}</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.recommendationItems}>
              {rec.items.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.recommendationItemCard}>
                  <Image 
                    source={{ uri: item.imageUrl }}
                    style={styles.recommendationItemImage}
                  />
                  <Text style={styles.recommendationItemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.fitScore}>Fit: {item.fitScore}%</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

export default function WeatherAPIDemo() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [recommendations, setRecommendations] = useState<WeatherRecommendation[]>([]);
  const [units, setUnits] = useState<UnitSystem>('metric');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const loadWeatherData = async (coords?: { latitude: number; longitude: number }) => {
    setLoading(true);
    try {
      let weatherData, locationData;
      
      if (coords) {
        // Use provided coordinates - simplified for demo
        const result = await getCurrentWeatherWithLocation(units);
        if (result) {
          weatherData = result.weather;
          locationData = result.location;
        }
      } else {
        // Use current location
        const result = await getCurrentWeatherWithLocation(units);
        if (result) {
          weatherData = result.weather;
          locationData = result.location;
        }
      }
      
      if (weatherData && locationData) {
        setWeather(weatherData);
        setLocation(locationData);
        
        // Load forecast and recommendations
        const [forecastData, recommendationsData] = await Promise.all([
          getWeatherForecast(locationData.latitude, locationData.longitude, units),
          getWeatherRecommendations(locationData.latitude, locationData.longitude, units)
        ]);
        
        if (forecastData) {
          setForecast(forecastData.daily);
        }
        
        setRecommendations(recommendationsData);
      } else {
        Alert.alert('Error', 'Could not load weather data. Please check your location permissions.');
      }
    } catch (error) {
      console.error('Error loading weather data:', error);
      Alert.alert('Error', 'Failed to load weather data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const results = await searchLocations(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectLocation = (selectedLocation: LocationData) => {
    setLocation(selectedLocation);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    loadWeatherData({ 
      latitude: selectedLocation.latitude, 
      longitude: selectedLocation.longitude 
    });
  };

  const toggleUnits = () => {
    const newUnits = units === 'metric' ? 'imperial' : 'metric';
    setUnits(newUnits);
    if (location) {
      loadWeatherData({ 
        latitude: location.latitude, 
        longitude: location.longitude 
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWeatherData();
  };

  useEffect(() => {
    loadWeatherData();
  }, [units]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Weather API Demo',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                onPress={toggleUnits}
                style={styles.unitsButton}
              >
                <Text style={styles.unitsButtonText}>
                  {units === 'metric' ? '°C' : '°F'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setShowSearch(!showSearch)}
                style={styles.searchButton}
              >
                <Search size={20} color="#007AFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => loadWeatherData()}
                style={styles.refreshButton}
                disabled={loading}
              >
                <RefreshCw size={20} color={loading ? '#ccc' : '#007AFF'} />
              </TouchableOpacity>
            </View>
          )
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {showSearch && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a city..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                handleSearch(text);
              }}
            />
            
            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                {searchResults.map((result) => (
                  <TouchableOpacity
                    key={result.placeId}
                    style={styles.searchResultItem}
                    onPress={() => selectLocation(result)}
                  >
                    <MapPin size={16} color="#666" />
                    <Text style={styles.searchResultText}>
                      {result.city}, {result.region} {result.country}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        
        {loading && !weather ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading weather data...</Text>
          </View>
        ) : weather ? (
          <>
            <WeatherCard weather={weather} units={units} />
            
            {forecast.length > 0 && (
              <ForecastCard forecast={forecast} units={units} />
            )}
            
            <RecommendationCard recommendations={recommendations} />
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Unable to load weather data. Please check your internet connection and location permissions.
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => loadWeatherData()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollView: {
    flex: 1
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  unitsButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#007AFF',
    borderRadius: 4
  },
  unitsButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  searchButton: {
    padding: 4
  },
  refreshButton: {
    padding: 4
  },
  searchContainer: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16
  },
  searchResults: {
    marginTop: 8
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 8
  },
  searchResultText: {
    fontSize: 14,
    color: '#333'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  errorContainer: {
    margin: 16,
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center'
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  weatherCard: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666'
  },
  mainWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  weatherIcon: {
    width: 80,
    height: 80
  },
  temperatureContainer: {
    flex: 1,
    marginLeft: 16
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333'
  },
  feelsLike: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
    textTransform: 'capitalize'
  },
  weatherDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  detailItem: {
    alignItems: 'center',
    minWidth: 80
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2
  },
  forecastCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  forecastContainer: {
    flexDirection: 'row',
    gap: 16
  },
  forecastItem: {
    alignItems: 'center',
    minWidth: 80
  },
  forecastDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  forecastIcon: {
    width: 40,
    height: 40,
    marginBottom: 8
  },
  forecastHigh: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  forecastLow: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  forecastPrecip: {
    fontSize: 12,
    color: '#4A90E2',
    marginTop: 4
  },
  recommendationCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  recommendationItem: {
    marginBottom: 20
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  confidenceScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  recommendationItems: {
    flexDirection: 'row',
    gap: 12
  },
  recommendationItemCard: {
    width: 100,
    alignItems: 'center'
  },
  recommendationItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8
  },
  recommendationItemName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginBottom: 4
  },
  fitScore: {
    fontSize: 10,
    color: '#4A90E2',
    fontWeight: '600'
  }
});