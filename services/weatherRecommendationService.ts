import { 
  EnhancedItem, 
  LocationPreferences 
} from '@/types/wardrobe';
import { WeatherData } from '@/services/weatherService';

function calculateItemFitScoreLocal(item: EnhancedItem, weatherTags: string[], weather: WeatherData): number {
  let score = 50;
  const itemTags = item.weatherTags || [];
  for (const tag of weatherTags) {
    if (itemTags.includes(tag)) score += 10;
  }
  if (item.waterproof && weather.precipitation > 0.4) score += 15;
  if (item.warmthRating && item.warmthRating >= 4 && weather.temperature < 10) score += 15;
  if (item.breathability && item.breathability >= 4 && weather.temperature > 25) score += 15;
  return Math.min(100, score);
}

export interface WeatherRecommendation {
  id: string;
  title: string;
  description: string;
  items: EnhancedItem[];
  weatherCondition: string;
  tags: string[];
  confidence: number; // 0-100
}

export interface RecommendationContext {
  weather: WeatherData;
  preferences: LocationPreferences;
  userStyle: string;
  occasion: string;
}

// Mock enhanced items with weather properties
const mockEnhancedItems: EnhancedItem[] = [
  {
    id: '1',
    name: 'Waterproof Rain Jacket',
    brand: 'Patagonia',
    category: 'jackets',
    subType: 'jacket',
    color: 'Navy Blue',
    material: 'Gore-Tex',
    season: ['fall', 'winter', 'spring'],
    purchaseDate: '2023-10-15',
    purchasePrice: 299,
    wearCount: 12,
    lastWorn: '2024-01-15',
    imageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300',
    notes: 'Perfect for rainy days',
    tags: ['waterproof', 'breathable', 'windproof'],
    cleaningStatus: 'clean',
    wearHistory: [],
    washHistory: [],
    waterproof: true,
    warmthRating: 3,
    breathability: 4,
    weatherTags: ['waterproof', 'rain_protection'],
    fitScore: 0
  },
  {
    id: '2',
    name: 'Merino Wool Thermal Base Layer',
    brand: 'Smartwool',
    category: 'shirts',
    subType: 't_shirt',
    color: 'Charcoal',
    material: 'Merino Wool',
    season: ['fall', 'winter'],
    purchaseDate: '2023-11-20',
    purchasePrice: 89,
    wearCount: 25,
    lastWorn: '2024-01-20',
    imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300',
    notes: 'Excellent base layer for cold weather',
    tags: ['thermal', 'moisture-wicking', 'odor-resistant'],
    cleaningStatus: 'clean',
    wearHistory: [],
    washHistory: [],
    waterproof: false,
    warmthRating: 5,
    breathability: 3,
    weatherTags: ['thermal', 'insulated', 'warm'],
    fitScore: 0
  },
  {
    id: '3',
    name: 'Lightweight Cotton T-Shirt',
    brand: 'Uniqlo',
    category: 'shirts',
    subType: 't_shirt',
    color: 'White',
    material: 'Cotton',
    season: ['spring', 'summer'],
    purchaseDate: '2023-05-10',
    purchasePrice: 19,
    wearCount: 45,
    lastWorn: '2024-01-18',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300',
    notes: 'Great for hot weather',
    tags: ['lightweight', 'breathable', 'casual'],
    cleaningStatus: 'clean',
    wearHistory: [],
    washHistory: [],
    waterproof: false,
    warmthRating: 1,
    breathability: 5,
    weatherTags: ['breathable', 'lightweight'],
    fitScore: 0
  },
  {
    id: '4',
    name: 'Waterproof Hiking Boots',
    brand: 'Salomon',
    category: 'shoes',
    subType: 'boots',
    color: 'Brown',
    material: 'Leather/Synthetic',
    season: ['fall', 'winter', 'spring'],
    purchaseDate: '2023-09-05',
    purchasePrice: 189,
    wearCount: 18,
    lastWorn: '2024-01-12',
    imageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300',
    notes: 'Perfect for wet conditions',
    tags: ['waterproof', 'durable', 'grip'],
    cleaningStatus: 'clean',
    wearHistory: [],
    washHistory: [],
    waterproof: true,
    warmthRating: 3,
    breathability: 2,
    weatherTags: ['waterproof', 'slip_resistant'],
    fitScore: 0
  },
  {
    id: '5',
    name: 'Polarized Sunglasses',
    brand: 'Ray-Ban',
    category: 'accessories',
    subType: 'sunglasses',
    color: 'Black',
    material: 'Acetate/Glass',
    season: ['spring', 'summer'],
    purchaseDate: '2023-04-15',
    purchasePrice: 159,
    wearCount: 32,
    lastWorn: '2024-01-10',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300',
    notes: 'Essential for sunny days',
    tags: ['uv_protection', 'polarized', 'stylish'],
    cleaningStatus: 'clean',
    wearHistory: [],
    washHistory: [],
    waterproof: false,
    warmthRating: 1,
    breathability: 5,
    weatherTags: ['uv_protection', 'sunglasses'],
    fitScore: 0
  },
  {
    id: '6',
    name: 'Fresh Citrus Cologne',
    brand: 'Acqua di Parma',
    category: 'fragrances',
    subType: 'cologne',
    color: 'Clear',
    material: 'Fragrance',
    season: ['spring', 'summer'],
    purchaseDate: '2023-06-01',
    purchasePrice: 125,
    wearCount: 28,
    lastWorn: '2024-01-08',
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300',
    notes: 'Perfect for hot weather',
    tags: ['fresh', 'citrus', 'light'],
    cleaningStatus: 'clean',
    wearHistory: [],
    washHistory: [],
    waterproof: false,
    warmthRating: 1,
    breathability: 5,
    fragranceFamily: 'citrus',
    weatherTags: ['fresh_fragrance'],
    fitScore: 0
  },
  {
    id: '7',
    name: 'Compact Travel Umbrella',
    brand: 'Blunt',
    category: 'accessories',
    subType: 'umbrella',
    color: 'Black',
    material: 'Polyester/Aluminum',
    season: ['all'],
    purchaseDate: '2023-08-20',
    purchasePrice: 79,
    wearCount: 8,
    lastWorn: '2024-01-05',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300',
    notes: 'Windproof and compact',
    tags: ['windproof', 'compact', 'durable'],
    cleaningStatus: 'clean',
    wearHistory: [],
    washHistory: [],
    waterproof: true,
    warmthRating: 1,
    breathability: 5,
    weatherTags: ['umbrella', 'rain_protection'],
    fitScore: 0
  },
  {
    id: '8',
    name: 'Sport Watch with Rubber Strap',
    brand: 'Garmin',
    category: 'accessories',
    subType: 'watch',
    color: 'Black',
    material: 'Rubber/Plastic',
    season: ['all'],
    purchaseDate: '2023-07-10',
    purchasePrice: 299,
    wearCount: 55,
    lastWorn: '2024-01-22',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
    notes: 'Water resistant and durable',
    tags: ['water_resistant', 'sport', 'durable'],
    cleaningStatus: 'clean',
    wearHistory: [],
    washHistory: [],
    waterproof: true,
    warmthRating: 1,
    breathability: 4,
    strapType: 'rubber',
    weatherTags: ['rubber_strap', 'water_resistant'],
    fitScore: 0
  }
];

