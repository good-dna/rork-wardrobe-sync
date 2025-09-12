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
import type { Tables, Inserts, Updates } from '@/lib/supabase';

// Helper function to convert database row to Sneaker type
function dbRowToSneaker(row: Tables<'sneakers'>): Sneaker {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand as SneakerBrand,
    model: row.model,
    category: row.category as SneakerCategory,
    size: {
      us: row.size_us,
      uk: row.size_uk || undefined,
      eu: row.size_eu || undefined,
      cm: row.size_cm || undefined,
    },
    condition: row.condition as SneakerCondition,
    purchaseDate: row.purchase_date || undefined,
    purchasePrice: row.purchase_price || undefined,
    purchaseLocation: row.purchase_location || undefined,
    imageUrls: row.image_urls,
    details: {
      sku: row.sku || undefined,
      styleCode: row.style_code || undefined,
      releaseDate: row.release_date || undefined,
      retailPrice: row.retail_price || undefined,
      currentMarketPrice: row.current_market_price || undefined,
      materials: row.materials as any[],
      colorway: {
        primary: row.colorway_primary,
        secondary: row.colorway_secondary || undefined,
        accent: row.colorway_accent || undefined,
        nickname: row.colorway_nickname || undefined,
      },
      limited: row.limited_edition,
      collaboration: row.collaboration || undefined,
      designer: row.designer || undefined,
      technology: row.technology,
    },
    wearCount: row.wear_count,
    lastWorn: row.last_worn || undefined,
    notes: row.notes || undefined,
    tags: row.tags,
    favorite: row.is_favorite,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper function to convert Sneaker to database insert
function sneakerToDbInsert(sneaker: Omit<Sneaker, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Inserts<'sneakers'> {
  return {
    user_id: userId,
    name: sneaker.name,
    brand: sneaker.brand,
    model: sneaker.model,
    category: sneaker.category,
    size_us: sneaker.size.us,
    size_uk: sneaker.size.uk || null,
    size_eu: sneaker.size.eu || null,
    size_cm: sneaker.size.cm || null,
    condition: sneaker.condition,
    purchase_date: sneaker.purchaseDate || null,
    purchase_price: sneaker.purchasePrice || null,
    purchase_location: sneaker.purchaseLocation || null,
    image_urls: sneaker.imageUrls,
    sku: sneaker.details.sku || null,
    style_code: sneaker.details.styleCode || null,
    release_date: sneaker.details.releaseDate || null,
    retail_price: sneaker.details.retailPrice || null,
    current_market_price: sneaker.details.currentMarketPrice || null,
    materials: sneaker.details.materials,
    colorway_primary: sneaker.details.colorway.primary,
    colorway_secondary: sneaker.details.colorway.secondary || null,
    colorway_accent: sneaker.details.colorway.accent || null,
    colorway_nickname: sneaker.details.colorway.nickname || null,
    limited_edition: sneaker.details.limited || false,
    collaboration: sneaker.details.collaboration || null,
    designer: sneaker.details.designer || null,
    technology: sneaker.details.technology || [],
    wear_count: sneaker.wearCount,
    last_worn: sneaker.lastWorn || null,
    notes: sneaker.notes || null,
    tags: sneaker.tags,
    is_favorite: sneaker.favorite,
  };
}

// Sneaker CRUD Operations
export async function addSneaker(sneaker: Omit<Sneaker, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId?: string): Promise<Sneaker> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = userId || user?.id;
  
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  const insertData = sneakerToDbInsert(sneaker, currentUserId);
  
  const { data, error } = await supabase
    .from('sneakers')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add sneaker: ${error.message}`);
  }

  return dbRowToSneaker(data);
}

export async function getSneakers(query?: SneakerQuery, userId?: string): Promise<Sneaker[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = userId || user?.id;
  
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  let supabaseQuery = supabase
    .from('sneakers')
    .select('*')
    .eq('user_id', currentUserId);

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
      supabaseQuery = supabaseQuery.eq('is_favorite', filters.favorite);
    }
    
    if (filters.searchQuery) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${filters.searchQuery}%,brand.ilike.%${filters.searchQuery}%,model.ilike.%${filters.searchQuery}%,colorway_nickname.ilike.%${filters.searchQuery}%`);
    }
    
    if (filters.sizeRange) {
      supabaseQuery = supabaseQuery
        .gte('size_us', filters.sizeRange.min)
        .lte('size_us', filters.sizeRange.max);
    }

    if (filters.priceRange) {
      supabaseQuery = supabaseQuery
        .gte('purchase_price', filters.priceRange.min)
        .lte('purchase_price', filters.priceRange.max);
    }
  }

  // Apply sorting
  if (query?.sortBy) {
    const ascending = query.sortOrder === 'asc';
    const column = query.sortBy === 'purchaseDate' ? 'purchase_date' :
                   query.sortBy === 'purchasePrice' ? 'purchase_price' :
                   query.sortBy === 'wearCount' ? 'wear_count' :
                   query.sortBy === 'lastWorn' ? 'last_worn' :
                   query.sortBy;
    
    supabaseQuery = supabaseQuery.order(column, { ascending });
  } else {
    // Default sort by creation date, newest first
    supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
  }

  // Apply pagination
  if (query?.offset !== undefined || query?.limit !== undefined) {
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);
  }

  const { data, error } = await supabaseQuery;

  if (error) {
    throw new Error(`Failed to fetch sneakers: ${error.message}`);
  }

  return data.map(dbRowToSneaker);
}

