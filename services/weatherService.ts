import * as Location from 'expo-location';

// Weather API key - in a real app, this would be stored in environment variables
const WEATHER_API_KEY = 'demo_key';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

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

export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
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
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

export async function getWeatherData(): Promise<WeatherData | null> {
  try {
    const location = await getCurrentLocation();
    
    if (!location) {
      return null;
    }
    
    // Fetch weather data from API
    const response = await fetch(
      `${WEATHER_API_URL}?lat=${location.latitude}&lon=${location.longitude}&units=metric&appid=${WEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Weather API request failed');
    }
    
    const data = await response.json();
    
    // For demo purposes, we're using mock UV index since it's not in the basic OpenWeatherMap API
    const mockUvIndex = Math.floor(Math.random() * 11);
    
    return {
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      precipitation: data.rain ? data.rain['1h'] / 10 : 0, // Convert mm to probability
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      uvIndex: mockUvIndex,
      location: data.name,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
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