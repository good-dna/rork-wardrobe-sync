export type SneakerBrand = 
  | 'Nike' | 'Adidas' | 'Jordan' | 'New Balance' | 'Converse' | 'Vans'
  | 'Puma' | 'Reebok' | 'ASICS' | 'Saucony' | 'Under Armour' | 'Balenciaga'
  | 'Golden Goose' | 'Common Projects' | 'Off-White' | 'Fear of God'
  | 'Yeezy' | 'Travis Scott' | 'Dior' | 'Louis Vuitton' | 'Gucci'
  | 'Other';

export type SneakerCategory = 
  | 'Basketball' | 'Running' | 'Lifestyle' | 'Skateboarding' | 'Training'
  | 'Tennis' | 'Soccer' | 'Hiking' | 'Casual' | 'High Fashion' | 'Retro';

export type SneakerCondition = 
  | 'Deadstock' | 'New' | 'Very Good' | 'Good' | 'Fair' | 'Poor';

export type SneakerSize = {
  us: number;
  uk?: number;
  eu?: number;
  cm?: number;
};

export type SneakerColorway = {
  primary: string;
  secondary?: string;
  accent?: string;
  nickname?: string; // e.g., "Bred", "Chicago", "Royal"
};

export type SneakerMaterial = 
  | 'Leather' | 'Suede' | 'Canvas' | 'Mesh' | 'Knit' | 'Synthetic'
  | 'Patent Leather' | 'Nubuck' | 'Flyknit' | 'Primeknit' | 'Boost';

export interface SneakerDetails {
  sku?: string;
  styleCode?: string;
  releaseDate?: string;
  retailPrice?: number;
  currentMarketPrice?: number;
  materials: SneakerMaterial[];
  colorway: SneakerColorway;
  limited?: boolean;
  collaboration?: string;
  designer?: string;
  technology?: string[]; // e.g., ["Air Max", "Zoom Air"]
}

export interface Sneaker {
  id: string;
  name: string;
  brand: SneakerBrand;
  model: string; // e.g., "Air Jordan 1", "Stan Smith"
  category: SneakerCategory;
  size: SneakerSize;
  condition: SneakerCondition;
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseLocation?: string;
  imageUrls: string[];
  details: SneakerDetails;
  wearCount: number;
  lastWorn?: string;
  notes?: string;
  tags: string[];
  favorite: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SneakerCollection {
  id: string;
  name: string;
  description?: string;
  sneakerIds: string[];
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SneakerWishlistItem {
  id: string;
  name: string;
  brand: SneakerBrand;
  model: string;
  colorway: SneakerColorway;
  size: SneakerSize;
  estimatedPrice?: number;
  priority: 'Low' | 'Medium' | 'High';
  releaseDate?: string;
  imageUrl?: string;
  notes?: string;
  userId: string;
  createdAt: string;
}

export interface SneakerFilters {
  brand?: SneakerBrand[];
  category?: SneakerCategory[];
  condition?: SneakerCondition[];
  sizeRange?: { min: number; max: number };
  priceRange?: { min: number; max: number };
  materials?: SneakerMaterial[];
  colors?: string[];
  searchQuery?: string;
  favorite?: boolean;
  tags?: string[];
}

export interface SneakerStats {
  totalSneakers: number;
  totalValue: number;
  averagePrice: number;
  mostWornSneaker?: Sneaker;
  newestSneaker?: Sneaker;
  oldestSneaker?: Sneaker;
  brandDistribution: Record<SneakerBrand, number>;
  categoryDistribution: Record<SneakerCategory, number>;
  conditionDistribution: Record<SneakerCondition, number>;
  monthlySpending: Record<string, number>;
}

export interface SneakerRecommendation {
  sneaker: Sneaker;
  score: number;
  reasons: string[];
  weatherSuitability?: number;
  occasionMatch?: number;
}

export type SneakerSortBy = 
  | 'name' | 'brand' | 'purchaseDate' | 'purchasePrice' | 'wearCount'
  | 'lastWorn' | 'condition' | 'marketValue' | 'releaseDate';

export type SortOrder = 'asc' | 'desc';

export interface SneakerQuery {
  filters?: SneakerFilters;
  sortBy?: SneakerSortBy;
  sortOrder?: SortOrder;
  limit?: number;
  offset?: number;
}