export async function getSneaker(id: string, userId?: string): Promise<Sneaker | null> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = userId || user?.id;
  
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('sneakers')
    .select('*')
    .eq('id', id)
    .eq('user_id', currentUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch sneaker: ${error.message}`);
  }

  return dbRowToSneaker(data);
}

export async function updateSneaker(id: string, updates: Partial<Sneaker>, userId?: string): Promise<Sneaker> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = userId || user?.id;
  
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  // Convert updates to database format
  const dbUpdates: Updates<'sneakers'> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
  if (updates.model !== undefined) dbUpdates.model = updates.model;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.condition !== undefined) dbUpdates.condition = updates.condition;
  if (updates.purchaseDate !== undefined) dbUpdates.purchase_date = updates.purchaseDate;
  if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
  if (updates.purchaseLocation !== undefined) dbUpdates.purchase_location = updates.purchaseLocation;
  if (updates.imageUrls !== undefined) dbUpdates.image_urls = updates.imageUrls;
  if (updates.wearCount !== undefined) dbUpdates.wear_count = updates.wearCount;
  if (updates.lastWorn !== undefined) dbUpdates.last_worn = updates.lastWorn;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.favorite !== undefined) dbUpdates.is_favorite = updates.favorite;
  
  if (updates.size) {
    if (updates.size.us !== undefined) dbUpdates.size_us = updates.size.us;
    if (updates.size.uk !== undefined) dbUpdates.size_uk = updates.size.uk;
    if (updates.size.eu !== undefined) dbUpdates.size_eu = updates.size.eu;
    if (updates.size.cm !== undefined) dbUpdates.size_cm = updates.size.cm;
  }

  if (updates.details) {
    if (updates.details.sku !== undefined) dbUpdates.sku = updates.details.sku;
    if (updates.details.styleCode !== undefined) dbUpdates.style_code = updates.details.styleCode;
    if (updates.details.releaseDate !== undefined) dbUpdates.release_date = updates.details.releaseDate;
    if (updates.details.retailPrice !== undefined) dbUpdates.retail_price = updates.details.retailPrice;
    if (updates.details.currentMarketPrice !== undefined) dbUpdates.current_market_price = updates.details.currentMarketPrice;
    if (updates.details.materials !== undefined) dbUpdates.materials = updates.details.materials;
    if (updates.details.limited !== undefined) dbUpdates.limited_edition = updates.details.limited;
    if (updates.details.collaboration !== undefined) dbUpdates.collaboration = updates.details.collaboration;
    if (updates.details.designer !== undefined) dbUpdates.designer = updates.details.designer;
    if (updates.details.technology !== undefined) dbUpdates.technology = updates.details.technology;
    
    if (updates.details.colorway) {
      if (updates.details.colorway.primary !== undefined) dbUpdates.colorway_primary = updates.details.colorway.primary;
      if (updates.details.colorway.secondary !== undefined) dbUpdates.colorway_secondary = updates.details.colorway.secondary;
      if (updates.details.colorway.accent !== undefined) dbUpdates.colorway_accent = updates.details.colorway.accent;
      if (updates.details.colorway.nickname !== undefined) dbUpdates.colorway_nickname = updates.details.colorway.nickname;
    }
  }

  const { data, error } = await supabase
    .from('sneakers')
    .update(dbUpdates)
    .eq('id', id)
    .eq('user_id', currentUserId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update sneaker: ${error.message}`);
  }

  return dbRowToSneaker(data);
}

export async function deleteSneaker(id: string, userId?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = userId || user?.id;
  
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('sneakers')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUserId);

  if (error) {
    throw new Error(`Failed to delete sneaker: ${error.message}`);
  }
}

