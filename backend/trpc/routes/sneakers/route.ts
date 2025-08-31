import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { mockSneakers, searchMockSneakers } from '@/constants/mockSneakers';

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
    let sneakers = [...mockSneakers];

    // Apply filters
    if (input?.filters) {
      const { filters } = input;
      
      if (filters.brand && filters.brand.length > 0) {
        sneakers = sneakers.filter(sneaker => filters.brand!.includes(sneaker.brand));
      }
      
      if (filters.category && filters.category.length > 0) {
        sneakers = sneakers.filter(sneaker => filters.category!.includes(sneaker.category));
      }
      
      if (filters.condition && filters.condition.length > 0) {
        sneakers = sneakers.filter(sneaker => filters.condition!.includes(sneaker.condition));
      }
      
      if (filters.favorite !== undefined) {
        sneakers = sneakers.filter(sneaker => sneaker.favorite === filters.favorite);
      }
      
      if (filters.searchQuery) {
        sneakers = searchMockSneakers(filters.searchQuery);
      }
      
      if (filters.sizeRange) {
        sneakers = sneakers.filter(sneaker => 
          sneaker.size.us >= filters.sizeRange!.min && 
          sneaker.size.us <= filters.sizeRange!.max
        );
      }
      
      if (filters.priceRange) {
        sneakers = sneakers.filter(sneaker => 
          sneaker.purchasePrice && 
          sneaker.purchasePrice >= filters.priceRange!.min && 
          sneaker.purchasePrice <= filters.priceRange!.max
        );
      }
    }

    // Apply sorting
    if (input?.sortBy) {
      const ascending = input.sortOrder === 'asc';
      sneakers.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (input.sortBy) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'brand':
            aValue = a.brand;
            bValue = b.brand;
            break;
          case 'purchaseDate':
            aValue = new Date(a.purchaseDate || 0);
            bValue = new Date(b.purchaseDate || 0);
            break;
          case 'purchasePrice':
            aValue = a.purchasePrice || 0;
            bValue = b.purchasePrice || 0;
            break;
          case 'wearCount':
            aValue = a.wearCount;
            bValue = b.wearCount;
            break;
          case 'lastWorn':
            aValue = new Date(a.lastWorn || 0);
            bValue = new Date(b.lastWorn || 0);
            break;
          case 'condition':
            aValue = a.condition;
            bValue = b.condition;
            break;
          default:
            aValue = a.createdAt;
            bValue = b.createdAt;
        }
        
        if (aValue < bValue) return ascending ? -1 : 1;
        if (aValue > bValue) return ascending ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by creation date, newest first
      sneakers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Apply pagination
    if (input?.offset !== undefined || input?.limit !== undefined) {
      const offset = input.offset || 0;
      const limit = input.limit || 50;
      sneakers = sneakers.slice(offset, offset + limit);
    }

    return sneakers;
  });

// Get single sneaker by ID
export const getSneakerProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    const sneaker = mockSneakers.find(s => s.id === input.id);
    if (!sneaker) {
      throw new Error('Sneaker not found');
    }
    return sneaker;
  });

// Search sneakers
export const searchSneakersProcedure = publicProcedure
  .input(z.object({ query: z.string() }))
  .query(async ({ input }) => {
    return searchMockSneakers(input.query);
  });

// Get favorite sneakers
export const getFavoriteSneakersProcedure = publicProcedure
  .query(async () => {
    return mockSneakers.filter(sneaker => sneaker.favorite);
  });

// Get sneakers by brand
export const getSneakersByBrandProcedure = publicProcedure
  .input(z.object({ brand: z.string() }))
  .query(async ({ input }) => {
    return mockSneakers.filter(sneaker => sneaker.brand === input.brand);
  });

// Toggle favorite status
export const toggleSneakerFavoriteProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    const sneakerIndex = mockSneakers.findIndex(s => s.id === input.id);
    if (sneakerIndex === -1) {
      throw new Error('Sneaker not found');
    }
    
    mockSneakers[sneakerIndex].favorite = !mockSneakers[sneakerIndex].favorite;
    mockSneakers[sneakerIndex].updatedAt = new Date().toISOString();
    
    return mockSneakers[sneakerIndex];
  });

// Record wear
export const recordSneakerWearProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    const sneakerIndex = mockSneakers.findIndex(s => s.id === input.id);
    if (sneakerIndex === -1) {
      throw new Error('Sneaker not found');
    }
    
    mockSneakers[sneakerIndex].wearCount += 1;
    mockSneakers[sneakerIndex].lastWorn = new Date().toISOString();
    mockSneakers[sneakerIndex].updatedAt = new Date().toISOString();
    
    return mockSneakers[sneakerIndex];
  });

// Get sneaker statistics
export const getSneakerStatsProcedure = publicProcedure
  .query(async () => {
    const sneakers = mockSneakers;
    
    if (sneakers.length === 0) {
      return {
        totalSneakers: 0,
        totalValue: 0,
        averagePrice: 0,
        brandDistribution: {},
        categoryDistribution: {},
        conditionDistribution: {},
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
    }, {} as Record<string, number>);

    const categoryDistribution = sneakers.reduce((acc, sneaker) => {
      acc[sneaker.category] = (acc[sneaker.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const conditionDistribution = sneakers.reduce((acc, sneaker) => {
      acc[sneaker.condition] = (acc[sneaker.condition] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
  });