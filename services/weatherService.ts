code 'app/(tabs)/index.tsx'import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  description: string;
  weatherCode: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  location: string;
  timestamp: number;
}

export interface ForecastDay {
  date: string;
  day: string;
  high: number;
  low: number;
  weatherCode: number;
  description: string;
  weatherType: 'sunny' | 'cloudy' | 'rainy';
  precipitationChance: number;
}

export interface WeatherResult {
  current: WeatherData;
  forecast: ForecastDay[];
  lastUpdated: number;
}

// Open-Meteo weather code to description
function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

// Open-Meteo weather code to icon type
export function getWeatherType(code: number): 'sunny' | 'cloudy' | 'rainy' {
  if (code === 0 || code === 1) return 'sunny';
  if (code <= 3 || (code >= 45 && code <= 49)) return 'cloudy';
  return 'rainy';
}

// Format temperature based on unit preference
export function formatTemperature(temp: number, unit: 'celsius' | 'fahrenheit' = 'fahrenheit'): string {
  if (unit === 'fahrenheit') {
    const f = (temp * 9 / 5) + 32;
    return `${Math.round(f)}°F`;
  }
  return `${Math.round(temp)}°C`;
}

// Format date for forecast cards
export function formatForecastDate(dateString: string): { day: string; date: string } {
  const date = new Date(dateString);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    day: dayNames[date.getDay()],
    date: `${monthNames[date.getMonth()]} ${date.getDate()}`,
  };
}

// Get device GPS location
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        if (!navigator.geolocation) { resolve(null); return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 10000 }
        );
      });
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch {
    return null;
  }
}

// Reverse geocode coordinates to city name using Open-Meteo geocoding
export async function reverseGeocodeCoords(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await res.json();
    return data.address?.city || data.address?.town || data.address?.village || 'Your Location';
  } catch {
    return 'Your Location';
  }
}

// Fetch coordinates from city name
export async function geocodeCity(city: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const data = await res.json();
    if (data.results?.length > 0) {
      return {
        latitude: data.results[0].latitude,
        longitude: data.results[0].longitude,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Main weather fetch using Open-Meteo (free, no API key)
export async function fetchWeather(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<WeatherResult> {
  const url = `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,apparent_temperature,precipitation,weather_code,` +
    `relative_humidity_2m,wind_speed_10m,uv_index` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,` +
    `precipitation_probability_max,uv_index_max` +
    `&timezone=auto&forecast_days=4`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');
  const data = await res.json();

  const current = data.current;
  const daily = data.daily;

  const currentWeather: WeatherData = {
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    description: getWeatherDescription(current.weather_code),
    weatherCode: current.weather_code,
    precipitation: current.precipitation,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    uvIndex: current.uv_index,
    location: locationName || 'Your Location',
    timestamp: Date.now(),
  };

  // Build 3-day forecast (skip today = index 0)
  const forecast: ForecastDay[] = daily.time.slice(1, 4).map((date: string, i: number) => {
    const idx = i + 1;
    const code = daily.weather_code[idx];
    const { day, date: dateStr } = formatForecastDate(date);
    return {
      date,
      day,
      high: daily.temperature_2m_max[idx],
      low: daily.temperature_2m_min[idx],
      weatherCode: code,
      description: getWeatherDescription(code),
      weatherType: getWeatherType(code),
      precipitationChance: daily.precipitation_probability_max[idx] || 0,
    };
  });

  return {
    current: currentWeather,
    forecast,
    lastUpdated: Date.now(),
  };
}

// Should we refresh? (every 3 hours)
export function shouldRefreshWeather(lastUpdated?: number): boolean {
  if (!lastUpdated) return true;
  const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
  return lastUpdated < threeHoursAgo;
}

// Weather-based outfit suggestion tags
export function getWeatherOutfitTags(weather: WeatherData): string[] {
  const tags: string[] = [];
  const temp = weather.temperature;

  if (temp < 5) tags.push('heavy-coat', 'winter', 'layers', 'boots');
  else if (temp < 12) tags.push('jacket', 'sweater', 'fall', 'closed-toe');
  else if (temp < 18) tags.push('light-jacket', 'jeans', 'sneakers');
  else if (temp < 24) tags.push('casual', 't-shirt', 'jeans', 'sneakers');
  else if (temp < 30) tags.push('light', 'breathable', 'shorts', 'sandals');
  else tags.push('very-light', 'breathable', 'shorts', 'sandals', 'hat');

  if (weather.precipitation > 0.5) tags.push('waterproof', 'rain-jacket', 'boots');
  if (weather.windSpeed > 20) tags.push('windproof', 'jacket');
  if (weather.uvIndex > 6) tags.push('hat', 'sunglasses', 'light-colors');
  if (weather.humidity > 80) tags.push('breathable', 'moisture-wicking');

  return [...new Set(tags)];
}

// Human-readable outfit suggestion based on weather
export function getOutfitSuggestion(weather: WeatherData): string {
  const temp = weather.temperature;
  const f = Math.round((temp * 9 / 5) + 32);
  const desc = weather.description.toLowerCase();

  let suggestion = '';

  if (temp < 5) suggestion = `It's very cold at ${f}°F. Layer up with a heavy coat, sweater, and warm boots.`;
  else if (temp < 12) suggestion = `Cool at ${f}°F. A jacket or sweater with jeans works well.`;
  else if (temp < 18) suggestion = `Mild at ${f}°F. A light jacket over a t-shirt is perfect.`;
  else if (temp < 24) suggestion = `Comfortable at ${f}°F. Casual outfit — t-shirt and jeans.`;
  else if (temp < 30) suggestion = `Warm at ${f}°F. Light breathable clothing recommended.`;
  else suggestion = `Hot at ${f}°F. Wear light, breathable fabrics and stay hydrated.`;

  if (weather.precipitation > 0.5) suggestion += ' Bring a rain jacket or umbrella.';
  if (weather.uvIndex > 6) suggestion += ' High UV — wear a hat and sunglasses.';

  return suggestion;
}
