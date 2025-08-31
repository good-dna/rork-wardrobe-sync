import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

interface GeocodingResponse {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export const searchLocationsProcedure = publicProcedure
  .input(z.object({
    query: z.string().min(1),
    limit: z.number().min(1).max(10).default(5)
  }))
  .query(async ({ input }) => {
    const { query, limit } = input;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const baseUrl = process.env.GEOCODING_API_BASE_URL || 'https://api.openweathermap.org/geo/1.0';
    
    if (!apiKey) {
      // Return mock location data
      const mockLocations = [
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
      
      return mockLocations.filter(location => 
        location.city.toLowerCase().includes(query.toLowerCase()) ||
        location.region.toLowerCase().includes(query.toLowerCase()) ||
        location.country.toLowerCase().includes(query.toLowerCase())
      ).slice(0, limit);
    }
    
    try {
      const response = await fetch(
        `${baseUrl}/direct?q=${encodeURIComponent(query)}&limit=${limit}&appid=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      
      const data: GeocodingResponse[] = await response.json();
      
      return data.map((location, index) => ({
        placeId: `${location.lat}_${location.lon}_${index}`,
        city: location.name,
        region: location.state || '',
        country: location.country,
        latitude: location.lat,
        longitude: location.lon,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // Fallback timezone
      }));
    } catch (error) {
      console.error('Geocoding API error:', error);
      throw new Error('Failed to search locations');
    }
  });

export const reverseGeocodeProcedure = publicProcedure
  .input(z.object({
    lat: z.number(),
    lon: z.number()
  }))
  .query(async ({ input }) => {
    const { lat, lon } = input;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const baseUrl = process.env.GEOCODING_API_BASE_URL || 'https://api.openweathermap.org/geo/1.0';
    
    if (!apiKey) {
      // Return mock reverse geocoding data
      return {
        placeId: 'current',
        city: 'Current Location',
        region: 'Unknown',
        country: 'Unknown',
        latitude: lat,
        longitude: lon,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
    
    try {
      const response = await fetch(
        `${baseUrl}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Reverse geocoding API error: ${response.status}`);
      }
      
      const data: GeocodingResponse[] = await response.json();
      
      if (data.length === 0) {
        return {
          placeId: 'current',
          city: 'Unknown Location',
          region: '',
          country: '',
          latitude: lat,
          longitude: lon,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
      }
      
      const location = data[0];
      return {
        placeId: `${location.lat}_${location.lon}`,
        city: location.name,
        region: location.state || '',
        country: location.country,
        latitude: location.lat,
        longitude: location.lon,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    } catch (error) {
      console.error('Reverse geocoding API error:', error);
      throw new Error('Failed to reverse geocode location');
    }
  });