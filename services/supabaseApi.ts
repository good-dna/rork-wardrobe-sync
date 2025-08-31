import { supabase } from '@/lib/supabase';
import { Sneaker, WishlistItem, PriceHistory, UserCollection, SneakerFilter } from '@/types/sneaker';

export interface WardrobeItem {
  id?: string;
  name: string;
  brand?: string;
  category?: string;
  color?: string;
  size?: string;
  season?: string[];
  image_url?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export async function addItem(input: {
  name: string;
  brand?: string;
  category?: string;
  color?: string;
  size?: string;
  season?: string[];
  image_url?: string;
}): Promise<WardrobeItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('items')
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listMyItems(): Promise<WardrobeItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateItem(id: string, updates: Partial<WardrobeItem>): Promise<WardrobeItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteItem(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function getItem(id: string): Promise<WardrobeItem | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return data;
}

// ==================== SNEAKER DATABASE API ====================

// Add sneaker to collection
export async function addSneaker(input: {
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const sneakerData = {
    ...input,
    user_id: user.id,
    images: input.images || [],
    tags: input.tags || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('sneakers')
    .insert(sneakerData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get user's sneaker collection
export async function getMySneakers(filters?: SneakerFilter): Promise<Sneaker[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  let query = supabase
    .from('sneakers')
    .select('*')
    .eq('user_id', user.id);

  // Apply filters
  if (filters?.brands?.length) {
    query = query.in('brand', filters.brands);
  }
  if (filters?.categories?.length) {
    query = query.in('category', filters.categories);
  }
  if (filters?.conditions?.length) {
    query = query.in('condition', filters.conditions);
  }
  if (filters?.rarity?.length) {
    query = query.in('rarity', filters.rarity);
  }
  if (filters?.priceRange) {
    query = query.gte('current_price', filters.priceRange[0])
                 .lte('current_price', filters.priceRange[1]);
  }
  if (filters?.sizeRange) {
    query = query.gte('size', filters.sizeRange[0])
                 .lte('size', filters.sizeRange[1]);
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'created_at';
  const sortOrder = filters?.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
  query = query.order(sortBy, sortOrder);

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// Get single sneaker
export async function getSneaker(id: string): Promise<Sneaker | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('sneakers')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
}

// Update sneaker
export async function updateSneaker(id: string, updates: Partial<Sneaker>): Promise<Sneaker> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('sneakers')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete sneaker
export async function deleteSneaker(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('sneakers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// ==================== WISHLIST API ====================

// Add item to wishlist
export async function addToWishlist(input: {
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const wishlistData = {
    ...input,
    user_id: user.id,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('wishlist')
    .insert(wishlistData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get user's wishlist
export async function getMyWishlist(): Promise<WishlistItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('wishlist')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Remove from wishlist
export async function removeFromWishlist(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('wishlist')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// Update wishlist item
export async function updateWishlistItem(id: string, updates: Partial<WishlistItem>): Promise<WishlistItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('wishlist')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==================== PRICE TRACKING API ====================

// Add price history entry
export async function addPriceHistory(input: {
  sneakerId: string;
  price: number;
  size: number;
  platform: string;
}): Promise<PriceHistory> {
  const priceData = {
    ...input,
    date: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('price_history')
    .insert(priceData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get price history for a sneaker
export async function getPriceHistory(sneakerId: string, size?: number): Promise<PriceHistory[]> {
  let query = supabase
    .from('price_history')
    .select('*')
    .eq('sneaker_id', sneakerId)
    .order('date', { ascending: false });

  if (size) {
    query = query.eq('size', size);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// ==================== COLLECTION STATS API ====================

// Get user collection stats
export async function getCollectionStats(): Promise<{
  totalItems: number;
  totalValue: number;
  averageValue: number;
  topBrands: { brand: string; count: number }[];
  conditionBreakdown: { condition: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data: sneakers, error } = await supabase
    .from('sneakers')
    .select('brand, current_price, condition, category')
    .eq('user_id', user.id);

  if (error) throw error;

  const totalItems = sneakers?.length || 0;
  const totalValue = sneakers?.reduce((sum, sneaker) => sum + (sneaker.current_price || 0), 0) || 0;
  const averageValue = totalItems > 0 ? totalValue / totalItems : 0;

  // Calculate brand breakdown
  const brandCounts: { [key: string]: number } = {};
  const conditionCounts: { [key: string]: number } = {};
  const categoryCounts: { [key: string]: number } = {};

  sneakers?.forEach(sneaker => {
    brandCounts[sneaker.brand] = (brandCounts[sneaker.brand] || 0) + 1;
    conditionCounts[sneaker.condition] = (conditionCounts[sneaker.condition] || 0) + 1;
    categoryCounts[sneaker.category] = (categoryCounts[sneaker.category] || 0) + 1;
  });

  const topBrands = Object.entries(brandCounts)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const conditionBreakdown = Object.entries(conditionCounts)
    .map(([condition, count]) => ({ condition, count }));

  const categoryBreakdown = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }));

  return {
    totalItems,
    totalValue,
    averageValue,
    topBrands,
    conditionBreakdown,
    categoryBreakdown
  };
}

// Search sneakers (public database)
export async function searchSneakers(query: string, limit: number = 20): Promise<any[]> {
  const { data, error } = await supabase
    .from('sneaker_database')
    .select('*')
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%,colorway.ilike.%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Get trending sneakers
export async function getTrendingSneakers(limit: number = 10): Promise<any[]> {
  const { data, error } = await supabase
    .from('sneaker_database')
    .select('*')
    .order('popularity_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Get upcoming releases
export async function getUpcomingReleases(limit: number = 20): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('sneaker_releases')
    .select('*')
    .gte('release_date', today)
    .order('release_date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ==================== TEST CONNECTION ====================

// Test connection function
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('_test')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return { success: false, error: error.message };
    }

    console.log('Supabase connection successful');
    console.log('Test data:', data);
    
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Supabase connection failed:', message);
    return { success: false, error: message };
  }
}