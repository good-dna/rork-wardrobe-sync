import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { trpcClient } from '@/lib/trpc';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  location: string;
  timestamp: number;
  pressure?: number;
  visibility?: number;
  cloudiness?: number;
  sunrise?: number;
  sunset?: number;
}

export interface LocationData {
  placeId: string;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface DailyForecast {
  date: string;
  high: number;
  low: number;
  precipProb: number;
  wind: number;
  humidity: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  description: string;
  icon: string;
}

export interface WeatherRecommendation {
  id: string;
  title: string;
  description: string;
  items: {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
    fitScore: number;
  }[];
  weatherCondition: string;
  tags: string[];
  confidence: number;
}

export type UnitSystem = 'metric' | 'imperial';

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

// Weather API Functions
export async function getCurrentWeather(
  latitude: number, 
  longitude: number, 
  units: UnitSystem = 'metric'
): Promise<WeatherData | null> {
  try {
    const data = await trpcClient.weather.current.query({
      lat: latitude,
      lon: longitude,
      units
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching current weather:', error);
    return null;
  }
}

export async function getWeatherForecast(
  latitude: number, 
  longitude: number, 
  units: UnitSystem = 'metric',
  days: number = 5
): Promise<{ daily: DailyForecast[]; location: string } | null> {
  try {
    const data = await trpcClient.weather.forecast.query({
      lat: latitude,
      lon: longitude,
      units,
      days
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return null;
  }
}

export async function searchLocations(query: string, limit: number = 5): Promise<LocationData[]> {
  try {
    const data = await trpcClient.weather.searchLocations.query({
      query,
      limit
    });
    
    return data;
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

export async function reverseGeocode(
  latitude: number, 
  longitude: number
): Promise<LocationData | null> {
  try {
    const data = await trpcClient.weather.reverseGeocode.query({
      lat: latitude,
      lon: longitude
    });
    
    return data;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

export async function getWeatherRecommendations(
  latitude: number,
  longitude: number,
  units: UnitSystem = 'metric',
  userStyle: string = 'casual',
  occasion: string = 'daily'
): Promise<WeatherRecommendation[]> {
  try {
    const data = await trpcClient.weather.recommendations.query({
      lat: latitude,
      lon: longitude,
      units,
      userStyle,
      occasion
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching weather recommendations:', error);
    return [];
  }
}

// Utility Functions
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

export function getWeatherIconUrl(iconCode: string, size: '2x' | '4x' = '2x'): string {
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
}

export function formatWeatherDescription(description: string): string {
  return description.charAt(0).toUpperCase() + description.slice(1);
}

export function getWeatherConditionColor(condition: string): string {
  const conditionMap: Record<string, string> = {
    'clear': '#FFD700',
    'sunny': '#FFD700',
    'partly cloudy': '#87CEEB',
    'cloudy': '#708090',
    'overcast': '#696969',
    'rainy': '#4682B4',
    'stormy': '#2F4F4F',
    'snowy': '#F0F8FF',
    'foggy': '#D3D3D3',
    'windy': '#20B2AA'
  };
  
  const lowerCondition = condition.toLowerCase();
  for (const [key, color] of Object.entries(conditionMap)) {
    if (lowerCondition.includes(key)) {
      return color;
    }
  }
  
  return '#87CEEB'; // Default sky blue
}

// Cache utilities
export function shouldRefreshWeather(lastSync?: number): boolean {
  if (!lastSync) return true;
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  return lastSync < oneHourAgo;
}

export function formatWeatherSyncTime(timestamp?: number): string {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Combined function to get current weather with location
export async function getCurrentWeatherWithLocation(
  units: UnitSystem = 'metric'
): Promise<{ weather: WeatherData; location: LocationData } | null> {
  try {
    const coords = await getCurrentLocation();
    if (!coords) {
      console.log('Could not get current location');
      return null;
    }
    
    const [weather, location] = await Promise.all([
      getCurrentWeather(coords.latitude, coords.longitude, units),
      reverseGeocode(coords.latitude, coords.longitude)
    ]);
    
    if (!weather || !location) {
      return null;
    }
    
    return { weather, location };
  } catch (error) {
    console.error('Error getting current weather with location:', error);
    return null;
  }
}