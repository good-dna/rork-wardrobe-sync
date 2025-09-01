import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { mockItems } from '../../../../constants/mockData';
import { Item } from '../../../../types/wardrobe';

// Analytics data types
interface WardrobeOverview {
  totalItems: number;
  totalValue: number;
  averageWearCount: number;
  averageItemValue: number;
  costPerWear: number;
  totalWashes: number;
  avgWearsBetweenWashes: number;
  itemsNeedingWash: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
  totalValue: number;
  averageWearCount: number;
}

interface ColorBreakdown {
  color: string;
  count: number;
  percentage: number;
}

interface BrandBreakdown {
  brand: string;
  count: number;
  percentage: number;
  totalValue: number;
  averageWearCount: number;
}

interface WearAnalytics {
  mostWornItems: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    wearCount: number;
    lastWorn: string;
  }>;
  leastWornItems: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    wearCount: number;
    lastWorn: string;
  }>;
  notWornItems: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    daysSinceLastWorn: number;
    lastWorn: string;
  }>;
}

interface PurchaseAnalytics {
  recentPurchases: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    purchasePrice: number;
    purchaseDate: string;
  }>;
  monthlySpending: Array<{
    month: string;
    totalSpent: number;
    itemCount: number;
  }>;
  categorySpending: Array<{
    category: string;
    totalSpent: number;
    itemCount: number;
    averagePrice: number;
  }>;
}

interface SeasonalAnalytics {
  springItems: number;
  summerItems: number;
  fallItems: number;
  winterItems: number;
  allSeasonItems: number;
  seasonalWearPatterns: Array<{
    season: string;
    totalWears: number;
    averageWears: number;
  }>;
}

interface MaintenanceAnalytics {
  cleanItems: number;
  dirtyItems: number;
  needsRepairItems: number;
  washFrequency: Array<{
    itemId: string;
    name: string;
    brand: string;
    totalWashes: number;
    daysBetweenWashes: number;
    lastWashed: string;
  }>;
  upcomingMaintenance: Array<{
    itemId: string;
    name: string;
    brand: string;
    maintenanceType: 'wash' | 'repair' | 'dry_clean';
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

// Get wardrobe overview statistics
export const getWardrobeOverviewProcedure = publicProcedure
  .input(z.object({
    timeFrame: z.enum(['7days', '30days', '90days', 'all']).optional().default('30days')
  }))
  .query(async ({ ctx, input }) => {
    const userId = 'demo-user'; // For demo purposes
    const { timeFrame: _ } = input;

    // Get all wardrobe items
    const items = mockItems;

    if (items.length === 0) {
      return {
        totalItems: 0,
        totalValue: 0,
        averageWearCount: 0,
        averageItemValue: 0,
        costPerWear: 0,
        totalWashes: 0,
        avgWearsBetweenWashes: 0,
        itemsNeedingWash: 0
      } as WardrobeOverview;
    }

    const totalItems = items.length;
    const totalValue = items.reduce((sum: number, item: any) => sum + (item.purchasePrice || 0), 0);
    const totalWears = items.reduce((sum: number, item: any) => sum + (item.wearCount || 0), 0);
    const totalWashes = items.reduce((sum: number, item: any) => sum + (item.washHistory?.length || 0), 0);
    const itemsNeedingWash = items.filter((item: any) => item.cleaningStatus === 'dirty').length;

    const averageWearCount = totalItems > 0 ? totalWears / totalItems : 0;
    const averageItemValue = totalItems > 0 ? totalValue / totalItems : 0;
    const costPerWear = totalWears > 0 ? totalValue / totalWears : 0;
    const avgWearsBetweenWashes = totalWashes > 0 ? totalWears / totalWashes : 0;

    return {
      totalItems,
      totalValue,
      averageWearCount,
      averageItemValue,
      costPerWear,
      totalWashes,
      avgWearsBetweenWashes,
      itemsNeedingWash
    } as WardrobeOverview;
  });

// Get category breakdown analytics
export const getCategoryBreakdownProcedure = publicProcedure
  .query(async ({ ctx }) => {
    const userId = 'demo-user'; // For demo purposes

    const items = mockItems
      .map((item: any) => ({ category: item.category, purchase_price: item.purchasePrice, wear_count: item.wearCount }));

    if (items.length === 0) {
      return [];
    }

    const categoryStats = items.reduce((acc: any, item: any) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          totalValue: 0,
          totalWears: 0
        };
      }
      acc[category].count += 1;
      acc[category].totalValue += item.purchase_price || 0;
      acc[category].totalWears += item.wear_count || 0;
      return acc;
    }, {} as Record<string, { count: number; totalValue: number; totalWears: number }>);