export async function recordSneakerWear(id: string, userId?: string): Promise<Sneaker> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = userId || user?.id;
  
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  // First get current wear count
  const { data: currentData, error: fetchError } = await supabase
    .from('sneakers')
    .select('wear_count')
    .eq('id', id)
    .eq('user_id', currentUserId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch sneaker: ${fetchError.message}`);
  }

  const { data, error } = await supabase
    .from('sneakers')
    .update({
      wear_count: currentData.wear_count + 1,
      last_worn: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', currentUserId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to record wear: ${error.message}`);
  }

  return dbRowToSneaker(data);
}

export async function toggleSneakerFavorite(id: string, userId?: string): Promise<Sneaker> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = userId || user?.id;
  
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  // First get current favorite status
  const { data: currentData, error: fetchError } = await supabase
    .from('sneakers')
    .select('is_favorite')
    .eq('id', id)
    .eq('user_id', currentUserId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch sneaker: ${fetchError.message}`);
  }

  const { data, error } = await supabase
    .from('sneakers')
    .update({
      is_favorite: !currentData.is_favorite,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', currentUserId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to toggle favorite: ${error.message}`);
  }

  return dbRowToSneaker(data);
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
export async function getSneakerStats(userId?: string): Promise<SneakerStats> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = userId || user?.id;
  
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  const { data: sneakers, error } = await supabase
    .from('sneakers')
    .select('*')
    .eq('user_id', currentUserId);

  if (error) {
    throw new Error(`Failed to fetch sneakers for stats: ${error.message}`);
  }
  
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

  const totalValue = sneakers.reduce((sum, sneaker) => sum + (sneaker.purchase_price || 0), 0);
  const averagePrice = totalValue / sneakers.length;

  // Find most worn sneaker
  const mostWornSneaker = sneakers.reduce((prev, current) => 
    (current.wear_count > prev.wear_count) ? current : prev
  );

  // Find newest and oldest sneakers
  const sortedByDate = sneakers
    .filter(s => s.purchase_date)
    .sort((a, b) => new Date(b.purchase_date!).getTime() - new Date(a.purchase_date!).getTime());
  
  const newestSneaker = sortedByDate[0];
  const oldestSneaker = sortedByDate[sortedByDate.length - 1];

  // Calculate distributions
  const brandDistribution = sneakers.reduce((acc, sneaker) => {
    acc[sneaker.brand as SneakerBrand] = (acc[sneaker.brand as SneakerBrand] || 0) + 1;
    return acc;
  }, {} as Record<SneakerBrand, number>);

  const categoryDistribution = sneakers.reduce((acc, sneaker) => {
    acc[sneaker.category as SneakerCategory] = (acc[sneaker.category as SneakerCategory] || 0) + 1;
    return acc;
  }, {} as Record<SneakerCategory, number>);

  const conditionDistribution = sneakers.reduce((acc, sneaker) => {
    acc[sneaker.condition as SneakerCondition] = (acc[sneaker.condition as SneakerCondition] || 0) + 1;
    return acc;
  }, {} as Record<SneakerCondition, number>);

  // Calculate monthly spending
  const monthlySpending = sneakers
    .filter(s => s.purchase_date && s.purchase_price)
    .reduce((acc, sneaker) => {
      const month = new Date(sneaker.purchase_date!).toISOString().slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + sneaker.purchase_price!;
      return acc;
    }, {} as Record<string, number>);

  return {
    totalSneakers: sneakers.length,
    totalValue,
    averagePrice,
    mostWornSneaker: mostWornSneaker ? dbRowToSneaker(mostWornSneaker) : undefined,
    newestSneaker: newestSneaker ? dbRowToSneaker(newestSneaker) : undefined,
    oldestSneaker: oldestSneaker ? dbRowToSneaker(oldestSneaker) : undefined,
    brandDistribution,
    categoryDistribution,
    conditionDistribution,
    monthlySpending
  };
}

// Search and Discovery
export async function searchSneakers(query: string, userId?: string): Promise<Sneaker[]> {
  return getSneakers({
    filters: { searchQuery: query }
  }, userId);
}

// External sneaker database search (from your provided function)
export async function searchExternalSneakers(q: string, brand?: string) {
  let query = supabase
    .from("sneakers")
    .select("external_id, sku, brand, name, colorway, image_url, resell_url")
    .ilike("name", `%${q}%`)
    .limit(50);

  if (brand) query = query.eq("brand", brand);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getSneakersByBrand(brand: SneakerBrand, userId?: string): Promise<Sneaker[]> {
  return getSneakers({
    filters: { brand: [brand] }
  }, userId);
}

export async function getFavoriteSneakers(userId?: string): Promise<Sneaker[]> {
  return getSneakers({
    filters: { favorite: true }
  }, userId);
}

export async function getRecentlyWornSneakers(limit: number = 10, userId?: string): Promise<Sneaker[]> {
  return getSneakers({
    sortBy: 'lastWorn',
    sortOrder: 'desc',
    limit
  }, userId);
}