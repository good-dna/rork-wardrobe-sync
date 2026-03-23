export type Category = 'shirts' | 'pants' | 'jackets' | 'shoes' | 'accessories' | 'fragrances';

export type Subcategory =
  | 't-shirt' | 'polo' | 'button-down' | 'tank-top' | 'hoodie' | 'sweater' | 'crewneck'
  | 'jeans' | 'chinos' | 'shorts' | 'sweatpants' | 'dress-pants' | 'joggers'
  | 'bomber' | 'blazer' | 'denim-jacket' | 'leather-jacket' | 'parka' | 'windbreaker'
  | 'sneakers' | 'boots' | 'dress-shoes' | 'sandals' | 'loafers' | 'slides'
  | 'hat' | 'belt' | 'watch' | 'bag' | 'sunglasses' | 'jewelry' | 'scarf' | 'gloves'
  | 'cologne' | 'perfume' | 'body-spray';

export const SUBCATEGORIES: Record<Category, { label: string; value: Subcategory }[]> = {
  shirts: [
    { label: 'T-Shirt', value: 't-shirt' },
    { label: 'Polo', value: 'polo' },
    { label: 'Button-Down', value: 'button-down' },
    { label: 'Tank Top', value: 'tank-top' },
    { label: 'Hoodie', value: 'hoodie' },
    { label: 'Sweater', value: 'sweater' },
    { label: 'Crewneck', value: 'crewneck' },
  ],
  pants: [
    { label: 'Jeans', value: 'jeans' },
    { label: 'Chinos', value: 'chinos' },
    { label: 'Shorts', value: 'shorts' },
    { label: 'Sweatpants', value: 'sweatpants' },
    { label: 'Dress Pants', value: 'dress-pants' },
    { label: 'Joggers', value: 'joggers' },
  ],
  jackets: [
    { label: 'Bomber', value: 'bomber' },
    { label: 'Blazer', value: 'blazer' },
    { label: 'Denim Jacket', value: 'denim-jacket' },
    { label: 'Leather Jacket', value: 'leather-jacket' },
    { label: 'Parka', value: 'parka' },
    { label: 'Windbreaker', value: 'windbreaker' },
  ],
  shoes: [
    { label: 'Sneakers', value: 'sneakers' },
    { label: 'Boots', value: 'boots' },
    { label: 'Dress Shoes', value: 'dress-shoes' },
    { label: 'Sandals', value: 'sandals' },
    { label: 'Loafers', value: 'loafers' },
    { label: 'Slides', value: 'slides' },
  ],
  accessories: [
    { label: 'Hat', value: 'hat' },
    { label: 'Belt', value: 'belt' },
    { label: 'Watch', value: 'watch' },
    { label: 'Bag', value: 'bag' },
    { label: 'Sunglasses', value: 'sunglasses' },
    { label: 'Jewelry', value: 'jewelry' },
    { label: 'Scarf', value: 'scarf' },
    { label: 'Gloves', value: 'gloves' },
  ],
  fragrances: [
    { label: 'Cologne', value: 'cologne' },
    { label: 'Perfume', value: 'perfume' },
    { label: 'Body Spray', value: 'body-spray' },
  ],
};
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all';
export type CleaningStatus = 'clean' | 'dirty' | 'needs repair';
export type ItemStatus = 'active' | 'archived' | 'sold';
export type Occasion = 'casual' | 'formal' | 'work' | 'athletic' | 'evening' | 'special';
export type Priority = 'low' | 'medium' | 'high';

export interface Item {
  id: string;
  name: string;
  brand: string;
  category: Category;
  subcategory?: Subcategory;
  color: string;
  material: string;
  season: Season[];
  purchaseDate: string;
  purchasePrice: number;
  wearCount: number;
  lastWorn: string;
  imageUrl: string;
  notes: string;
  tags: string[];
  cleaningStatus: CleaningStatus;
  status?: ItemStatus;
  wearHistory: WearLogEntry[];
  washHistory: WashLogEntry[];
  nextWashDue?: string;
}

export interface WearLogEntry {
  date: string;
  notes?: string;
}

export interface WashLogEntry {
  date: string;
  notes?: string;
}

export interface OutfitSuggestion {
  id: string;
  name: string;
  items: string[]; // Item IDs
  occasion: Occasion;
  season: Season;
  imageUrl?: string;
  dateWorn?: string[];
}

export interface WishlistItem {
  id: string;
  name: string;
  brand: string;
  category: Category;
  color: string;
  estimatedPrice: number;
  priority: Priority;
  url?: string;
  notes?: string;
  imageUrl?: string;
}

export interface WardrobeFilters {
  category?: Category;
  season?: Season;
  brand?: string;
  color?: string;
  cleaningStatus?: CleaningStatus;
  searchQuery?: string;
}

// Location and Weather Types
export type UnitSystem = 'imperial' | 'metric';
export type TemperatureBasis = 'actual' | 'feelsLike';

export interface LocationData {
  placeId: string;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface WeatherFlags {
  rain: boolean;
  wind: boolean;
  uv: boolean;
  humidity: boolean;
  pollen: boolean;
}

export interface WeatherRule {
  id: string;
  name: string;
  condition: {
    type: 'temperature' | 'precipitation' | 'uv' | 'humidity' | 'wind';
    operator: 'lt' | 'gt' | 'gte' | 'lte' | 'eq';
    value: number;
  };
  recommendationTags: string[];
  enabled: boolean;
}

export interface LocationPreferences {
  location?: LocationData;
  units: UnitSystem;
  tempBasis: TemperatureBasis;
  weatherFlags: WeatherFlags;
  rules: WeatherRule[];
  lastWeatherSync?: number;
}

export interface DailyWeather {
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

export interface HourlyWeather {
  time: string;
  temp: number;
  feelsLike: number;
  precipProb: number;
  wind: number;
  humidity: number;
  description: string;
  icon: string;
}

export interface WeatherCache {
  daily: DailyWeather[];
  hourly: HourlyWeather[];
  lastUpdated: number;
}

// Enhanced Item types for weather recommendations
export type ItemSubType = 
  | 'sneakers' | 'boots' | 'sandals' | 'dress_shoes' | 'athletic_shoes'
  | 't_shirt' | 'shirt' | 'sweater' | 'jacket' | 'coat' | 'dress'
  | 'jeans' | 'shorts' | 'pants' | 'skirt'
  | 'watch' | 'jewelry' | 'bag' | 'hat' | 'sunglasses' | 'umbrella'
  | 'cologne' | 'perfume';

export type FragranceFamily = 
  | 'fresh' | 'citrus' | 'aquatic' | 'woody' | 'warm' | 'powdery' | 'floral' | 'oriental';

export type StrapType = 'leather' | 'metal' | 'rubber' | 'nylon' | 'fabric';

export interface EnhancedItem extends Item {
  subType?: ItemSubType;
  waterproof?: boolean;
  warmthRating?: number; // 1-5 scale
  breathability?: number; // 1-5 scale
  strapType?: StrapType; // for watches
  fragranceFamily?: FragranceFamily; // for perfumes
  weatherTags?: string[]; // computed tags based on weather rules
  fitScore?: number; // 0-100, computed based on current weather
}

// Outfit Scheduling Types
export interface ScheduledOutfit {
  id: string;
  userId: string;
  dateISO: string;
  outfitId?: string; // Reference to existing outfit
  name: string;
  category: Occasion;
  items: string[]; // Item IDs
  notes?: string;
  reminderEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OutfitPlan {
  id: string;
  name: string;
  items: string[];
  category: Occasion;
  notes?: string;
}