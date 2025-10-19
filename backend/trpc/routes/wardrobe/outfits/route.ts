import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { Inserts } from '@/lib/supabase';

// Mock data store for demo purposes
const mockOutfits: any[] = [
  {
    id: '1',
    name: 'Casual Friday',
    description: 'Comfortable outfit for casual Friday at work',
    occasion: 'work',
    season: ['spring', 'fall'],
    item_ids: ['1', '2', '4'],
    image_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=2070&auto=format&fit=crop',
    tags: ['casual', 'work'],
    notes: 'Perfect for relaxed work days',
    is_favorite: false,
    wear_count: 5,
    last_worn: '2023-06-15',
    user_id: 'demo-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Night Out',
    description: 'Stylish outfit for evening events',
    occasion: 'evening',
    season: ['fall', 'winter'],
    item_ids: ['3', '2', '5', '6'],
    image_url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1974&auto=format&fit=crop',
    tags: ['evening', 'stylish'],
    notes: 'Great for dinner dates',
    is_favorite: true,
    wear_count: 3,
    last_worn: '2023-06-10',
    user_id: 'demo-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const OutfitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  occasion: z.string().optional(),
  season: z.array(z.string()).optional(),
  item_ids: z.array(z.string()),
  image_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  is_favorite: z.boolean().default(false),
});

const UpdateOutfitSchema = OutfitSchema.partial().extend({
  id: z.string(),
});

