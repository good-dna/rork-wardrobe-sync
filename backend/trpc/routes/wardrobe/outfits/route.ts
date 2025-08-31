import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { supabase } from '../../../../../lib/supabase';

const OutfitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  occasion: z.string().optional(),
  season: z.array(z.string()).optional(),
  item_ids: z.array(z.string().uuid()),
  image_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  is_favorite: z.boolean().default(false),
});

const UpdateOutfitSchema = OutfitSchema.partial().extend({
  id: z.string().uuid(),
});

export const addOutfitProcedure = protectedProcedure
  .input(OutfitSchema)
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify all items belong to the user
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id')
      .eq('user_id', user.id)
      .in('id', input.item_ids);

    if (itemsError) throw new Error(`Failed to verify items: ${itemsError.message}`);
    if (items.length !== input.item_ids.length) {
      throw new Error('Some items do not exist or do not belong to you');
    }

    const { data, error } = await supabase
      .from('outfits')
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (error) throw new Error(`Failed to add outfit: ${error.message}`);
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
  .query(async ({ input = {}, ctx }: { input?: any; ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('outfits')
      .select(`
        *,
        items:item_ids (
          id,
          name,
          brand,
          category,
          color,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

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
      query = query.or(`name.ilike.%${input.search}%,description.ilike.%${input.search}%,notes.ilike.%${input.search}%`);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch outfits: ${error.message}`);
    return data || [];
  });

export const getOutfitProcedure = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ input, ctx }: { input: any; ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('outfits')
      .select(`
        *,
        items:item_ids (
          id,
          name,
          brand,
          category,
          color,
          size,
          image_url,
          notes
        )
      `)
      .eq('id', input.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Outfit not found');
      }
      throw new Error(`Failed to fetch outfit: ${error.message}`);
    }
    return data;
  });

export const updateOutfitProcedure = protectedProcedure
  .input(UpdateOutfitSchema)
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { id, ...updateData } = input;

    // If updating item_ids, verify all items belong to the user
    if (updateData.item_ids) {
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id')
        .eq('user_id', user.id)
        .in('id', updateData.item_ids);

      if (itemsError) throw new Error(`Failed to verify items: ${itemsError.message}`);
      if (items.length !== updateData.item_ids.length) {
        throw new Error('Some items do not exist or do not belong to you');
      }
    }

    const { data, error } = await supabase
      .from('outfits')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Outfit not found');
      }
      throw new Error(`Failed to update outfit: ${error.message}`);
    }
    return data;
  });

export const deleteOutfitProcedure = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('outfits')
      .delete()
      .eq('id', input.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Outfit not found');
      }
      throw new Error(`Failed to delete outfit: ${error.message}`);
    }
    return { success: true, deletedOutfit: data };
  });

export const toggleOutfitFavoriteProcedure = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First get current favorite status
    const { data: currentOutfit, error: getError } = await supabase
      .from('outfits')
      .select('is_favorite')
      .eq('id', input.id)
      .eq('user_id', user.id)
      .single();

    if (getError) {
      if (getError.code === 'PGRST116') {
        throw new Error('Outfit not found');
      }
      throw new Error(`Failed to get outfit: ${getError.message}`);
    }

    // Toggle favorite status
    const { data, error } = await supabase
      .from('outfits')
      .update({ is_favorite: !currentOutfit.is_favorite })
      .eq('id', input.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to toggle favorite: ${error.message}`);
    return data;
  });

export const recordOutfitWearProcedure = protectedProcedure
  .input(z.object({
    id: z.string().uuid(),
    date: z.string().optional(),
    notes: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const wearDate = input.date || new Date().toISOString();

    // First verify outfit exists and belongs to user
    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .select('id, wear_count, last_worn, item_ids')
      .eq('id', input.id)
      .eq('user_id', user.id)
      .single();

    if (outfitError) {
      if (outfitError.code === 'PGRST116') {
        throw new Error('Outfit not found');
      }
      throw new Error(`Failed to get outfit: ${outfitError.message}`);
    }

    // Update outfit wear count and last worn date
    const { data: updatedOutfit, error: updateError } = await supabase
      .from('outfits')
      .update({
        wear_count: (outfit.wear_count || 0) + 1,
        last_worn: wearDate,
      })
      .eq('id', input.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw new Error(`Failed to update outfit: ${updateError.message}`);

    // Also update wear count for all items in the outfit
    if (outfit.item_ids && outfit.item_ids.length > 0) {
      // Get current wear counts for all items
      const { data: currentItems, error: getCurrentError } = await supabase
        .from('items')
        .select('id, wear_count')
        .in('id', outfit.item_ids)
        .eq('user_id', user.id);

      if (!getCurrentError && currentItems) {
        // Update each item individually
        for (const item of currentItems) {
          await supabase
            .from('items')
            .update({
              wear_count: (item.wear_count || 0) + 1,
              last_worn: wearDate,
            })
            .eq('id', item.id)
            .eq('user_id', user.id);
        }
      }
    }

    // Record wear history
    const { error: historyError } = await supabase
      .from('outfit_wear_history')
      .insert({
        outfit_id: input.id,
        user_id: user.id,
        worn_date: wearDate,
        notes: input.notes,
      });

    if (historyError) {
      console.warn('Failed to record wear history:', historyError.message);
    }

    return updatedOutfit;
  });

export const getOutfitStatsProcedure = protectedProcedure
  .query(async ({ ctx }: { ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: totalOutfits, error: totalError } = await supabase
      .from('outfits')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    if (totalError) throw new Error(`Failed to get total outfits: ${totalError.message}`);

    const { data: favoriteOutfits, error: favoriteError } = await supabase
      .from('outfits')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_favorite', true);

    if (favoriteError) throw new Error(`Failed to get favorite outfits: ${favoriteError.message}`);

    const { data: occasionStats, error: occasionError } = await supabase
      .from('outfits')
      .select('occasion')
      .eq('user_id', user.id)
      .not('occasion', 'is', null);

    if (occasionError) throw new Error(`Failed to get occasion stats: ${occasionError.message}`);

    const { data: mostWornOutfits, error: mostWornError } = await supabase
      .from('outfits')
      .select('id, name, wear_count, last_worn')
      .eq('user_id', user.id)
      .not('wear_count', 'is', null)
      .order('wear_count', { ascending: false })
      .limit(5);

    if (mostWornError) throw new Error(`Failed to get most worn outfits: ${mostWornError.message}`);

    const occasions = occasionStats?.reduce((acc: Record<string, number>, outfit: any) => {
      if (outfit.occasion) {
        acc[outfit.occasion] = (acc[outfit.occasion] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    return {
      totalOutfits: totalOutfits?.length || 0,
      favoriteOutfits: favoriteOutfits?.length || 0,
      occasionsCount: Object.keys(occasions).length,
      topOccasions: Object.entries(occasions)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([occasion, count]) => ({ occasion, count })),
      mostWornOutfits: mostWornOutfits || [],
    };
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('outfits')
      .select(`
        *,
        items:item_ids (
          id,
          name,
          brand,
          category,
          color,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('wear_count', { ascending: true, nullsFirst: true })
      .limit(input.limit);

    if (input.occasion) {
      query = query.eq('occasion', input.occasion);
    }
    if (input.season) {
      query = query.contains('season', [input.season]);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get outfit recommendations: ${error.message}`);
    return data || [];
  });