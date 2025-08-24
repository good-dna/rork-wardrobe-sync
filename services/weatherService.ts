import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { 
  LocationData, 
  DailyWeather, 
  HourlyWeather, 
  WeatherCache, 
  UnitSystem,
  WeatherRule,
  EnhancedItem
} from '@/types/wardrobe';

// Weather API key - in a real app, this would be stored in environment variables
const WEATHER_API_KEY = 'demo_key';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';
const GEOCODING_API_URL = 'https://api.openweathermap.org/geo/1.0';

export interface WeatherData {
  temperature: number; // in Celsius
  feelsLike: number; // in Celsius
  description: string;
  icon: string;
  precipitation: number; // probability of precipitation (0-1)
  humidity: number; // percentage
  windSpeed: number; // in m/s
  uvIndex: number; // UV index (0-11+)
  location: string;
  timestamp: number;
}

// Location Services
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    if (Platform.OS === 'web') {
      // Use web geolocation API
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          console.log('Geolocation not supported on web');
          resolve(null);
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.error('Web geolocation error:', error);
            resolve(null);
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    } else {
      // Use Expo Location for mobile
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Location permission denied');
        return null;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    }
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

export async function searchLocations(query: string): Promise<LocationData[]> {
  try {
    // In a real app, use Google Places API or similar
    // For demo, return mock results
    const mockResults: LocationData[] = [
      {
        placeId: '1',
        city: 'New York',
        region: 'NY',
        country: 'US',
        latitude: 40.7128,
        longitude: -74.0060,
        timezone: 'America/New_York'
      },
      {
        placeId: '2',
        city: 'London',
        region: 'England',
        country: 'UK',
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: 'Europe/London'
      },
      {
        placeId: '3',
        city: 'Tokyo',
        region: 'Tokyo',
        country: 'JP',
        latitude: 35.6762,
        longitude: 139.6503,
        timezone: 'Asia/Tokyo'
      },
      {
        placeId: '4',
        city: 'Paris',
        region: 'Île-de-France',
        country: 'FR',
        latitude: 48.8566,
        longitude: 2.3522,
        timezone: 'Europe/Paris'
      },
      {
        placeId: '5',
        city: 'Sydney',
        region: 'NSW',
        country: 'AU',
        latitude: -33.8688,
        longitude: 151.2093,
        timezone: 'Australia/Sydney'
      }
    ];
    
    return mockResults.filter(location => 
      location.city.toLowerCase().includes(query.toLowerCase()) ||
      location.region.toLowerCase().includes(query.toLowerCase()) ||
      location.country.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationData | null> {
  try {
    // In a real app, use the geocoding API
    // For demo, return mock data based on coordinates
    return {
      placeId: 'current',
      city: 'Current Location',
      region: 'Unknown',
      country: 'Unknown',
      latitude,
      longitude,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

// Weather Data Fetching
export async function getWeatherData(): Promise<WeatherData | null> {
  try {
    const location = await getCurrentLocation();
    
    if (!location) {
      return null;
    }
    
    // For demo purposes, return mock data
    // In a real app, fetch from weather API
    return getMockWeatherData('sunny');
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

export async function getDetailedWeatherData(locationData: LocationData, units: UnitSystem = 'metric'): Promise<WeatherCache | null> {
  try {
    // In a real app, fetch detailed weather data from API
    // For demo, return mock detailed data
    const now = new Date();
    const daily: DailyWeather[] = [];
    const hourly: HourlyWeather[] = [];
    
    // Generate 7 days of mock daily weather
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      const baseTemp = 20 + Math.random() * 15; // 20-35°C
      daily.push({
        date: date.toISOString().split('T')[0],
        high: Math.round(baseTemp + 5),
        low: Math.round(baseTemp - 5),
        precipProb: Math.round(Math.random() * 100),
        wind: Math.round(Math.random() * 20),
        humidity: Math.round(50 + Math.random() * 40),
        uvIndex: Math.round(Math.random() * 11),
        sunrise: '06:30',
        sunset: '19:45',
        description: i === 0 ? 'Sunny' : ['Partly cloudy', 'Rainy', 'Sunny', 'Overcast'][Math.floor(Math.random() * 4)],
        icon: i === 0 ? '01d' : ['02d', '10d', '01d', '04d'][Math.floor(Math.random() * 4)]
      });
    }
    
    // Generate 24 hours of mock hourly weather
    for (let i = 0; i < 24; i++) {
      const time = new Date(now);
      time.setHours(i, 0, 0, 0);
      
      const baseTemp = 22 + Math.random() * 8;
      hourly.push({
        time: time.toISOString(),
        temp: Math.round(baseTemp),
        feelsLike: Math.round(baseTemp + (Math.random() - 0.5) * 4),
        precipProb: Math.round(Math.random() * 100),
        wind: Math.round(Math.random() * 15),
        humidity: Math.round(40 + Math.random() * 50),
        description: 'Clear',
        icon: '01d'
      });
    }
    
    return {
      daily,
      hourly,
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error('Error fetching detailed weather data:', error);
    return null;
  }
}

// Unit Conversion Utilities
export function convertTemperature(celsius: number, toUnit: UnitSystem): number {
  if (toUnit === 'imperial') {
    return Math.round((celsius * 9/5) + 32);
  }
  return Math.round(celsius);
}

export function convertSpeed(mps: number, toUnit: UnitSystem): number {
  if (toUnit === 'imperial') {
    return Math.round(mps * 2.237); // m/s to mph
  }
  return Math.round(mps * 3.6); // m/s to km/h
}

export function getTemperatureUnit(units: UnitSystem): string {
  return units === 'imperial' ? '°F' : '°C';
}

export function getSpeedUnit(units: UnitSystem): string {
  return units === 'imperial' ? 'mph' : 'km/h';
}

// Weather-based Recommendation Engine
export function evaluateWeatherRules(weather: WeatherData, rules: WeatherRule[], units: UnitSystem): string[] {
  const tags: string[] = [];
  
  rules.forEach(rule => {
    if (!rule.enabled) return;
    
    let value: number;
    switch (rule.condition.type) {
      case 'temperature':
        value = units === 'imperial' ? convertTemperature(weather.temperature, 'imperial') : weather.temperature;
        break;
      case 'precipitation':
        value = weather.precipitation * 100; // Convert to percentage
        break;
      case 'uv':
        value = weather.uvIndex;
        break;
      case 'humidity':
        value = weather.humidity;
        break;
      case 'wind':
        value = convertSpeed(weather.windSpeed, units);
        break;
      default:
        return;
    }
    
    let conditionMet = false;
    switch (rule.condition.operator) {
      case 'lt':
        conditionMet = value < rule.condition.value;
        break;
      case 'lte':
        conditionMet = value <= rule.condition.value;
        break;
      case 'gt':
        conditionMet = value > rule.condition.value;
        break;
      case 'gte':
        conditionMet = value >= rule.condition.value;
        break;
      case 'eq':
        conditionMet = value === rule.condition.value;
        break;
    }
    
    if (conditionMet) {
      tags.push(...rule.recommendationTags);
    }
  });
  
  return [...new Set(tags)]; // Remove duplicates
}

export function calculateItemFitScore(item: EnhancedItem, weatherTags: string[], weather: WeatherData): number {
  let score = 50; // Base score
  
  // Check if item has weather-appropriate tags
  const itemTags = [...(item.tags || []), ...(item.weatherTags || [])];
  const matchingTags = weatherTags.filter(tag => itemTags.includes(tag));
  score += matchingTags.length * 15;
  
  // Temperature-based scoring
  if (item.warmthRating) {
    if (weather.temperature < 10 && item.warmthRating >= 4) score += 20;
    else if (weather.temperature > 25 && item.warmthRating <= 2) score += 20;
    else if (weather.temperature >= 10 && weather.temperature <= 25 && item.warmthRating === 3) score += 10;
  }
  
  // Breathability for hot weather
  if (item.breathability && weather.temperature > 25) {
    score += item.breathability * 5;
  }
  
  // Waterproof for rainy weather
  if (item.waterproof && weather.precipitation > 0.3) {
    score += 25;
  }
  
  // Category-specific adjustments
  switch (item.category) {
    case 'shoes':
      if (weather.precipitation > 0.4 && item.waterproof) score += 15;
      break;
    case 'accessories':
      if (weather.uvIndex > 6 && (item.subType === 'sunglasses' || item.subType === 'hat')) score += 20;
      if (weather.precipitation > 0.4 && item.subType === 'umbrella') score += 30;
      break;
    case 'fragrances':
      if (item.fragranceFamily) {
        if (weather.temperature > 25 && ['fresh', 'citrus', 'aquatic'].includes(item.fragranceFamily)) score += 15;
        if (weather.temperature < 15 && ['warm', 'woody', 'oriental'].includes(item.fragranceFamily)) score += 15;
        if (weather.humidity > 70 && ['aquatic', 'fresh'].includes(item.fragranceFamily)) score += 10;
      }
      break;
  }
  
  return Math.min(100, Math.max(0, score));
}

// For testing and demo purposes
export function getMockWeatherData(condition: 'sunny' | 'rainy' | 'cold' | 'hot' | 'windy'): WeatherData {
  const baseData = {
    location: 'Demo City',
    timestamp: Date.now(),
    humidity: 50,
    precipitation: 0,
    windSpeed: 2,
    uvIndex: 4
  };
  
  switch (condition) {
    case 'sunny':
      return {
        ...baseData,
        temperature: 25,
        feelsLike: 26,
        description: 'Clear sky',
        icon: '01d',
        uvIndex: 8,
        humidity: 40,
        precipitation: 0,
        windSpeed: 1.5
      };
    case 'rainy':
      return {
        ...baseData,
        temperature: 18,
        feelsLike: 16,
        description: 'Moderate rain',
        icon: '10d',
        precipitation: 0.7,
        humidity: 85,
        windSpeed: 3.5,
        uvIndex: 2
      };
    case 'cold':
      return {
        ...baseData,
        temperature: 2,
        feelsLike: -2,
        description: 'Overcast clouds',
        icon: '04d',
        precipitation: 0.1,
        humidity: 60,
        windSpeed: 4,
        uvIndex: 1
      };
    case 'hot':
      return {
        ...baseData,
        temperature: 35,
        feelsLike: 38,
        description: 'Hot and sunny',
        icon: '01d',
        precipitation: 0,
        humidity: 70,
        windSpeed: 1,
        uvIndex: 10
      };
    case 'windy':
      return {
        ...baseData,
        temperature: 15,
        feelsLike: 12,
        description: 'Windy with scattered clouds',
        icon: '03d',
        precipitation: 0.1,
        humidity: 45,
        windSpeed: 8.5,
        uvIndex: 5
      };
    default:
      return {
        ...baseData,
        temperature: 22,
        feelsLike: 22,
        description: 'Few clouds',
        icon: '02d',
        precipitation: 0.1,
        humidity: 55,
        windSpeed: 2.5,
        uvIndex: 5
      };
  }
}

// Weather sync utilities
export function shouldRefreshWeather(lastSync?: number): boolean {
  if (!lastSync) return true;
  const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
  return lastSync < sixHoursAgo;
}

export function formatWeatherSyncTime(timestamp?: number): string {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}