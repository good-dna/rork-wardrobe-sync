import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '../../create-context';

// Brand types
export interface Brand {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  category: string[];
  priceRange: 'budget' | 'mid' | 'luxury' | 'ultra-luxury';
  country?: string;
  foundedYear?: number;
  isActive: boolean;
  itemCount: number;
  averagePrice?: number;
  popularCategories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BrandStats {
  totalBrands: number;
  totalItems: number;
  averageItemsPerBrand: number;
  topBrandsByItems: Array<{
    brand: string;
    itemCount: number;
    totalValue: number;
  }>;
  priceRangeDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
}

// Mock data for brands
const mockBrands: Brand[] = [
  {
    id: '1',
    name: 'Nike',
    description: 'Just Do It - Leading athletic wear and footwear brand',
    logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
    website: 'https://nike.com',
    category: ['shoes', 'athletic', 'accessories'],
    priceRange: 'mid',
    country: 'USA',
    foundedYear: 1964,
    isActive: true,
    itemCount: 15,
    averagePrice: 120,
    popularCategories: ['shoes', 'shirts'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Adidas',
    description: 'Impossible is Nothing - German multinational corporation',
    logoUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=100&h=100&fit=crop',
    website: 'https://adidas.com',
    category: ['shoes', 'athletic', 'accessories'],
    priceRange: 'mid',
    country: 'Germany',
    foundedYear: 1949,
    isActive: true,
    itemCount: 12,
    averagePrice: 110,
    popularCategories: ['shoes', 'pants'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Gucci',
    description: 'Italian luxury fashion house',
    logoUrl: 'https://images.unsplash.com/photo-1591348122651-3895e6950d2d?w=100&h=100&fit=crop',
    website: 'https://gucci.com',
    category: ['accessories', 'shoes', 'jackets'],
    priceRange: 'luxury',
    country: 'Italy',
    foundedYear: 1921,
    isActive: true,
    itemCount: 8,
    averagePrice: 850,
    popularCategories: ['accessories', 'shoes'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Uniqlo',
    description: 'Japanese casual wear designer and retailer',
    logoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop',
    website: 'https://uniqlo.com',
    category: ['shirts', 'pants', 'jackets'],
    priceRange: 'budget',
    country: 'Japan',
    foundedYear: 1949,
    isActive: true,
    itemCount: 20,
    averagePrice: 35,
    popularCategories: ['shirts', 'pants'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Zara',
    description: 'Spanish fast fashion retailer',
    logoUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=100&h=100&fit=crop',
    website: 'https://zara.com',
    category: ['shirts', 'pants', 'jackets', 'accessories'],
    priceRange: 'budget',
    country: 'Spain',
    foundedYear: 1975,
    isActive: true,
    itemCount: 18,
    averagePrice: 45,
    popularCategories: ['shirts', 'jackets'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: 'Louis Vuitton',
    description: 'French luxury fashion house and company',
    logoUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=100&h=100&fit=crop',
    website: 'https://louisvuitton.com',
    category: ['accessories', 'shoes', 'jackets'],
    priceRange: 'ultra-luxury',
    country: 'France',
    foundedYear: 1854,
    isActive: true,
    itemCount: 5,
    averagePrice: 1200,
    popularCategories: ['accessories'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    name: 'H&M',
    description: 'Swedish multinational clothing-retail company',
    logoUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=100&h=100&fit=crop',
    website: 'https://hm.com',
    category: ['shirts', 'pants', 'jackets', 'accessories'],
    priceRange: 'budget',
    country: 'Sweden',
    foundedYear: 1947,
    isActive: true,
    itemCount: 22,
    averagePrice: 25,
    popularCategories: ['shirts', 'pants'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    name: 'Ralph Lauren',
    description: 'American fashion company',
    logoUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=100&h=100&fit=crop',
    website: 'https://ralphlauren.com',
    category: ['shirts', 'pants', 'jackets', 'accessories'],
    priceRange: 'luxury',
    country: 'USA',
    foundedYear: 1967,
    isActive: true,
    itemCount: 10,
    averagePrice: 180,
    popularCategories: ['shirts', 'jackets'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Get all brands
export const getBrandsProcedure = publicProcedure
  .input(z.object({
    category: z.string().optional(),
    priceRange: z.enum(['budget', 'mid', 'luxury', 'ultra-luxury']).optional(),
    country: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'itemCount', 'averagePrice', 'foundedYear']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  }))
  .query(async ({ input }) => {
    console.log('Getting brands with filters:', input);
    
    let filteredBrands = [...mockBrands];
    
    // Apply filters
    if (input.category) {
      filteredBrands = filteredBrands.filter(brand => 
        brand.category.includes(input.category!)
      );
    }
    
    if (input.priceRange) {
      filteredBrands = filteredBrands.filter(brand => 
        brand.priceRange === input.priceRange
      );
    }
    
    if (input.country) {
      filteredBrands = filteredBrands.filter(brand => 
        brand.country?.toLowerCase().includes(input.country!.toLowerCase())
      );
    }
    
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filteredBrands = filteredBrands.filter(brand => 
        brand.name.toLowerCase().includes(searchLower) ||
        brand.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    filteredBrands.sort((a, b) => {
      let aValue: any = a[input.sortBy as keyof Brand];
      let bValue: any = b[input.sortBy as keyof Brand];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (input.sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });
    
    // Apply pagination
    const total = filteredBrands.length;
    const brands = filteredBrands.slice(input.offset, input.offset + input.limit);
    
    return {
      brands,
      total,
      hasMore: input.offset + input.limit < total
    };
  });

// Get brand by ID
export const getBrandProcedure = publicProcedure
  .input(z.object({
    id: z.string()
  }))
  .query(async ({ input }) => {
    console.log('Getting brand by ID:', input.id);
    
    const brand = mockBrands.find(b => b.id === input.id);
    
    if (!brand) {
      throw new Error('Brand not found');
    }
    
    return { brand };
  });

// Search brands
export const searchBrandsProcedure = publicProcedure
  .input(z.object({
    query: z.string().min(1),
    limit: z.number().min(1).max(50).default(10)
  }))
  .query(async ({ input }) => {
    console.log('Searching brands:', input.query);
    
    const searchLower = input.query.toLowerCase();
    const results = mockBrands
      .filter(brand => 
        brand.name.toLowerCase().includes(searchLower) ||
        brand.description?.toLowerCase().includes(searchLower) ||
        brand.category.some(cat => cat.toLowerCase().includes(searchLower))
      )
      .slice(0, input.limit);
    
    return { brands: results };
  });

// Get popular brands
export const getPopularBrandsProcedure = publicProcedure
  .input(z.object({
    limit: z.number().min(1).max(20).default(10)
  }))
  .query(async ({ input }) => {
    console.log('Getting popular brands, limit:', input.limit);
    
    const popularBrands = [...mockBrands]
      .sort((a, b) => b.itemCount - a.itemCount)
      .slice(0, input.limit);
    
    return { brands: popularBrands };
  });

// Get brands by category
export const getBrandsByCategoryProcedure = publicProcedure
  .input(z.object({
    category: z.string(),
    limit: z.number().min(1).max(50).default(20)
  }))
  .query(async ({ input }) => {
    console.log('Getting brands by category:', input.category);
    
    const brands = mockBrands
      .filter(brand => brand.category.includes(input.category))
      .sort((a, b) => b.itemCount - a.itemCount)
      .slice(0, input.limit);
    
    return { brands };
  });

// Get brands by price range
export const getBrandsByPriceRangeProcedure = publicProcedure
  .input(z.object({
    priceRange: z.enum(['budget', 'mid', 'luxury', 'ultra-luxury']),
    limit: z.number().min(1).max(50).default(20)
  }))
  .query(async ({ input }) => {
    console.log('Getting brands by price range:', input.priceRange);
    
    const brands = mockBrands
      .filter(brand => brand.priceRange === input.priceRange)
      .sort((a, b) => b.itemCount - a.itemCount)
      .slice(0, input.limit);
    
    return { brands };
  });

// Add new brand (protected)
export const addBrandProcedure = protectedProcedure
  .input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    logoUrl: z.string().url().optional(),
    website: z.string().url().optional(),
    category: z.array(z.string()).min(1),
    priceRange: z.enum(['budget', 'mid', 'luxury', 'ultra-luxury']),
    country: z.string().optional(),
    foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional()
  }))
  .mutation(async ({ input }) => {
    console.log('Adding new brand:', input.name);
    
    // Check if brand already exists
    const existingBrand = mockBrands.find(b => 
      b.name.toLowerCase() === input.name.toLowerCase()
    );
    
    if (existingBrand) {
      throw new Error('Brand already exists');
    }
    
    const newBrand: Brand = {
      id: (mockBrands.length + 1).toString(),
      name: input.name,
      description: input.description,
      logoUrl: input.logoUrl,
      website: input.website,
      category: input.category,
      priceRange: input.priceRange,
      country: input.country,
      foundedYear: input.foundedYear,
      isActive: true,
      itemCount: 0,
      averagePrice: 0,
      popularCategories: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockBrands.push(newBrand);
    
    return { brand: newBrand };
  });

// Update brand (protected)
export const updateBrandProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    logoUrl: z.string().url().optional(),
    website: z.string().url().optional(),
    category: z.array(z.string()).min(1).optional(),
    priceRange: z.enum(['budget', 'mid', 'luxury', 'ultra-luxury']).optional(),
    country: z.string().optional(),
    foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
    isActive: z.boolean().optional()
  }))
  .mutation(async ({ input }) => {
    console.log('Updating brand:', input.id);
    
    const brandIndex = mockBrands.findIndex(b => b.id === input.id);
    
    if (brandIndex === -1) {
      throw new Error('Brand not found');
    }
    
    const updatedBrand = {
      ...mockBrands[brandIndex],
      ...input,
      updatedAt: new Date().toISOString()
    };
    
    mockBrands[brandIndex] = updatedBrand;
    
    return { brand: updatedBrand };
  });

// Delete brand (protected)
export const deleteBrandProcedure = protectedProcedure
  .input(z.object({
    id: z.string()
  }))
  .mutation(async ({ input }) => {
    console.log('Deleting brand:', input.id);
    
    const brandIndex = mockBrands.findIndex(b => b.id === input.id);
    
    if (brandIndex === -1) {
      throw new Error('Brand not found');
    }
    
    const brand = mockBrands[brandIndex];
    
    // Check if brand has items
    if (brand.itemCount > 0) {
      throw new Error('Cannot delete brand with existing items');
    }
    
    mockBrands.splice(brandIndex, 1);
    
    return { success: true };
  });

// Get brand statistics
export const getBrandStatsProcedure = publicProcedure
  .query(async () => {
    console.log('Getting brand statistics');
    
    const totalBrands = mockBrands.length;
    const totalItems = mockBrands.reduce((sum, brand) => sum + brand.itemCount, 0);
    const averageItemsPerBrand = totalItems / totalBrands;
    
    const topBrandsByItems = mockBrands
      .map(brand => ({
        brand: brand.name,
        itemCount: brand.itemCount,
        totalValue: brand.itemCount * (brand.averagePrice || 0)
      }))
      .sort((a, b) => b.itemCount - a.itemCount)
      .slice(0, 10);
    
    const priceRangeDistribution = mockBrands.reduce((acc, brand) => {
      acc[brand.priceRange] = (acc[brand.priceRange] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const categoryDistribution = mockBrands.reduce((acc, brand) => {
      brand.category.forEach(cat => {
        acc[cat] = (acc[cat] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    const stats: BrandStats = {
      totalBrands,
      totalItems,
      averageItemsPerBrand,
      topBrandsByItems,
      priceRangeDistribution,
      categoryDistribution
    };
    
    return { stats };
  });

// Get brand suggestions based on user's wardrobe
export const getBrandSuggestionsProcedure = protectedProcedure
  .input(z.object({
    category: z.string().optional(),
    priceRange: z.enum(['budget', 'mid', 'luxury', 'ultra-luxury']).optional(),
    limit: z.number().min(1).max(20).default(5)
  }))
  .query(async ({ input }) => {
    console.log('Getting brand suggestions with filters:', input);
    
    let suggestions = [...mockBrands];
    
    // Apply filters
    if (input.category) {
      suggestions = suggestions.filter(brand => 
        brand.category.includes(input.category!)
      );
    }
    
    if (input.priceRange) {
      suggestions = suggestions.filter(brand => 
        brand.priceRange === input.priceRange
      );
    }
    
    // Sort by popularity and rating
    suggestions = suggestions
      .sort((a, b) => b.itemCount - a.itemCount)
      .slice(0, input.limit);
    
    return { brands: suggestions };
  });