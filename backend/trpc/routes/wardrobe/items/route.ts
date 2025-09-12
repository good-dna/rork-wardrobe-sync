import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { mockItems } from '@/constants/mockData';
import { Inserts } from '@/lib/supabase';

// Convert frontend mock data to backend format for fallback
const backendMockItems = mockItems.map(item => ({
  id: item.id,
  name: item.name,
  brand: item.brand,
  category: item.category,
  color: item.color,
  size: 'M', // Default size since not in frontend data
  season: item.season,
  price: item.purchasePrice,
  image_url: item.imageUrl,
  purchase_date: item.purchaseDate,
  tags: item.tags,
  notes: item.notes,
  user_id: 'demo-user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}));

const ItemSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  season: z.array(z.string()).optional(),
  image_url: z.string().url().optional(),
  price: z.number().optional(),
  purchase_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const UpdateItemSchema = ItemSchema.partial().extend({
  id: z.string(),
});

export const addItemProcedure = protectedProcedure
  .input(ItemSchema)
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.userId;

    if (!ctx.supabase) {
      // Fallback to mock data if no database connection
      const newItem = {
        id: `item-${Date.now()}`,
        ...input,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      backendMockItems.push(newItem as any);
      return newItem;
    }

    const itemData: Inserts<'wardrobe_items'> = {
      user_id: userId,
      name: input.name,
      brand: input.brand || null,
      category: input.category || 'clothes',
      color: input.color || null,
      size: input.size || null,
      season: input.season || null,
      image_url: input.image_url || null,
      price: input.price || null,
      purchase_date: input.purchase_date || null,
      tags: input.tags || null,
      notes: input.notes || null,
      source: 'manual',
    };

    const { data, error } = await ctx.supabase
      .from('wardrobe_items')
      .insert(itemData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to add item: ${error.message}`);
    }

    return data;
  });

export const listMyItemsProcedure = protectedProcedure
  .input(z.object({
    category: z.string().optional(),
    season: z.string().optional(),
    color: z.string().optional(),
    brand: z.string().optional(),
    search: z.string().optional(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
  }).optional())
  .query(async ({ input = {}, ctx }) => {
    const userId = ctx.userId;

    if (!ctx.supabase) {
      // Fallback to mock data if no database connection
      let filteredItems = backendMockItems.filter(item => item.user_id === userId);

      // Apply filters
      if (input.category) {
        filteredItems = filteredItems.filter(item => item.category === input.category);
      }
      if (input.color) {
        filteredItems = filteredItems.filter(item => item.color === input.color);
      }
      if (input.brand) {
        filteredItems = filteredItems.filter(item => 
          item.brand?.toLowerCase().includes(input.brand!.toLowerCase())
        );
      }
      if (input.season) {
        filteredItems = filteredItems.filter(item => 
          item.season?.includes(input.season! as any)
        );
      }
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filteredItems = filteredItems.filter(item => 
          item.name?.toLowerCase().includes(searchLower) ||
          item.brand?.toLowerCase().includes(searchLower) ||
          item.notes?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by created_at descending
      filteredItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Apply pagination
      const start = input.offset || 0;
      const end = start + (input.limit || 50);
      
      return filteredItems.slice(start, end);
    }

    let query = ctx.supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(input.offset || 0, (input.offset || 0) + (input.limit || 50) - 1);

    // Apply filters
    if (input.category) {
      query = query.eq('category', input.category);
    }
    if (input.color) {
      query = query.eq('color', input.color);
    }
    if (input.brand) {
      query = query.ilike('brand', `%${input.brand}%`);
    }
    if (input.season) {
      query = query.contains('season', [input.season]);
    }
    if (input.search) {
      query = query.or(`name.ilike.%${input.search}%,brand.ilike.%${input.search}%,notes.ilike.%${input.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to list items: ${error.message}`);
    }

    return data || [];
  });

export const getItemProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input, ctx }: { input: any; ctx: any }) => {
    const userId = 'demo-user'; // For demo purposes

    const item = backendMockItems.find(item => item.id === input.id && item.user_id === userId);
    
    if (!item) {
      throw new Error('Item not found');
    }
    
    return item;
  });

export const updateItemProcedure = protectedProcedure
  .input(UpdateItemSchema)
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const userId = 'demo-user'; // For demo purposes
    const { id, ...updateData } = input;

    const itemIndex = backendMockItems.findIndex(item => item.id === id && item.user_id === userId);
    
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }

    backendMockItems[itemIndex] = {
      ...backendMockItems[itemIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    };

    return backendMockItems[itemIndex];
  });

export const deleteItemProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const userId = 'demo-user'; // For demo purposes

    const itemIndex = backendMockItems.findIndex(item => item.id === input.id && item.user_id === userId);
    
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }

    const deletedItem = backendMockItems.splice(itemIndex, 1)[0];
    return { success: true, deletedItem };
  });

export const getItemStatsProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.userId;

    if (!ctx.supabase) {
      // Fallback to mock data if no database connection
      const userItems = backendMockItems.filter(item => item.user_id === userId);

      const categories = userItems.reduce((acc: Record<string, number>, item: any) => {
        if (item.category) {
          acc[item.category] = (acc[item.category] || 0) + 1;
        }
        return acc;
      }, {});

      const brands = userItems.reduce((acc: Record<string, number>, item: any) => {
        if (item.brand) {
          acc[item.brand] = (acc[item.brand] || 0) + 1;
        }
        return acc;
      }, {});

      const result = {
        totalItems: userItems.length,
        categoriesCount: Object.keys(categories).length,
        brandsCount: Object.keys(brands).length,
        topCategories: Object.entries(categories)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([category, count]) => ({ category, count })),
        topBrands: Object.entries(brands)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([brand, count]) => ({ brand, count })),
      };
      
      console.log('Item stats result:', JSON.stringify(result, null, 2));
      return result;
    }

    const { data: items, error } = await ctx.supabase
      .from('wardrobe_items')
      .select('category, brand')
      .eq('user_id', userId);

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to get item stats: ${error.message}`);
    }

    const categories = (items || []).reduce((acc: Record<string, number>, item) => {
      if (item.category) {
        acc[item.category] = (acc[item.category] || 0) + 1;
      }
      return acc;
    }, {});

    const brands = (items || []).reduce((acc: Record<string, number>, item) => {
      if (item.brand) {
        acc[item.brand] = (acc[item.brand] || 0) + 1;
      }
      return acc;
    }, {});

    const result = {
      totalItems: items?.length || 0,
      categoriesCount: Object.keys(categories).length,
      brandsCount: Object.keys(brands).length,
      topCategories: Object.entries(categories)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([category, count]) => ({ category, count })),
      topBrands: Object.entries(brands)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([brand, count]) => ({ brand, count })),
    };
    
    console.log('Item stats result:', JSON.stringify(result, null, 2));
    return result;
  });