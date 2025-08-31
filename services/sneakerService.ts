import { trpcClient } from '@/lib/trpc';
import { Sneaker, WishlistItem, SneakerFilter } from '@/types/sneaker';

// ==================== COLLECTION SERVICES ====================

export const sneakerService = {
  // Add sneaker to collection
  async addSneaker(sneakerData: {
    name: string;
    brand: string;
    model: string;
    colorway: string;
    releaseDate?: string;
    retailPrice?: number;
    currentPrice?: number;
    size: number;
    condition: 'deadstock' | 'vnds' | 'used' | 'beater';
    images?: string[];
    sku?: string;
    description?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    location?: string;
    tags?: string[];
    category: 'basketball' | 'running' | 'lifestyle' | 'skateboarding' | 'football' | 'other';
    rarity: 'common' | 'uncommon' | 'rare' | 'grail';
  }): Promise<Sneaker> {
    return await trpcClient.sneakers.add.mutate(sneakerData);
  },

  // Get user's sneaker collection
  async getMySneakers(filters?: SneakerFilter): Promise<Sneaker[]> {
    return await trpcClient.sneakers.getMy.query(filters);
  },

  // Get single sneaker
  async getSneaker(id: string): Promise<Sneaker | null> {
    return await trpcClient.sneakers.get.query({ id });
  },

  // Update sneaker
  async updateSneaker(id: string, updates: Partial<Sneaker>): Promise<Sneaker> {
    return await trpcClient.sneakers.update.mutate({ id, updates });
  },

  // Delete sneaker
  async deleteSneaker(id: string): Promise<void> {
    return await trpcClient.sneakers.delete.mutate({ id });
  },

  // Get collection stats
  async getCollectionStats() {
    return await trpcClient.sneakers.getStats.query();
  }
};

// ==================== WISHLIST SERVICES ====================

export const wishlistService = {
  // Add to wishlist
  async addToWishlist(wishlistData: {
    sneakerId?: string;
    name: string;
    brand: string;
    model: string;
    colorway: string;
    size: number;
    maxPrice?: number;
    priority: 'low' | 'medium' | 'high';
    notes?: string;
  }): Promise<WishlistItem> {
    return await trpcClient.sneakers.addToWishlist.mutate(wishlistData);
  },

  // Get user's wishlist
  async getMyWishlist(): Promise<WishlistItem[]> {
    return await trpcClient.sneakers.getMyWishlist.query();
  },

  // Remove from wishlist
  async removeFromWishlist(id: string): Promise<void> {
    return await trpcClient.sneakers.removeFromWishlist.mutate({ id });
  },

  // Update wishlist item
  async updateWishlistItem(id: string, updates: Partial<WishlistItem>): Promise<WishlistItem> {
    return await trpcClient.sneakers.updateWishlistItem.mutate({ id, updates });
  }
};

// ==================== PUBLIC DATA SERVICES ====================

export const publicSneakerService = {
  // Search sneakers in public database
  async searchSneakers(query: string, limit: number = 20) {
    return await trpcClient.sneakers.search.query({ query, limit });
  },

  // Get trending sneakers
  async getTrendingSneakers(limit: number = 10) {
    return await trpcClient.sneakers.getTrending.query({ limit });
  },

  // Get upcoming releases
  async getUpcomingReleases(limit: number = 20) {
    return await trpcClient.sneakers.getUpcoming.query({ limit });
  }
};

// ==================== PRICE TRACKING SERVICES ====================

export const priceTrackingService = {
  // Add price history entry
  async addPriceHistory(priceData: {
    sneakerId: string;
    price: number;
    size: number;
    platform: string;
  }) {
    return await trpcClient.sneakers.addPriceHistory.mutate(priceData);
  },

  // Get price history for a sneaker
  async getPriceHistory(sneakerId: string, size?: number) {
    return await trpcClient.sneakers.getPriceHistory.query({ sneakerId, size });
  }
};

// ==================== UTILITY FUNCTIONS ====================

export const sneakerUtils = {
  // Calculate collection value
  calculateCollectionValue(sneakers: Sneaker[]): number {
    return sneakers.reduce((total, sneaker) => total + (sneaker.currentPrice || 0), 0);
  },

  // Get most valuable sneakers
  getMostValuable(sneakers: Sneaker[], limit: number = 5): Sneaker[] {
    return sneakers
      .filter(sneaker => sneaker.currentPrice)
      .sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0))
      .slice(0, limit);
  },

  // Get sneakers by brand
  getSneakersByBrand(sneakers: Sneaker[], brand: string): Sneaker[] {
    return sneakers.filter(sneaker => 
      sneaker.brand.toLowerCase() === brand.toLowerCase()
    );
  },

  // Get sneakers by condition
  getSneakersByCondition(sneakers: Sneaker[], condition: string): Sneaker[] {
    return sneakers.filter(sneaker => sneaker.condition === condition);
  },

  // Get sneakers by rarity
  getSneakersByRarity(sneakers: Sneaker[], rarity: string): Sneaker[] {
    return sneakers.filter(sneaker => sneaker.rarity === rarity);
  },

  // Format price
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  },

  // Get condition color
  getConditionColor(condition: string): string {
    switch (condition) {
      case 'deadstock': return '#10B981'; // green
      case 'vnds': return '#3B82F6'; // blue
      case 'used': return '#F59E0B'; // yellow
      case 'beater': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  },

  // Get rarity color
  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common': return '#6B7280'; // gray
      case 'uncommon': return '#10B981'; // green
      case 'rare': return '#3B82F6'; // blue
      case 'grail': return '#8B5CF6'; // purple
      default: return '#6B7280'; // gray
    }
  }
};