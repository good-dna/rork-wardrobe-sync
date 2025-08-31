export interface Sneaker {
  id: string;
  name: string;
  brand: string;
  model: string;
  colorway: string;
  releaseDate: string;
  retailPrice: number;
  currentPrice?: number;
  size: number;
  condition: 'deadstock' | 'vnds' | 'used' | 'beater';
  images: string[];
  sku?: string;
  description?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  location?: string;
  tags: string[];
  category: 'basketball' | 'running' | 'lifestyle' | 'skateboarding' | 'football' | 'other';
  rarity: 'common' | 'uncommon' | 'rare' | 'grail';
  isWishlisted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SneakerBrand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
}

export interface SneakerRelease {
  id: string;
  name: string;
  brand: string;
  model: string;
  colorway: string;
  releaseDate: string;
  retailPrice: number;
  images: string[];
  description?: string;
  isUpcoming: boolean;
  raffleLinks?: string[];
}

export interface PriceHistory {
  id: string;
  sneakerId: string;
  price: number;
  size: number;
  date: string;
  platform: string;
}

export interface UserCollection {
  id: string;
  userId: string;
  sneakers: Sneaker[];
  totalValue: number;
  totalItems: number;
  favoritesBrand?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  sneakerId?: string;
  name: string;
  brand: string;
  model: string;
  colorway: string;
  size: number;
  maxPrice?: number;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt: string;
}

export type SneakerFilter = {
  brands?: string[];
  categories?: string[];
  conditions?: string[];
  priceRange?: [number, number];
  sizeRange?: [number, number];
  rarity?: string[];
  sortBy?: 'name' | 'brand' | 'price' | 'releaseDate' | 'purchaseDate';
  sortOrder?: 'asc' | 'desc';
};