    const totalItems = items.length;

    return Object.entries(categoryStats).map(([category, stats]: [string, any]) => ({
      category,
      count: stats.count,
      percentage: (stats.count / totalItems) * 100,
      totalValue: stats.totalValue,
      averageWearCount: stats.count > 0 ? stats.totalWears / stats.count : 0
    })) as CategoryBreakdown[];
  });

// Get color breakdown analytics
export const getColorBreakdownProcedure = publicProcedure
  .query(async ({ ctx }) => {
    const userId = 'demo-user'; // For demo purposes

    const items = mockItems
      .map((item: any) => ({ color: item.color }));

    if (items.length === 0) {
      return [];
    }

    const colorStats = items.reduce((acc: any, item: any) => {
      const color = item.color;
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalItems = items.length;

    return Object.entries(colorStats)
      .map(([color, count]: [string, any]) => ({
        color,
        count,
        percentage: (count / totalItems) * 100
      }))
      .sort((a: any, b: any) => b.count - a.count) as ColorBreakdown[];
  });

// Get brand breakdown analytics
export const getBrandBreakdownProcedure = publicProcedure
  .query(async ({ ctx }) => {
    const userId = 'demo-user'; // For demo purposes

    const items = mockItems
      .map((item: any) => ({ brand: item.brand, purchase_price: item.purchasePrice, wear_count: item.wearCount }));

    if (items.length === 0) {
      return [];
    }

    const brandStats = items.reduce((acc: any, item: any) => {
      const brand = item.brand;
      if (!acc[brand]) {
        acc[brand] = {
          count: 0,
          totalValue: 0,
          totalWears: 0
        };
      }
      acc[brand].count += 1;
      acc[brand].totalValue += item.purchase_price || 0;
      acc[brand].totalWears += item.wear_count || 0;
      return acc;
    }, {} as Record<string, { count: number; totalValue: number; totalWears: number }>);

    const totalItems = items.length;

    return Object.entries(brandStats)
      .map(([brand, stats]: [string, any]) => ({
        brand,
        count: stats.count,
        percentage: (stats.count / totalItems) * 100,
        totalValue: stats.totalValue,
        averageWearCount: stats.count > 0 ? stats.totalWears / stats.count : 0
      }))
      .sort((a: any, b: any) => b.count - a.count) as BrandBreakdown[];
  });

// Get wear analytics
export const getWearAnalyticsProcedure = publicProcedure
  .input(z.object({
    timeFrame: z.enum(['7days', '30days', '90days', 'all']).optional().default('30days'),
    limit: z.number().min(1).max(50).optional().default(10)
  }))
  .query(async ({ ctx, input }) => {
    const userId = 'demo-user'; // For demo purposes
    const { timeFrame, limit } = input;

    const items = mockItems
      .map((item: any) => ({ id: item.id, name: item.name, brand: item.brand, category: item.category, wear_count: item.wearCount, last_worn: item.lastWorn }))
      .sort((a: any, b: any) => b.wear_count - a.wear_count);

    if (items.length === 0) {
      return {
        mostWornItems: [],
        leastWornItems: [],
        notWornItems: []
      };
    }

    // Most worn items
    const mostWornItems = items
      .filter((item: any) => item.wear_count > 0)
      .slice(0, limit)
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        wearCount: item.wear_count,
        lastWorn: item.last_worn
      }));

    // Least worn items (but worn at least once)
    const leastWornItems = items
      .filter((item: any) => item.wear_count > 0)
      .sort((a: any, b: any) => a.wear_count - b.wear_count)
      .slice(0, limit)
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        wearCount: item.wear_count,
        lastWorn: item.last_worn
      }));

    // Items not worn in specified timeframe
    const days = timeFrame === '7days' ? 7 : timeFrame === '30days' ? 30 : timeFrame === '90days' ? 90 : 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const notWornItems = items
      .filter((item: any) => {
        if (!item.last_worn) return true;
        const lastWornDate = new Date(item.last_worn);
        return lastWornDate < cutoffDate;
      })
      .slice(0, limit)
      .map((item: any) => {
        const daysSinceLastWorn = item.last_worn 
          ? Math.floor((Date.now() - new Date(item.last_worn).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        return {
          id: item.id,
          name: item.name,
          brand: item.brand,
          category: item.category,
          daysSinceLastWorn,
          lastWorn: item.last_worn
        };
      });

    return {
      mostWornItems,
      leastWornItems,
      notWornItems
    } as WearAnalytics;
  });

