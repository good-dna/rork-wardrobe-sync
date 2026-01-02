import { trpcClient } from '@/lib/trpc';
import { cacheService } from './cacheService';
import { syncService } from './syncService';
import { mockItems } from '@/constants/mockData';

// Data API abstraction layer - replaces Supabase dependencies
export interface WardrobeItem {
  id: string;
  name: string;
  brand?: string;
  category: 'clothes' | 'shoes' | 'accessory' | 'perfume' | 'watch';
  color?: string;
  size?: string;
  material?: string;
  season?: string[];
  imageUrl?: string;
  bgRemovedUrl?: string;
  barcode?: string;
  sku?: string;
  source: 'scan' | 'excel' | 'manual' | 'api';
  price?: number;
  purchaseDate?: string;
  tags?: string[];
  notes?: string;
  waterproof?: boolean;
  warmthRating?: number; // 1-5
  breathability?: number; // 1-5
  fragranceFamily?: string;
  strapType?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Outfit {
  id: string;
  name: string;
  description?: string;
  items: string[]; // item IDs
  occasion?: string;
  season?: string[];
  weather?: {
    minTemp?: number;
    maxTemp?: number;
    conditions?: string[];
  };
  imageUrl?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomeFeedData {
  recentItems: WardrobeItem[];
  recentOutfits: Outfit[];
  stats: {
    totalItems: number;
    totalValue: number;
    categoriesCount: number;
    brandsCount: number;
  };
  weatherRecommendations: any[];
}

export interface ItemFilter {
  category?: string;
  season?: string;
  color?: string;
  brand?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

class DataAPI {
  private userId: string = 'demo-user-1'; // In real app, get from auth

  async getHomeFeed(uid: string): Promise<HomeFeedData> {
    try {
      // Try cache first
      const cached = await cacheService.get(`homeFeed:${uid}`);
      if (cached && Date.now() - (cached as any).updatedAt < 5 * 60 * 1000) {
        return (cached as any) as HomeFeedData;
      }

      // Fetch from server
      const [items, outfits, stats] = await Promise.all([
        this.listItems(uid, { limit: 10 }),
        this.listOutfits(uid, { limit: 5 }),
        this.getItemStats(uid)
      ]);

      const homeFeed: HomeFeedData = {
        recentItems: items,
        recentOutfits: outfits,
        stats,
        weatherRecommendations: [], // Will be populated by weather service
      };

      // Cache the result
      const cacheData = {
        ...homeFeed,
        id: `homeFeed:${uid}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      };
      await cacheService.set(`homeFeed:${uid}`, cacheData as any);

      return homeFeed;
    } catch (error) {
      console.error('Failed to get home feed:', error);
      // Return cached data if available, even if stale
      const cached = await cacheService.get(`homeFeed:${uid}`);
      if (cached) {
        return (cached as any) as HomeFeedData;
      }
      throw error;
    }
  }

  async listItems(uid: string, filter: ItemFilter = {}): Promise<WardrobeItem[]> {
    try {
      const cacheKey = `items:${uid}:${JSON.stringify(filter)}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached && Array.isArray(cached) && cached.length > 0) {
        const firstItem = cached[0] as WardrobeItem;
        if (Date.now() - new Date(firstItem.updatedAt).getTime() < 2 * 60 * 1000) {
          return cached as WardrobeItem[];
        }
      }

      const items = await trpcClient.wardrobe.items.list.query(filter);
      const cacheData = {
        id: cacheKey,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        data: items
      };
      await cacheService.set(cacheKey, cacheData as any);
      
      return items as WardrobeItem[];
    } catch (error) {
      console.error('Failed to list items:', error);
      // Return cached data or mock data as fallback
      const cacheKey = `items:${uid}:${JSON.stringify(filter)}`;
      const cached = await cacheService.get(cacheKey);
      if ((cached as any)?.data) {
        return (cached as any).data;
      }
      
      // Return mock data as final fallback
      console.log('Using mock data as fallback for items');
      return mockItems.map(item => {
        // Map categories to match the WardrobeItem interface
        let category: 'clothes' | 'shoes' | 'accessory' | 'perfume' | 'watch';
        switch (item.category) {
          case 'shirts':
          case 'pants':
          case 'jackets':
            category = 'clothes';
            break;
          case 'shoes':
            category = 'shoes';
            break;
          case 'accessories':
            category = 'accessory';
            break;
          case 'fragrances':
            category = 'perfume';
            break;
          default:
            category = 'clothes';
        }
        
        return {
          ...item,
          category,
          userId: uid,
          source: 'manual' as const,
          createdAt: item.purchaseDate || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          imageUrl: item.imageUrl,
          price: item.purchasePrice,
        };
      }).slice(0, filter.limit || 50);
    }
  }

  async listOutfits(uid: string, filter: any = {}): Promise<Outfit[]> {
    try {
      const cacheKey = `outfits:${uid}:${JSON.stringify(filter)}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached && Array.isArray((cached as any)?.data) && (cached as any).data.length > 0) {
        const firstOutfit = (cached as any).data[0] as Outfit;
        if (Date.now() - new Date(firstOutfit.updatedAt).getTime() < 2 * 60 * 1000) {
          return (cached as any).data as Outfit[];
        }
      }

      const outfits = await trpcClient.wardrobe.outfits.list.query(filter);
      const cacheData = {
        id: cacheKey,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        data: outfits
      };
      await cacheService.set(cacheKey, cacheData as any);
      
      return outfits as Outfit[];
    } catch (error) {
      console.error('Failed to list outfits:', error);
      const cacheKey = `outfits:${uid}:${JSON.stringify(filter)}`;
      const cached = await cacheService.get(cacheKey);
      if ((cached as any)?.data) {
        return (cached as any).data;
      }
      
      // Return mock outfits as fallback
      console.log('Using mock data as fallback for outfits');
      return [
        {
          id: '1',
          name: 'Casual Friday',
          description: 'Comfortable outfit for casual Friday at work',
          items: ['1', '2', '4'],
          occasion: 'work',
          season: ['spring', 'fall'],
          imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=2070&auto=format&fit=crop',
          userId: uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Night Out',
          description: 'Stylish outfit for evening events',
          items: ['3', '2', '5', '6'],
          occasion: 'evening',
          season: ['fall', 'winter'],
          imageUrl: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1974&auto=format&fit=crop',
          userId: uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ].slice(0, filter.limit || 50);
    }
  }

  async getWeather(uid: string): Promise<any> {
    try {
      // Mock weather data for now since we need lat/lon
      const weather = {
        temperature: 22,
        description: 'Partly cloudy',
        humidity: 65,
        windSpeed: 10
      };
      return weather;
    } catch (error) {
      console.error('Failed to get weather:', error);
      return null;
    }
  }

  async getItemStats(uid: string): Promise<HomeFeedData['stats']> {
    try {
      const stats = await trpcClient.analytics.overview.query({ timeFrame: 'all' });
      return {
        totalItems: stats.totalItems || 0,
        totalValue: stats.totalValue || 0,
        categoriesCount: 5, // Mock data for now
        brandsCount: 8, // Mock data for now
      };
    } catch (error) {
      console.error('Failed to get item stats:', error);
      // Return mock stats as fallback
      console.log('Using mock data as fallback for stats');
      const totalValue = mockItems.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
      const categories = new Set(mockItems.map(item => item.category)).size;
      const brands = new Set(mockItems.map(item => item.brand)).size;
      
      return {
        totalItems: mockItems.length,
        totalValue: totalValue,
        categoriesCount: categories,
        brandsCount: brands,
      };
    }
  }

  async addItem(item: Omit<WardrobeItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<WardrobeItem> {
    try {
      const newItem = await trpcClient.wardrobe.items.add.mutate(item);
      
      // Invalidate cache
      await this.invalidateItemsCache(this.userId);
      
      return newItem as WardrobeItem;
    } catch (error) {
      console.error('Failed to add item:', error);
      
      // Queue for offline sync
      await syncService.queueOperation({
        type: 'create',
        entity: 'item',
        entityId: `temp-${Date.now()}`,
        data: item,
      });
      
      throw error;
    }
  }

  async updateItem(id: string, updates: Partial<WardrobeItem>): Promise<WardrobeItem> {
    try {
      const updatedItem = await trpcClient.wardrobe.items.update.mutate({ id, ...updates });
      
      // Invalidate cache
      await this.invalidateItemsCache(this.userId);
      
      return updatedItem as unknown as WardrobeItem;
    } catch (error) {
      console.error('Failed to update item:', error);
      
      // Queue for offline sync
      await syncService.queueOperation({
        type: 'update',
        entity: 'item',
        entityId: id,
        data: updates,
      });
      
      throw error;
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      await trpcClient.wardrobe.items.delete.mutate({ id });
      
      // Invalidate cache
      await this.invalidateItemsCache(this.userId);
    } catch (error) {
      console.error('Failed to delete item:', error);
      
      // Queue for offline sync
      await syncService.queueOperation({
        type: 'delete',
        entity: 'item',
        entityId: id,
        data: {},
      });
      
      throw error;
    }
  }

  private async invalidateItemsCache(uid: string): Promise<void> {
    try {
      const keys = await cacheService.keys();
      const itemKeys = keys.filter(key => key.startsWith(`items:${uid}:`) || key.startsWith(`homeFeed:${uid}`));
      
      await Promise.all(itemKeys.map(key => cacheService.remove(key)));
    } catch (error) {
      console.error('Failed to invalidate items cache:', error);
    }
  }
}

export const dataApi = new DataAPI();