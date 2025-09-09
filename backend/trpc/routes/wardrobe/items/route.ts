import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { mockItems } from '../../../../../constants/mockData';
import { Item } from '../../../../../types/wardrobe';

// Convert frontend mock data to backend format
let backendMockItems = mockItems.map(item => ({
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
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const userId = 'demo-user'; // For demo purposes

    const newItem = {
      id: `item-${Date.now()}`,
      ...input,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    backendMockItems.push(newItem);
    return newItem;
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
  .query(async ({ input = {}, ctx }: { input?: any; ctx: any }) => {
    const userId = 'demo-user'; // For demo purposes

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
        item.brand?.toLowerCase().includes(input.brand.toLowerCase())
      );
    }
    if (input.season) {
      filteredItems = filteredItems.filter(item => 
        item.season?.includes(input.season)
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
  .query(async ({ ctx }: { ctx: any }) => {
    const userId = 'demo-user'; // For demo purposes

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
    
    console.log('Item stats result:', result);
    return result;
  });