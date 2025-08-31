import { supabase } from '@/lib/supabase';
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

// Sneaker CRUD Operations
export async function addSneaker(sneaker: Omit<Sneaker, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Sneaker> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('sneakers')
    .insert({
      ...sneaker,
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSneakers(query?: SneakerQuery): Promise<Sneaker[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  let supabaseQuery = supabase
    .from('sneakers')
    .select('*')
    .eq('userId', user.id);

  // Apply filters
  if (query?.filters) {
    const { filters } = query;
    
    if (filters.brand && filters.brand.length > 0) {
      supabaseQuery = supabaseQuery.in('brand', filters.brand);
    }
    
    if (filters.category && filters.category.length > 0) {
      supabaseQuery = supabaseQuery.in('category', filters.category);
    }
    
    if (filters.condition && filters.condition.length > 0) {
      supabaseQuery = supabaseQuery.in('condition', filters.condition);
    }
    
    if (filters.favorite !== undefined) {
      supabaseQuery = supabaseQuery.eq('favorite', filters.favorite);
    }
    
    if (filters.searchQuery) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${filters.searchQuery}%,model.ilike.%${filters.searchQuery}%,brand.ilike.%${filters.searchQuery}%`);
    }
    
    if (filters.sizeRange) {
      supabaseQuery = supabaseQuery
        .gte('size->us', filters.sizeRange.min)
        .lte('size->us', filters.sizeRange.max);
    }
  }

  // Apply sorting
  if (query?.sortBy) {
    const ascending = query.sortOrder === 'asc';
    supabaseQuery = supabaseQuery.order(query.sortBy, { ascending });
  } else {
    supabaseQuery = supabaseQuery.order('createdAt', { ascending: false });
  }

  // Apply pagination
  if (query?.limit) {
    supabaseQuery = supabaseQuery.limit(query.limit);
  }
  
  if (query?.offset) {
    supabaseQuery = supabaseQuery.range(query.offset, query.offset + (query.limit || 50) - 1);
  }

  const { data, error } = await supabaseQuery;

  if (error) throw error;
  return data || [];
}

export async function getSneaker(id: string): Promise<Sneaker | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('sneakers')
    .select('*')
    .eq('id', id)
    .eq('userId', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

export async function updateSneaker(id: string, updates: Partial<Sneaker>): Promise<Sneaker> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('sneakers')
    .update({
      ...updates,
      updatedAt: new Date().toISOString()
    })
    .eq('id', id)
    .eq('userId', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSneaker(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('sneakers')
    .delete()
    .eq('id', id)
    .eq('userId', user.id);

  if (error) throw error;
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

// Collection Operations
export async function createSneakerCollection(collection: Omit<SneakerCollection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<SneakerCollection> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('sneaker_collections')
    .insert({
      ...collection,
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSneakerCollections(): Promise<SneakerCollection[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('sneaker_collections')
    .select('*')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addSneakerToCollection(collectionId: string, sneakerId: string): Promise<SneakerCollection> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  // Get current collection
  const { data: collection, error: fetchError } = await supabase
    .from('sneaker_collections')
    .select('*')
    .eq('id', collectionId)
    .eq('userId', user.id)
    .single();

  if (fetchError) throw fetchError;

  // Add sneaker to collection if not already present
  const updatedSneakerIds = collection.sneakerIds.includes(sneakerId) 
    ? collection.sneakerIds 
    : [...collection.sneakerIds, sneakerId];

  const { data, error } = await supabase
    .from('sneaker_collections')
    .update({
      sneakerIds: updatedSneakerIds,
      updatedAt: new Date().toISOString()
    })
    .eq('id', collectionId)
    .eq('userId', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Wishlist Operations
export async function addSneakerToWishlist(item: Omit<SneakerWishlistItem, 'id' | 'userId' | 'createdAt'>): Promise<SneakerWishlistItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('sneaker_wishlist')
    .insert({
      ...item,
      userId: user.id,
      createdAt: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSneakerWishlist(): Promise<SneakerWishlistItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('sneaker_wishlist')
    .select('*')
    .eq('userId', user.id)
    .order('priority', { ascending: false })
    .order('createdAt', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function removeSneakerFromWishlist(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('sneaker_wishlist')
    .delete()
    .eq('id', id)
    .eq('userId', user.id);

  if (error) throw error;
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
  return getSneakers({
    filters: { searchQuery: query },
    limit: 20
  });
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