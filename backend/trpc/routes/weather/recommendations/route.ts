import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

export const getWeatherRecommendationsProcedure = publicProcedure
  .input(z.object({
    lat: z.number(),
    lon: z.number(),
    units: z.enum(['metric', 'imperial']).default('metric'),
    userStyle: z.string().default('casual'),
    occasion: z.string().default('daily')
  }))
  .query(async ({ input }) => {
    const { lat, lon, units, userStyle, occasion } = input;
    
    // This would typically fetch weather data and generate recommendations
    // For now, return mock recommendations based on weather conditions
    
    const mockRecommendations = [
      {
        id: 'sunny-day',
        title: 'Perfect Sunny Day',
        description: 'Clear skies and warm temperatures. Perfect for light, breathable clothing.',
        items: [
          {
            id: '1',
            name: 'Lightweight Cotton T-Shirt',
            category: 'shirts',
            imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300',
            fitScore: 95
          },
          {
            id: '2',
            name: 'Polarized Sunglasses',
            category: 'accessories',
            imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300',
            fitScore: 90
          },
          {
            id: '3',
            name: 'Canvas Sneakers',
            category: 'shoes',
            imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300',
            fitScore: 85
          }
        ],
        weatherCondition: 'sunny',
        tags: ['breathable', 'uv_protection', 'lightweight'],
        confidence: 92
      },
      {
        id: 'rainy-day',
        title: 'Rainy Day Essentials',
        description: 'Stay dry and comfortable with waterproof gear.',
        items: [
          {
            id: '4',
            name: 'Waterproof Rain Jacket',
            category: 'jackets',
            imageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300',
            fitScore: 98
          },
          {
            id: '5',
            name: 'Waterproof Boots',
            category: 'shoes',
            imageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300',
            fitScore: 95
          },
          {
            id: '6',
            name: 'Compact Umbrella',
            category: 'accessories',
            imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300',
            fitScore: 90
          }
        ],
        weatherCondition: 'rainy',
        tags: ['waterproof', 'rain_protection'],
        confidence: 88
      },
      {
        id: 'cold-weather',
        title: 'Cold Weather Layers',
        description: 'Layer up to stay warm in cold conditions.',
        items: [
          {
            id: '7',
            name: 'Merino Wool Base Layer',
            category: 'shirts',
            imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300',
            fitScore: 93
          },
          {
            id: '8',
            name: 'Insulated Winter Jacket',
            category: 'jackets',
            imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300',
            fitScore: 90
          },
          {
            id: '9',
            name: 'Warm Beanie',
            category: 'accessories',
            imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300',
            fitScore: 85
          }
        ],
        weatherCondition: 'cold',
        tags: ['thermal', 'insulated', 'warm'],
        confidence: 90
      }
    ];
    
    // Filter recommendations based on user style and occasion
    const filteredRecommendations = mockRecommendations.filter(rec => {
      if (userStyle === 'formal' && rec.weatherCondition === 'sunny') {
        return true; // Formal sunny day outfits
      }
      if (userStyle === 'casual') {
        return true; // All casual recommendations
      }
      if (occasion === 'work' && rec.weatherCondition !== 'rainy') {
        return true; // Work-appropriate non-rainy outfits
      }
      return rec.weatherCondition === 'rainy'; // Always show rainy day essentials
    });
    
    return filteredRecommendations.slice(0, 3); // Return top 3 recommendations
  });