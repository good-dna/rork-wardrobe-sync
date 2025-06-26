export type Category = 'shirts' | 'pants' | 'jackets' | 'shoes' | 'accessories' | 'fragrances';
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all';
export type CleaningStatus = 'clean' | 'dirty' | 'needs repair';
export type Occasion = 'casual' | 'formal' | 'work' | 'athletic' | 'evening' | 'special';
export type Priority = 'low' | 'medium' | 'high';

export interface Item {
  id: string;
  name: string;
  brand: string;
  category: Category;
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
  // New fields for tracking wear and wash history
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