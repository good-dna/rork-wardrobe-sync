import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

export interface WeatherKitCurrentWeather {
  name: string;
  metadata: {
    attributionURL: string;
    expireTime: string;
    latitude: number;
    longitude: number;
    readTime: string;
    reportedTime: string;
    units: string;
    version: number;
  };
  asOf: string;
  cloudCover: number;
  cloudCoverHighAltPct: number;
  cloudCoverLowAltPct: number;
  cloudCoverMidAltPct: number;
  conditionCode: string;
  daylight: boolean;
  humidity: number;
  precipitationIntensity: number;
  pressure: number;
  pressureTrend: string;
  temperature: number;
  temperatureApparent: number;
  temperatureDewPoint: number;
  uvIndex: number;
  visibility: number;
  windDirection: number;
  windGust: number;
  windSpeed: number;
}

export interface WeatherKitForecastDay {
  forecastStart: string;
  forecastEnd: string;
  conditionCode: string;
  maxUvIndex: number;
  moonPhase: string;
  moonrise: string;
  moonset: string;
  precipitationAmount: number;
  precipitationChance: number;
  precipitationType: string;
  snowfallAmount: number;
  sunrise: string;
  sunset: string;
  temperatureMax: number;
  temperatureMin: number;
  daytimeForecast?: {
    cloudCover: number;
    conditionCode: string;
    humidity: number;
    precipitationAmount: number;
    precipitationChance: number;
    precipitationType: string;
    snowfallAmount: number;
    windDirection: number;
    windSpeed: number;
  };
  overnightForecast?: {
    cloudCover: number;
    conditionCode: string;
    humidity: number;
    precipitationAmount: number;
    precipitationChance: number;
    precipitationType: string;
    snowfallAmount: number;
    windDirection: number;
    windSpeed: number;
  };
}

export interface WeatherKitForecastDaily {
  name: string;
  metadata: {
    attributionURL: string;
    expireTime: string;
    latitude: number;
    longitude: number;
    readTime: string;
    reportedTime: string;
    units: string;
    version: number;
  };
  days: WeatherKitForecastDay[];
}

export interface WeatherKitResponse {
  currentWeather: WeatherKitCurrentWeather;
  forecastDaily: WeatherKitForecastDaily;
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

export function getWeatherIcon(conditionCode: string): 'sunny' | 'cloudy' | 'rainy' {
  const code = conditionCode.toLowerCase();
  
  if (code.includes('clear') || code.includes('sunny') || code.includes('mostlyclear')) {
    return 'sunny';
  }
  
  if (code.includes('rain') || code.includes('drizzle') || code.includes('shower')) {
    return 'rainy';
  }
  
  return 'cloudy';
}

export function formatTemperature(temp: number, unit: 'celsius' | 'fahrenheit' = 'celsius'): string {
  if (unit === 'fahrenheit') {
    const fahrenheit = (temp * 9/5) + 32;
    return `${Math.round(fahrenheit)}°F`;
  }
  return `${Math.round(temp)}°C`;
}

export function formatDate(dateString: string): { day: string; date: string } {
  const date = new Date(dateString);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return {
    day: dayNames[date.getDay()],
    date: `${monthNames[date.getMonth()]} ${date.getDate()}`,
  };
}

export async function fetchWeatherKit(
  latitude: number,
  longitude: number,
  language: string = 'en'
): Promise<WeatherKitResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('weatherkit', {
      body: { latitude, longitude, language },
    });

    if (error) {
      console.error('Error calling weatherkit edge function:', error);
      throw new Error(error.message || 'Failed to fetch weather data');
    }

    if (!data) {
      throw new Error('No data returned from weatherkit function');
    }

    return data as WeatherKitResponse;
  } catch (error) {
    console.error('Error fetching WeatherKit data:', error);
    throw error;
  }
}
