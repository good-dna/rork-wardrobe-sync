import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import {
  getSneakers,
  getSneaker,
  addSneaker,
  updateSneaker,
  deleteSneaker,
  recordSneakerWear,
  toggleSneakerFavorite,
  getSneakerStats,
  searchSneakers,
  searchExternalSneakers,
  getSneakersByBrand,
  getFavoriteSneakers
} from '@/services/sneakerApi';

// Input validation schemas
const SneakerFiltersSchema = z.object({
  brand: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  condition: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
  searchQuery: z.string().optional(),
  sizeRange: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  priceRange: z.object({
    min: z.number(),
    max: z.number()
  }).optional()
});

const SneakerQuerySchema = z.object({
  filters: SneakerFiltersSchema.optional(),
  sortBy: z.enum(['name', 'brand', 'purchaseDate', 'purchasePrice', 'wearCount', 'lastWorn', 'condition']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
});

// Get all sneakers with filtering and sorting
export const getSneakersProcedure = publicProcedure
  .input(SneakerQuerySchema.optional())
  .query(async ({ input }) => {
    return await getSneakers(input as any);
  });

// Get single sneaker by ID
export const getSneakerProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    const sneaker = await getSneaker(input.id);
    if (!sneaker) {
      throw new Error('Sneaker not found');
    }
    return sneaker;
  });

// Search sneakers
export const searchSneakersProcedure = publicProcedure
  .input(z.object({ query: z.string() }))
  .query(async ({ input }) => {
    return await searchSneakers(input.query);
  });

// Get favorite sneakers
export const getFavoriteSneakersProcedure = publicProcedure
  .query(async () => {
    return await getFavoriteSneakers();
  });

// Get sneakers by brand
export const getSneakersByBrandProcedure = publicProcedure
  .input(z.object({ brand: z.string() }))
  .query(async ({ input }) => {
    return await getSneakersByBrand(input.brand as any);
  });

// Toggle favorite status
export const toggleSneakerFavoriteProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    return await toggleSneakerFavorite(input.id);
  });

// Record wear
export const recordSneakerWearProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    return await recordSneakerWear(input.id);
  });

// Get sneaker statistics
export const getSneakerStatsProcedure = publicProcedure
  .query(async () => {
    return await getSneakerStats();
  });

// Add sneaker
export const addSneakerProcedure = publicProcedure
  .input(z.object({
    name: z.string(),
    brand: z.string(),
    model: z.string(),
    category: z.string(),
    size: z.object({
      us: z.number(),
      uk: z.number().optional(),
      eu: z.number().optional(),
      cm: z.number().optional(),
    }),
    condition: z.string(),
    purchaseDate: z.string().optional(),
    purchasePrice: z.number().optional(),
    purchaseLocation: z.string().optional(),
    imageUrls: z.array(z.string()),
    details: z.object({
      sku: z.string().optional(),
      styleCode: z.string().optional(),
      releaseDate: z.string().optional(),
      retailPrice: z.number().optional(),
      currentMarketPrice: z.number().optional(),
      materials: z.array(z.string()),
      colorway: z.object({
        primary: z.string(),
        secondary: z.string().optional(),
        accent: z.string().optional(),
        nickname: z.string().optional(),
      }),
      limited: z.boolean().optional(),
      collaboration: z.string().optional(),
      designer: z.string().optional(),
      technology: z.array(z.string()).optional(),
    }),
    wearCount: z.number().default(0),
    lastWorn: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()),
    favorite: z.boolean().default(false),
  }))
  .mutation(async ({ input }) => {
    return await addSneaker(input as any);
  });

// Update sneaker
export const updateSneakerProcedure = publicProcedure
  .input(z.object({
    id: z.string(),
    updates: z.object({
      name: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      category: z.string().optional(),
      condition: z.string().optional(),
      purchaseDate: z.string().optional(),
      purchasePrice: z.number().optional(),
      purchaseLocation: z.string().optional(),
      imageUrls: z.array(z.string()).optional(),
      wearCount: z.number().optional(),
      lastWorn: z.string().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
      favorite: z.boolean().optional(),
    })
  }))
  .mutation(async ({ input }) => {
    return await updateSneaker(input.id, input.updates as any);
  });

// Delete sneaker
export const deleteSneakerProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    await deleteSneaker(input.id);
    return { success: true };
  });

// Search external sneaker database
export const searchExternalSneakersProcedure = publicProcedure
  .input(z.object({ 
    query: z.string().min(1).max(100),
    brand: z.string().optional()
  }))
  .query(async ({ input }) => {
    return await searchExternalSneakers(input.query, input.brand);
  });