export function generateWeatherRecommendations(
  context: RecommendationContext,
  availableItems: EnhancedItem[] = mockEnhancedItems
): WeatherRecommendation[] {
  const { weather } = context;
  
  // Evaluate weather rules to get recommendation tags
  const weatherTags: string[] = [];
  if (weather.temperature < 10) weatherTags.push('thermal', 'insulated', 'warm');
  if (weather.precipitation > 0.4) weatherTags.push('waterproof', 'umbrella');
  if (weather.uvIndex > 6) weatherTags.push('sunglasses', 'hat', 'uv_protection');
  if (weather.windSpeed > 20) weatherTags.push('windproof');
  if (weather.humidity > 70) weatherTags.push('breathable', 'moisture_wicking');
  
  // Calculate fit scores for all items
  const scoredItems = availableItems.map(item => ({
    ...item,
    fitScore: calculateItemFitScoreLocal(item, weatherTags, weather)
  }));
  
  // Sort items by fit score
  const sortedItems = scoredItems.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
  
  const recommendations: WeatherRecommendation[] = [];
  
  // Generate condition-specific recommendations
  if (weather.precipitation > 0.4) {
    // Rainy weather recommendation
    const rainyItems = sortedItems.filter(item => 
      item.waterproof || 
      item.weatherTags?.includes('waterproof') ||
      item.weatherTags?.includes('umbrella') ||
      item.subType === 'umbrella'
    ).slice(0, 4);
    
    if (rainyItems.length > 0) {
      recommendations.push({
        id: 'rainy-weather',
        title: 'Rainy Day Essentials',
        description: `${Math.round(weather.precipitation * 100)}% chance of rain. Stay dry with these waterproof items.`,
        items: rainyItems,
        weatherCondition: 'rainy',
        tags: ['waterproof', 'rain_protection'],
        confidence: Math.min(95, 60 + (weather.precipitation * 35))
      });
    }
  }
  
  if (weather.temperature < 10) {
    // Cold weather recommendation
    const coldItems = sortedItems.filter(item => 
      (item.warmthRating && item.warmthRating >= 3) ||
      item.weatherTags?.includes('thermal') ||
      item.weatherTags?.includes('insulated') ||
      item.weatherTags?.includes('warm')
    ).slice(0, 4);
    
    if (coldItems.length > 0) {
      recommendations.push({
        id: 'cold-weather',
        title: 'Cold Weather Layers',
        description: `${Math.round(weather.temperature)}°C. Layer up with these warm items.`,
        items: coldItems,
        weatherCondition: 'cold',
        tags: ['thermal', 'insulated', 'warm'],
        confidence: Math.min(95, 70 + Math.max(0, (10 - weather.temperature) * 3))
      });
    }
  }
  
  if (weather.temperature > 25) {
    // Hot weather recommendation
    const hotItems = sortedItems.filter(item => 
      (item.breathability && item.breathability >= 4) ||
      item.weatherTags?.includes('breathable') ||
      item.weatherTags?.includes('lightweight') ||
      (item.warmthRating && item.warmthRating <= 2)
    ).slice(0, 4);
    
    if (hotItems.length > 0) {
      recommendations.push({
        id: 'hot-weather',
        title: 'Beat the Heat',
        description: `${Math.round(weather.temperature)}°C. Stay cool with breathable fabrics.`,
        items: hotItems,
        weatherCondition: 'hot',
        tags: ['breathable', 'lightweight', 'cooling'],
        confidence: Math.min(95, 60 + Math.max(0, (weather.temperature - 25) * 2))
      });
    }
  }
  
  if (weather.uvIndex > 6) {
    // High UV recommendation
    const uvItems = sortedItems.filter(item => 
      item.subType === 'sunglasses' ||
      item.subType === 'hat' ||
      item.weatherTags?.includes('uv_protection') ||
      item.weatherTags?.includes('sunglasses')
    ).slice(0, 3);
    
    if (uvItems.length > 0) {
      recommendations.push({
        id: 'uv-protection',
        title: 'UV Protection',
        description: `UV Index: ${weather.uvIndex}. Protect yourself from harmful rays.`,
        items: uvItems,
        weatherCondition: 'sunny',
        tags: ['uv_protection', 'sun_safety'],
        confidence: Math.min(95, 50 + (weather.uvIndex * 5))
      });
    }
  }
  
  if (weather.humidity > 70 && weather.temperature > 20) {
    // Humid weather recommendation
    const humidItems = sortedItems.filter(item => 
      (item.breathability && item.breathability >= 4) ||
      item.fragranceFamily === 'fresh' ||
      item.fragranceFamily === 'aquatic' ||
      item.weatherTags?.includes('fresh_fragrance')
    ).slice(0, 4);
    
    if (humidItems.length > 0) {
      recommendations.push({
        id: 'humid-weather',
        title: 'Humid Day Comfort',
        description: `${weather.humidity}% humidity. Choose breathable materials and fresh scents.`,
        items: humidItems,
        weatherCondition: 'humid',
        tags: ['breathable', 'fresh', 'moisture_wicking'],
        confidence: Math.min(90, 50 + Math.max(0, (weather.humidity - 70) * 1.5))
      });
    }
  }
  
  // General daily recommendation based on overall conditions
  const dailyItems = sortedItems.slice(0, 5);
  if (dailyItems.length > 0) {
    recommendations.push({
      id: 'daily-picks',
      title: 'Today\'s Top Picks',
      description: `Curated for ${weather.description.toLowerCase()} conditions.`,
      items: dailyItems,
      weatherCondition: 'general',
      tags: weatherTags,
      confidence: 85
    });
  }
  
  // Sort recommendations by confidence
  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

export function getWeatherBasedOutfitSuggestions(
  weather: WeatherData,
  preferences: LocationPreferences,
  userStyle: string = 'casual'
): WeatherRecommendation[] {
  const context: RecommendationContext = {
    weather,
    preferences,
    userStyle,
    occasion: 'daily'
  };
  
  return generateWeatherRecommendations(context);
}

// Mock function to simulate getting current weather and recommendations
export async function getCurrentWeatherRecommendations(
  _preferences?: LocationPreferences
): Promise<WeatherRecommendation[]> {
  // In a real app, this would fetch actual weather data
  const mockWeather: WeatherData = {
    temperature: 25, feelsLike: 26, description: 'Clear sky', weatherCode: 0,
    precipitation: 0, humidity: 40, windSpeed: 10, uvIndex: 7,
    location: 'Demo', timestamp: Date.now(),
  };
  
  const defaultPreferences: LocationPreferences = {
    units: 'metric',
    tempBasis: 'actual',
    weatherFlags: {
      rain: true,
      wind: true,
      uv: true,
      humidity: true,
      pollen: false,
    },
    rules: [
      {
        id: '1',
        name: 'Cold Weather',
        condition: { type: 'temperature', operator: 'lt', value: 10 },
        recommendationTags: ['thermal', 'insulated', 'warm'],
        enabled: true,
      },
      {
        id: '2',
        name: 'Rainy Weather',
        condition: { type: 'precipitation', operator: 'gte', value: 40 },
        recommendationTags: ['waterproof', 'umbrella'],
        enabled: true,
      },
      {
        id: '3',
        name: 'High UV',
        condition: { type: 'uv', operator: 'gte', value: 6 },
        recommendationTags: ['sunglasses', 'hat', 'uv_protection'],
        enabled: true,
      },
    ],
  };
  
  return getWeatherBasedOutfitSuggestions(
    mockWeather, 
    _preferences || defaultPreferences
  );
}