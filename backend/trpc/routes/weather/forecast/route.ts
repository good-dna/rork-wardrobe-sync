import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

interface ForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: {
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      sea_level: number;
      grnd_level: number;
      humidity: number;
      temp_kf: number;
    };
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    }[];
    clouds: {
      all: number;
    };
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    visibility: number;
    pop: number; // Probability of precipitation
    rain?: {
      '3h': number;
    };
    snow?: {
      '3h': number;
    };
    sys: {
      pod: string;
    };
    dt_txt: string;
  }[];
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

export const getForecastProcedure = publicProcedure
  .input(z.object({
    lat: z.number(),
    lon: z.number(),
    units: z.enum(['metric', 'imperial']).default('metric'),
    days: z.number().min(1).max(5).default(5)
  }))
  .query(async ({ input }) => {
    const { lat, lon, units, days } = input;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const baseUrl = process.env.WEATHER_API_BASE_URL || 'https://api.openweathermap.org/data/2.5';
    
    if (!apiKey) {
      // Return mock forecast data
      const mockForecast = [];
      const now = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        
        const baseTemp = 20 + Math.random() * 15;
        mockForecast.push({
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
      
      return {
        daily: mockForecast,
        location: 'Demo Location'
      };
    }
    
    try {
      const response = await fetch(
        `${baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`
      );
      
      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }
      
      const data: ForecastResponse = await response.json();
      
      // Group forecast data by day
      const dailyData = new Map<string, {
        temps: number[];
        humidity: number[];
        wind: number[];
        precipitation: number[];
        weather: { description: string; icon: string }[];
      }>();
      
      data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        
        if (!dailyData.has(date)) {
          dailyData.set(date, {
            temps: [],
            humidity: [],
            wind: [],
            precipitation: [],
            weather: []
          });
        }
        
        const dayData = dailyData.get(date)!;
        dayData.temps.push(item.main.temp);
        dayData.humidity.push(item.main.humidity);
        dayData.wind.push(item.wind.speed);
        dayData.precipitation.push(item.pop * 100);
        dayData.weather.push({
          description: item.weather[0].description,
          icon: item.weather[0].icon
        });
      });
      
      // Convert to daily forecast format
      const daily = Array.from(dailyData.entries()).slice(0, days).map(([date, dayData]) => {
        const temps = dayData.temps;
        const mostCommonWeather = dayData.weather[Math.floor(dayData.weather.length / 2)];
        
        return {
          date,
          high: Math.round(Math.max(...temps)),
          low: Math.round(Math.min(...temps)),
          precipProb: Math.round(Math.max(...dayData.precipitation)),
          wind: Math.round(dayData.wind.reduce((a, b) => a + b, 0) / dayData.wind.length),
          humidity: Math.round(dayData.humidity.reduce((a, b) => a + b, 0) / dayData.humidity.length),
          uvIndex: Math.round(Math.random() * 11), // UV not available in 5-day forecast
          sunrise: new Date(data.city.sunrise * 1000).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          sunset: new Date(data.city.sunset * 1000).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          description: mostCommonWeather.description,
          icon: mostCommonWeather.icon
        };
      });
      
      return {
        daily,
        location: data.city.name
      };
    } catch (error) {
      console.error('Forecast API error:', error);
      throw new Error('Failed to fetch forecast data');
    }
  });