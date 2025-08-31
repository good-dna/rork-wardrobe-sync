// Using mock data for now - Supabase integration can be added later
import { mockSneakers, searchMockSneakers } from '@/constants/mockSneakers';
import { 
  Sneaker, 
  SneakerCollection, 
  SneakerWishlistItem, 
  SneakerQuery, 
  SneakerStats,
  SneakerBrand,
  SneakerCategory,
  SneakerCondition
} from '@/types/sneaker';

// Mock data storage (in real app, this would be in a database)
let sneakersData = [...mockSneakers];

// Sneaker CRUD Operations
export async function addSneaker(sneaker: Omit<Sneaker, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Sneaker> {
  const newSneaker: Sneaker = {
    ...sneaker,
    id: Date.now().toString(),
    userId: 'mock-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  sneakersData.push(newSneaker);
  return newSneaker;
}

export async function getSneakers(query?: SneakerQuery): Promise<Sneaker[]> {
  let filteredSneakers = [...sneakersData];

  // Apply filters
  if (query?.filters) {
    const { filters } = query;
    
    if (filters.brand && filters.brand.length > 0) {
      filteredSneakers = filteredSneakers.filter(sneaker => filters.brand!.includes(sneaker.brand));
    }
    
    if (filters.category && filters.category.length > 0) {
      filteredSneakers = filteredSneakers.filter(sneaker => filters.category!.includes(sneaker.category));
    }
    
    if (filters.condition && filters.condition.length > 0) {
      filteredSneakers = filteredSneakers.filter(sneaker => filters.condition!.includes(sneaker.condition));
    }
    
    if (filters.favorite !== undefined) {
      filteredSneakers = filteredSneakers.filter(sneaker => sneaker.favorite === filters.favorite);
    }
    
    if (filters.searchQuery) {
      filteredSneakers = searchMockSneakers(filters.searchQuery);
    }
    
    if (filters.sizeRange) {
      filteredSneakers = filteredSneakers.filter(sneaker => 
        sneaker.size.us >= filters.sizeRange!.min && 
        sneaker.size.us <= filters.sizeRange!.max
      );
    }
  }

  // Apply sorting
  if (query?.sortBy) {
    const ascending = query.sortOrder === 'asc';
    filteredSneakers.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (query.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'brand':
          aValue = a.brand;
          bValue = b.brand;
          break;
        case 'purchaseDate':
          aValue = new Date(a.purchaseDate || 0);
          bValue = new Date(b.purchaseDate || 0);
          break;
        case 'purchasePrice':
          aValue = a.purchasePrice || 0;
          bValue = b.purchasePrice || 0;
          break;
        case 'wearCount':
          aValue = a.wearCount;
          bValue = b.wearCount;
          break;
        case 'lastWorn':
          aValue = new Date(a.lastWorn || 0);
          bValue = new Date(b.lastWorn || 0);
          break;
        case 'condition':
          aValue = a.condition;
          bValue = b.condition;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (aValue < bValue) return ascending ? -1 : 1;
      if (aValue > bValue) return ascending ? 1 : -1;
      return 0;
    });
  } else {
    // Default sort by creation date, newest first
    filteredSneakers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Apply pagination
  if (query?.offset !== undefined || query?.limit !== undefined) {
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    filteredSneakers = filteredSneakers.slice(offset, offset + limit);
  }

  return filteredSneakers;
}

export async function getSneaker(id: string): Promise<Sneaker | null> {
  const sneaker = sneakersData.find(s => s.id === id);
  return sneaker || null;
}

export async function updateSneaker(id: string, updates: Partial<Sneaker>): Promise<Sneaker> {
  const index = sneakersData.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Sneaker not found');
  
  sneakersData[index] = {
    ...sneakersData[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  return sneakersData[index];
}

export async function deleteSneaker(id: string): Promise<void> {
  const index = sneakersData.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Sneaker not found');
  
  sneakersData.splice(index, 1);
}

export async function recordSneakerWear(id: string): Promise<Sneaker> {
  const sneaker = await getSneaker(id);
  if (!sneaker) throw new Error('Sneaker not found');

  return updateSneaker(id, {
    wearCount: sneaker.wearCount + 1,
    lastWorn: new Date().toISOString()
  });
}

export async function toggleSneakerFavorite(id: string): Promise<Sneaker> {
  const sneaker = await getSneaker(id);
  if (!sneaker) throw new Error('Sneaker not found');

  return updateSneaker(id, {
    favorite: !sneaker.favorite
  });
}

// Collection Operations (mock implementations)
export async function createSneakerCollection(collection: Omit<SneakerCollection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<SneakerCollection> {
  const newCollection: SneakerCollection = {
    ...collection,
    id: Date.now().toString(),
    userId: 'mock-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return newCollection;
}

export async function getSneakerCollections(): Promise<SneakerCollection[]> {
  // Mock implementation - return empty array for now
  return [];
}

export async function addSneakerToCollection(collectionId: string, sneakerId: string): Promise<SneakerCollection> {
  // Mock implementation
  return {
    id: collectionId,
    name: 'Mock Collection',
    description: 'Mock collection description',
    sneakerIds: [sneakerId],
    isPublic: false,
    userId: 'mock-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Wishlist Operations (mock implementations)
export async function addSneakerToWishlist(item: Omit<SneakerWishlistItem, 'id' | 'userId' | 'createdAt'>): Promise<SneakerWishlistItem> {
  const newItem: SneakerWishlistItem = {
    ...item,
    id: Date.now().toString(),
    userId: 'mock-user',
    createdAt: new Date().toISOString()
  };
  
  return newItem;
}

export async function getSneakerWishlist(): Promise<SneakerWishlistItem[]> {
  // Mock implementation - return empty array for now
  return [];
}

export async function removeSneakerFromWishlist(id: string): Promise<void> {
  // Mock implementation - do nothing for now
  console.log('Removing wishlist item:', id);
}

// Analytics and Stats
export async function getSneakerStats(): Promise<SneakerStats> {
  const sneakers = await getSneakers();
  
  if (sneakers.length === 0) {
    return {
      totalSneakers: 0,
      totalValue: 0,
      averagePrice: 0,
      brandDistribution: {} as Record<SneakerBrand, number>,
      categoryDistribution: {} as Record<SneakerCategory, number>,
      conditionDistribution: {} as Record<SneakerCondition, number>,
      monthlySpending: {}
    };
  }

  const totalValue = sneakers.reduce((sum, sneaker) => sum + (sneaker.purchasePrice || 0), 0);
  const averagePrice = totalValue / sneakers.length;

  // Find most worn sneaker
  const mostWornSneaker = sneakers.reduce((prev, current) => 
    (current.wearCount > prev.wearCount) ? current : prev
  );

  // Find newest and oldest sneakers
  const sortedByDate = sneakers
    .filter(s => s.purchaseDate)
    .sort((a, b) => new Date(b.purchaseDate!).getTime() - new Date(a.purchaseDate!).getTime());
  
  const newestSneaker = sortedByDate[0];
  const oldestSneaker = sortedByDate[sortedByDate.length - 1];

  // Calculate distributions
  const brandDistribution = sneakers.reduce((acc, sneaker) => {
    acc[sneaker.brand] = (acc[sneaker.brand] || 0) + 1;
    return acc;
  }, {} as Record<SneakerBrand, number>);

  const categoryDistribution = sneakers.reduce((acc, sneaker) => {
    acc[sneaker.category] = (acc[sneaker.category] || 0) + 1;
    return acc;
  }, {} as Record<SneakerCategory, number>);

  const conditionDistribution = sneakers.reduce((acc, sneaker) => {
    acc[sneaker.condition] = (acc[sneaker.condition] || 0) + 1;
    return acc;
  }, {} as Record<SneakerCondition, number>);

  // Calculate monthly spending
  const monthlySpending = sneakers
    .filter(s => s.purchaseDate && s.purchasePrice)
    .reduce((acc, sneaker) => {
      const month = new Date(sneaker.purchaseDate!).toISOString().slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + sneaker.purchasePrice!;
      return acc;
    }, {} as Record<string, number>);

  return {
    totalSneakers: sneakers.length,
    totalValue,
    averagePrice,
    mostWornSneaker,
    newestSneaker,
    oldestSneaker,
    brandDistribution,
    categoryDistribution,
    conditionDistribution,
    monthlySpending
  };
}

// Search and Discovery
export async function searchSneakers(query: string): Promise<Sneaker[]> {
  return searchMockSneakers(query);
}

export async function getSneakersByBrand(brand: SneakerBrand): Promise<Sneaker[]> {
  return getSneakers({
    filters: { brand: [brand] }
  });
}

export async function getFavoriteSneakers(): Promise<Sneaker[]> {
  return getSneakers({
    filters: { favorite: true }
  });
}

export async function getRecentlyWornSneakers(limit: number = 10): Promise<Sneaker[]> {
  return getSneakers({
    sortBy: 'lastWorn',
    sortOrder: 'desc',
    limit
  });
}