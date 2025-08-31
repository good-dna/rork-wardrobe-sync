import { z } from 'zod';
import { protectedProcedure, publicProcedure } from '../../create-context';
import {
  addSneaker,
  getMySneakers,
  getSneaker,
  updateSneaker,
  deleteSneaker,
  addToWishlist,
  getMyWishlist,
  removeFromWishlist,
  updateWishlistItem,
  getCollectionStats,
  searchSneakers,
  getTrendingSneakers,
  getUpcomingReleases,
  addPriceHistory,
  getPriceHistory
} from '../../../services/supabaseApi';

// Sneaker input schema
const sneakerInputSchema = z.object({
  name: z.string(),
  brand: z.string(),
  model: z.string(),
  colorway: z.string(),
  releaseDate: z.string().optional(),
  retailPrice: z.number().optional(),
  currentPrice: z.number().optional(),
  size: z.number(),
  condition: z.enum(['deadstock', 'vnds', 'used', 'beater']),
  images: z.array(z.string()).optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.enum(['basketball', 'running', 'lifestyle', 'skateboarding', 'football', 'other']),
  rarity: z.enum(['common', 'uncommon', 'rare', 'grail'])
});

// Filter schema
const filterSchema = z.object({
  brands: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  priceRange: z.tuple([z.number(), z.number()]).optional(),
  sizeRange: z.tuple([z.number(), z.number()]).optional(),
  rarity: z.array(z.string()).optional(),
  sortBy: z.enum(['name', 'brand', 'price', 'releaseDate', 'purchaseDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Wishlist input schema
const wishlistInputSchema = z.object({
  sneakerId: z.string().optional(),
  name: z.string(),
  brand: z.string(),
  model: z.string(),
  colorway: z.string(),
  size: z.number(),
  maxPrice: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  notes: z.string().optional()
});

// Price history input schema
const priceHistoryInputSchema = z.object({
  sneakerId: z.string(),
  price: z.number(),
  size: z.number(),
  platform: z.string()
});

// ==================== COLLECTION PROCEDURES ====================

export const addSneakerProcedure = protectedProcedure
  .input(sneakerInputSchema)
  .mutation(async ({ input }) => {
    return await addSneaker(input);
  });

export const getMySneakersProcedure = protectedProcedure
  .input(filterSchema.optional())
  .query(async ({ input }) => {
    return await getMySneakers(input);
  });

export const getSneakerProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    return await getSneaker(input.id);
  });

export const updateSneakerProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
    updates: sneakerInputSchema.partial()
  }))
  .mutation(async ({ input }) => {
    return await updateSneaker(input.id, input.updates);
  });

export const deleteSneakerProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    return await deleteSneaker(input.id);
  });

// ==================== WISHLIST PROCEDURES ====================

export const addToWishlistProcedure = protectedProcedure
  .input(wishlistInputSchema)
  .mutation(async ({ input }) => {
    return await addToWishlist(input);
  });

export const getMyWishlistProcedure = protectedProcedure
  .query(async () => {
    return await getMyWishlist();
  });

export const removeFromWishlistProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    return await removeFromWishlist(input.id);
  });

export const updateWishlistItemProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
    updates: wishlistInputSchema.partial()
  }))
  .mutation(async ({ input }) => {
    return await updateWishlistItem(input.id, input.updates);
  });

// ==================== STATS PROCEDURES ====================

export const getCollectionStatsProcedure = protectedProcedure
  .query(async () => {
    return await getCollectionStats();
  });

// ==================== PUBLIC PROCEDURES ====================

export const searchSneakersProcedure = publicProcedure
  .input(z.object({
    query: z.string(),
    limit: z.number().default(20)
  }))
  .query(async ({ input }) => {
    return await searchSneakers(input.query, input.limit);
  });

export const getTrendingSneakersProcedure = publicProcedure
  .input(z.object({
    limit: z.number().default(10)
  }))
  .query(async ({ input }) => {
    return await getTrendingSneakers(input.limit);
  });

export const getUpcomingReleasesProcedure = publicProcedure
  .input(z.object({
    limit: z.number().default(20)
  }))
  .query(async ({ input }) => {
    return await getUpcomingReleases(input.limit);
  });

// ==================== PRICE TRACKING PROCEDURES ====================

export const addPriceHistoryProcedure = protectedProcedure
  .input(priceHistoryInputSchema)
  .mutation(async ({ input }) => {
    return await addPriceHistory(input);
  });

export const getPriceHistoryProcedure = protectedProcedure
  .input(z.object({
    sneakerId: z.string(),
    size: z.number().optional()
  }))
  .query(async ({ input }) => {
    return await getPriceHistory(input.sneakerId, input.size);
  });