// Get purchase analytics
export const getPurchaseAnalyticsProcedure = publicProcedure
  .input(z.object({
    months: z.number().min(1).max(24).optional().default(12)
  }))
  .query(async ({ ctx, input }) => {
    const userId = 'demo-user'; // For demo purposes
    const { months } = input;

    const items = mockItems
      .map((item: any) => ({ id: item.id, name: item.name, brand: item.brand, category: item.category, purchase_price: item.purchasePrice, purchase_date: item.purchaseDate }))
      .sort((a: any, b: any) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());

    if (items.length === 0) {
      return {
        recentPurchases: [],
        monthlySpending: [],
        categorySpending: []
      };
    }

    // Recent purchases (last 10)
    const recentPurchases = items
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        purchasePrice: item.purchase_price || 0,
        purchaseDate: item.purchase_date
      }));

    // Monthly spending analysis
    const monthlyStats = items.reduce((acc: any, item: any) => {
      if (!item.purchase_date) return acc;
      
      const date = new Date(item.purchase_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          totalSpent: 0,
          itemCount: 0
        };
      }
      
      acc[monthKey].totalSpent += item.purchase_price || 0;
      acc[monthKey].itemCount += 1;
      
      return acc;
    }, {} as Record<string, { totalSpent: number; itemCount: number }>);

    const monthlySpending = Object.entries(monthlyStats)
      .map(([month, stats]: [string, any]) => ({
        month,
        totalSpent: stats.totalSpent,
        itemCount: stats.itemCount
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, months);

    // Category spending analysis
    const categoryStats = items.reduce((acc: any, item: any) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = {
          totalSpent: 0,
          itemCount: 0
        };
      }
      acc[category].totalSpent += item.purchase_price || 0;
      acc[category].itemCount += 1;
      return acc;
    }, {} as Record<string, { totalSpent: number; itemCount: number }>);

    const categorySpending = Object.entries(categoryStats)
      .map(([category, stats]: [string, any]) => ({
        category,
        totalSpent: stats.totalSpent,
        itemCount: stats.itemCount,
        averagePrice: stats.itemCount > 0 ? stats.totalSpent / stats.itemCount : 0
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    return {
      recentPurchases,
      monthlySpending,
      categorySpending
    } as PurchaseAnalytics;
  });

// Get seasonal analytics
export const getSeasonalAnalyticsProcedure = publicProcedure
  .query(async ({ ctx }) => {
    const userId = 'demo-user'; // For demo purposes

    const items = mockItems
      .map((item: any) => ({ season: item.season, wear_count: item.wearCount }));

    if (items.length === 0) {
      return {
        springItems: 0,
        summerItems: 0,
        fallItems: 0,
        winterItems: 0,
        allSeasonItems: 0,
        seasonalWearPatterns: []
      };
    }

    const seasonalStats = {
      spring: { count: 0, totalWears: 0 },
      summer: { count: 0, totalWears: 0 },
      fall: { count: 0, totalWears: 0 },
      winter: { count: 0, totalWears: 0 },
      all: { count: 0, totalWears: 0 }
    };

    items.forEach((item: any) => {
      const seasons = Array.isArray(item.season) ? item.season : [item.season];
      const wearCount = item.wear_count || 0;

      seasons.forEach((season: any) => {
        if (seasonalStats[season as keyof typeof seasonalStats]) {
          seasonalStats[season as keyof typeof seasonalStats].count += 1;
          seasonalStats[season as keyof typeof seasonalStats].totalWears += wearCount;
        }
      });
    });

    const seasonalWearPatterns = Object.entries(seasonalStats).map(([season, stats]) => ({
      season,
      totalWears: stats.totalWears,
      averageWears: stats.count > 0 ? stats.totalWears / stats.count : 0
    }));

    return {
      springItems: seasonalStats.spring.count,
      summerItems: seasonalStats.summer.count,
      fallItems: seasonalStats.fall.count,
      winterItems: seasonalStats.winter.count,
      allSeasonItems: seasonalStats.all.count,
      seasonalWearPatterns
    } as SeasonalAnalytics;
  });

// Get maintenance analytics
export const getMaintenanceAnalyticsProcedure = publicProcedure
  .query(async ({ ctx }) => {
    const userId = 'demo-user'; // For demo purposes

    const items = mockItems
      .map((item: any) => ({ id: item.id, name: item.name, brand: item.brand, cleaning_status: item.cleaningStatus, wash_history: item.washHistory || [], next_wash_due: item.nextWashDue }));

    if (items.length === 0) {
      return {
        cleanItems: 0,
        dirtyItems: 0,
        needsRepairItems: 0,
        washFrequency: [],
        upcomingMaintenance: []
      };
    }

    const cleanItems = items.filter((item: any) => item.cleaning_status === 'clean').length;
    const dirtyItems = items.filter((item: any) => item.cleaning_status === 'dirty').length;
    const needsRepairItems = items.filter((item: any) => item.cleaning_status === 'needs repair').length;

    // Wash frequency analysis
    const washFrequency = items
      .filter((item: any) => item.wash_history && item.wash_history.length > 0)
      .map((item: any) => {
        const washHistory = item.wash_history || [];
        const totalWashes = washHistory.length;
        
        let daysBetweenWashes = 0;
        if (totalWashes > 1) {
          const dates = washHistory.map((wash: any) => new Date(wash.date)).sort((a: Date, b: Date) => a.getTime() - b.getTime());
          const totalDays = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
          daysBetweenWashes = totalDays / (totalWashes - 1);
        }
        
        const lastWashed = washHistory.length > 0 
          ? washHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
          : '';

        return {
          itemId: item.id,
          name: item.name,
          brand: item.brand,
          totalWashes,
          daysBetweenWashes: Math.round(daysBetweenWashes),
          lastWashed
        };
      })
      .sort((a: any, b: any) => b.totalWashes - a.totalWashes)
      .slice(0, 10);

    // Upcoming maintenance
    const upcomingMaintenance = items
      .filter((item: any) => {
        if (item.cleaning_status === 'dirty') return true;
        if (item.cleaning_status === 'needs repair') return true;
        if (item.next_wash_due) {
          const dueDate = new Date(item.next_wash_due);
          const today = new Date();
          const daysDiff = (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7; // Due within a week
        }
        return false;
      })
      .map((item: any) => {
        let maintenanceType: 'wash' | 'repair' | 'dry_clean' = 'wash';
        let priority: 'low' | 'medium' | 'high' = 'medium';
        let dueDate = new Date().toISOString();

        if (item.cleaning_status === 'needs repair') {
          maintenanceType = 'repair';
          priority = 'high';
        } else if (item.cleaning_status === 'dirty') {
          maintenanceType = 'wash';
          priority = 'medium';
        } else if (item.next_wash_due) {
          dueDate = item.next_wash_due;
          const daysDiff = (new Date(item.next_wash_due).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          priority = daysDiff <= 2 ? 'high' : daysDiff <= 5 ? 'medium' : 'low';
        }

        return {
          itemId: item.id,
          name: item.name,
          brand: item.brand,
          maintenanceType,
          dueDate,
          priority
        };
      })
      .sort((a: any, b: any) => {
        const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    return {
      cleanItems,
      dirtyItems,
      needsRepairItems,
      washFrequency,
      upcomingMaintenance
    } as MaintenanceAnalytics;
  });

// Get comprehensive analytics dashboard data
export const getAnalyticsDashboardProcedure = publicProcedure
  .input(z.object({
    timeFrame: z.enum(['7days', '30days', '90days', 'all']).optional().default('30days')
  }))
  .query(async ({ ctx, input }) => {
    const { timeFrame: _ } = input;
    const userId = 'demo-user';

    // Get all wardrobe items
    const items = mockItems;

    if (items.length === 0) {
      return {
        overview: {
          totalItems: 0,
          totalValue: 0,
          averageWearCount: 0,
          averageItemValue: 0,
          costPerWear: 0,
          totalWashes: 0,
          avgWearsBetweenWashes: 0,
          itemsNeedingWash: 0
        },
        categories: [],
        colors: [],
        brands: [],
        wearAnalytics: {
          mostWornItems: [],
          leastWornItems: [],
          notWornItems: []
        },
        purchases: {
          recentPurchases: [],
          monthlySpending: [],
          categorySpending: []
        },
        seasonal: {
          springItems: 0,
          summerItems: 0,
          fallItems: 0,
          winterItems: 0,
          allSeasonItems: 0,
          seasonalWearPatterns: []
        },
        maintenance: {
          cleanItems: 0,
          dirtyItems: 0,
          needsRepairItems: 0,
          washFrequency: [],
          upcomingMaintenance: []
        },
        generatedAt: new Date().toISOString()
      };
    }

    // Calculate overview
    const totalItems = items.length;
    const totalValue = items.reduce((sum: number, item: any) => sum + (item.purchasePrice || 0), 0);
    const totalWears = items.reduce((sum: number, item: any) => sum + (item.wearCount || 0), 0);
    const totalWashes = items.reduce((sum: number, item: any) => sum + (item.washHistory?.length || 0), 0);
    const itemsNeedingWash = items.filter((item: any) => item.cleaningStatus === 'dirty').length;

    const overview = {
      totalItems,
      totalValue,
      averageWearCount: totalItems > 0 ? totalWears / totalItems : 0,
      averageItemValue: totalItems > 0 ? totalValue / totalItems : 0,
      costPerWear: totalWears > 0 ? totalValue / totalWears : 0,
      totalWashes,
      avgWearsBetweenWashes: totalWashes > 0 ? totalWears / totalWashes : 0,
      itemsNeedingWash
    };

    // Simple analytics for dashboard
    const categories: CategoryBreakdown[] = [];
    const colors: ColorBreakdown[] = [];
    const brands: BrandBreakdown[] = [];
    const wearAnalytics = {
      mostWornItems: [],
      leastWornItems: [],
      notWornItems: []
    };
    const purchases = {
      recentPurchases: [],
      monthlySpending: [],
      categorySpending: []
    };
    const seasonal = {
      springItems: 0,
      summerItems: 0,
      fallItems: 0,
      winterItems: 0,
      allSeasonItems: 0,
      seasonalWearPatterns: []
    };
    const maintenance = {
      cleanItems: 0,
      dirtyItems: 0,
      needsRepairItems: 0,
      washFrequency: [],
      upcomingMaintenance: []
    };

    return {
      overview,
      categories,
      colors,
      brands,
      wearAnalytics,
      purchases,
      seasonal,
      maintenance,
      generatedAt: new Date().toISOString()
    };
  });