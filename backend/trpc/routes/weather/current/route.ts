import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

interface WeatherResponse {
  coord: { lon: number; lat: number };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

interface UVResponse {
  lat: number;
  lon: number;
  date_iso: string;
  date: number;
  value: number;
}

export const getCurrentWeatherProcedure = publicProcedure
  .input(z.object({
    lat: z.number(),
    lon: z.number(),
    units: z.enum(['metric', 'imperial']).default('metric')
  }))
  .query(async ({ input }) => {
    const { lat, lon, units } = input;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const baseUrl = process.env.WEATHER_API_BASE_URL || 'https://api.openweathermap.org/data/2.5';
    
    if (!apiKey) {
      // Return mock data if no API key is provided
      return {
        temperature: 22,
        feelsLike: 24,
        description: 'Clear sky',
        icon: '01d',
        precipitation: 0,
        humidity: 45,
        windSpeed: 2.5,
        uvIndex: 5,
        location: 'Demo Location',
        timestamp: Date.now(),
        pressure: 1013,
        visibility: 10000,
        cloudiness: 0,
        sunrise: Date.now() - 3600000,
        sunset: Date.now() + 3600000
      };
    }
    
    try {
      // Fetch current weather
      const weatherResponse = await fetch(
        `${baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`
      );
      
      if (!weatherResponse.ok) {
        throw new Error(`Weather API error: ${weatherResponse.status}`);
      }
      
      const weatherData: WeatherResponse = await weatherResponse.json();
      
      // Fetch UV index
      let uvIndex = 0;
      try {
        const uvResponse = await fetch(
          `${baseUrl}/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        
        if (uvResponse.ok) {
          const uvData: UVResponse = await uvResponse.json();
          uvIndex = uvData.value;
        }
      } catch (error) {
        console.warn('Failed to fetch UV index:', error);
      }
      
      return {
        temperature: Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        precipitation: 0, // Current weather doesn't include precipitation probability
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
        uvIndex: Math.round(uvIndex),
        location: weatherData.name,
        timestamp: weatherData.dt * 1000,
        pressure: weatherData.main.pressure,
        visibility: weatherData.visibility,
        cloudiness: weatherData.clouds.all,
        sunrise: weatherData.sys.sunrise * 1000,
        sunset: weatherData.sys.sunset * 1000
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error('Failed to fetch weather data');
    }
  });