export const addOutfitProcedure = protectedProcedure
  .input(OutfitSchema)
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.userId;

    if (!ctx.supabase) {
      // Fallback to mock data if no database connection
      const newOutfit = {
        id: `outfit-${Date.now()}`,
        ...input,
        user_id: userId,
        wear_count: 0,
        last_worn: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockOutfits.push(newOutfit);
      return newOutfit;
    }

    const outfitData: Inserts<'outfits'> = {
      user_id: userId,
      name: input.name,
      description: input.description || null,
      items: input.item_ids,
      occasion: input.occasion || null,
      season: input.season || null,
      image_url: input.image_url || null,
      is_favorite: input.is_favorite || false,
      wear_count: 0,
    };

    const { data, error } = await ctx.supabase
      .from('outfits')
      .insert(outfitData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to add outfit: ${error.message}`);
    }

    return data;
  });

export const listMyOutfitsProcedure = protectedProcedure
  .input(z.object({
    occasion: z.string().optional(),
    season: z.string().optional(),
    search: z.string().optional(),
    is_favorite: z.boolean().optional(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
  }).optional())
  .query(async ({ input = {}, ctx }) => {
    const userId = ctx.userId;

    if (!ctx.supabase) {
      // Fallback to mock data if no database connection
      let filteredOutfits = mockOutfits.filter((outfit: any) => outfit.user_id === userId);

      // Apply filters
      if (input.occasion) {
        filteredOutfits = filteredOutfits.filter((outfit: any) => outfit.occasion === input.occasion);
      }
      if (input.is_favorite !== undefined) {
        filteredOutfits = filteredOutfits.filter((outfit: any) => outfit.is_favorite === input.is_favorite);
      }
      if (input.season) {
        filteredOutfits = filteredOutfits.filter((outfit: any) => 
          outfit.season?.includes(input.season)
        );
      }
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filteredOutfits = filteredOutfits.filter((outfit: any) => 
          outfit.name?.toLowerCase().includes(searchLower) ||
          outfit.description?.toLowerCase().includes(searchLower) ||
          outfit.notes?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by created_at descending
      filteredOutfits.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Apply pagination
      const start = input.offset || 0;
      const end = start + (input.limit || 50);
      
      return filteredOutfits.slice(start, end);
    }

    let query = ctx.supabase
      .from('outfits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(input.offset || 0, (input.offset || 0) + (input.limit || 50) - 1);

    // Apply filters
    if (input.occasion) {
      query = query.eq('occasion', input.occasion);
    }
    if (input.is_favorite !== undefined) {
      query = query.eq('is_favorite', input.is_favorite);
    }
    if (input.season) {
      query = query.contains('season', [input.season]);
    }
    if (input.search) {
      query = query.or(`name.ilike.%${input.search}%,description.ilike.%${input.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to list outfits: ${error.message}`);
    }

    return data || [];
  });

export const getOutfitProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input, ctx }: { input: any; ctx: any }) => {
    const userId = 'demo-user'; // For demo purposes

    const outfit = mockOutfits.find(outfit => outfit.id === input.id && outfit.user_id === userId);
    
    if (!outfit) {
      throw new Error('Outfit not found');
    }
    
    return outfit;
  });

export const updateOutfitProcedure = protectedProcedure
  .input(UpdateOutfitSchema)
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const userId = 'demo-user'; // For demo purposes
    const { id, ...updateData } = input;

    const outfitIndex = mockOutfits.findIndex(outfit => outfit.id === id && outfit.user_id === userId);
    
    if (outfitIndex === -1) {
      throw new Error('Outfit not found');
    }

    mockOutfits[outfitIndex] = {
      ...mockOutfits[outfitIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    };

    return mockOutfits[outfitIndex];
  });

export const deleteOutfitProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const userId = 'demo-user'; // For demo purposes

    const outfitIndex = mockOutfits.findIndex(outfit => outfit.id === input.id && outfit.user_id === userId);
    
    if (outfitIndex === -1) {
      throw new Error('Outfit not found');
    }

    const deletedOutfit = mockOutfits.splice(outfitIndex, 1)[0];
    return { success: true, deletedOutfit };
  });

export const toggleOutfitFavoriteProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const userId = 'demo-user'; // For demo purposes

    const outfitIndex = mockOutfits.findIndex(outfit => outfit.id === input.id && outfit.user_id === userId);
    
    if (outfitIndex === -1) {
      throw new Error('Outfit not found');
    }

    mockOutfits[outfitIndex].is_favorite = !mockOutfits[outfitIndex].is_favorite;
    mockOutfits[outfitIndex].updated_at = new Date().toISOString();

    return mockOutfits[outfitIndex];
  });

export const recordOutfitWearProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
    date: z.string().optional(),
    notes: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const userId = 'demo-user'; // For demo purposes
    const wearDate = input.date || new Date().toISOString();

    const outfitIndex = mockOutfits.findIndex(outfit => outfit.id === input.id && outfit.user_id === userId);
    
    if (outfitIndex === -1) {
      throw new Error('Outfit not found');
    }

    mockOutfits[outfitIndex].wear_count = (mockOutfits[outfitIndex].wear_count || 0) + 1;
    mockOutfits[outfitIndex].last_worn = wearDate;
    mockOutfits[outfitIndex].updated_at = new Date().toISOString();

    return mockOutfits[outfitIndex];
  });

export const getOutfitStatsProcedure = protectedProcedure
  .query(async ({ ctx }: { ctx: any }) => {
    const userId = 'demo-user'; // For demo purposes

    const userOutfits = mockOutfits.filter((outfit: any) => outfit.user_id === userId);

    const totalOutfits = userOutfits.length;
    const favoriteOutfits = userOutfits.filter(outfit => outfit.is_favorite).length;

    const occasions = userOutfits.reduce((acc: Record<string, number>, outfit: any) => {
      if (outfit.occasion) {
        acc[outfit.occasion] = (acc[outfit.occasion] || 0) + 1;
      }
      return acc;
    }, {});

    const mostWornOutfits = userOutfits
      .filter(outfit => outfit.wear_count > 0)
      .sort((a, b) => (b.wear_count || 0) - (a.wear_count || 0))
      .slice(0, 5)
      .map(outfit => ({
        id: outfit.id,
        name: outfit.name,
        wear_count: outfit.wear_count,
        last_worn: outfit.last_worn
      }));

    const result = {
      totalOutfits,
      favoriteOutfits,
      occasionsCount: Object.keys(occasions).length,
      topOccasions: Object.entries(occasions)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([occasion, count]) => ({ occasion, count: Number(count) })),
      mostWornOutfits: mostWornOutfits.map(outfit => ({
        id: outfit.id,
        name: outfit.name,
        wear_count: Number(outfit.wear_count),
        last_worn: outfit.last_worn || null
      })),
    };
    
    console.log('Outfit stats result:', JSON.stringify(result, null, 2));
    return result;
  });

export const getOutfitRecommendationsProcedure = protectedProcedure
  .input(z.object({
    occasion: z.string().optional(),
    season: z.string().optional(),
    weather: z.object({
      temperature: z.number(),
      condition: z.string(),
      precipitation: z.number().optional(),
    }).optional(),
    limit: z.number().min(1).max(20).default(5),
  }).optional())
  .query(async ({ input = {}, ctx }: { input?: any; ctx: any }) => {
    const userId = 'demo-user'; // For demo purposes

    let filteredOutfits = mockOutfits.filter((outfit: any) => outfit.user_id === userId);

    // Apply filters
    if (input.occasion) {
      filteredOutfits = filteredOutfits.filter((outfit: any) => outfit.occasion === input.occasion);
    }
    if (input.season) {
      filteredOutfits = filteredOutfits.filter((outfit: any) => 
        outfit.season?.includes(input.season)
      );
    }

    // Sort by wear count (ascending) to recommend less worn outfits
    filteredOutfits.sort((a: any, b: any) => (a.wear_count || 0) - (b.wear_count || 0));

    return filteredOutfits.slice(0, input.limit);
  });