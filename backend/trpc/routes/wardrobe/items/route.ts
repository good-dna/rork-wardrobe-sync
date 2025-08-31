import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { supabase } from '../../../../../lib/supabase';

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
  id: z.string().uuid(),
});

export const addItemProcedure = protectedProcedure
  .input(ItemSchema)
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('items')
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (error) throw new Error(`Failed to add item: ${error.message}`);
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
  .query(async ({ input = {}, ctx }: { input?: any; ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

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

    if (error) throw new Error(`Failed to fetch items: ${error.message}`);
    return data || [];
  });

export const getItemProcedure = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ input, ctx }: { input: any; ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', input.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Item not found');
      }
      throw new Error(`Failed to fetch item: ${error.message}`);
    }
    return data;
  });

export const updateItemProcedure = protectedProcedure
  .input(UpdateItemSchema)
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { id, ...updateData } = input;

    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Item not found');
      }
      throw new Error(`Failed to update item: ${error.message}`);
    }
    return data;
  });

export const deleteItemProcedure = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('items')
      .delete()
      .eq('id', input.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Item not found');
      }
      throw new Error(`Failed to delete item: ${error.message}`);
    }
    return { success: true, deletedItem: data };
  });

export const getItemStatsProcedure = protectedProcedure
  .query(async ({ ctx }: { ctx: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: totalItems, error: totalError } = await supabase
      .from('items')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    if (totalError) throw new Error(`Failed to get total items: ${totalError.message}`);

    const { data: categoryStats, error: categoryError } = await supabase
      .from('items')
      .select('category')
      .eq('user_id', user.id);

    if (categoryError) throw new Error(`Failed to get category stats: ${categoryError.message}`);

    const { data: brandStats, error: brandError } = await supabase
      .from('items')
      .select('brand')
      .eq('user_id', user.id)
      .not('brand', 'is', null);

    if (brandError) throw new Error(`Failed to get brand stats: ${brandError.message}`);

    const categories = categoryStats?.reduce((acc: Record<string, number>, item: any) => {
      if (item.category) {
        acc[item.category] = (acc[item.category] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    const brands = brandStats?.reduce((acc: Record<string, number>, item: any) => {
      if (item.brand) {
        acc[item.brand] = (acc[item.brand] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    return {
      totalItems: totalItems?.length || 0,
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
  });