import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart2, TrendingUp, TrendingDown, DollarSign, Calendar, Palette, ShoppingBag, Clock, Droplets, AlertTriangle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useWardrobeStore } from '@/store/wardrobeStore';
import StatsCard from '@/components/StatsCard';

type TimeFrame = '7days' | '30days' | '90days' | 'all';

export default function AnalyticsScreen() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('30days');
  const items = useWardrobeStore((state) => state.items);
  const insets = useSafeAreaInsets();
  
  // Try to fetch analytics data using tRPC, but fall back to local data
  const overviewQuery = trpc.analytics.overview.useQuery({ timeFrame }, { 
    retry: false,
    refetchOnWindowFocus: false 
  });
  const categoriesQuery = trpc.analytics.categories.useQuery(undefined, { 
    retry: false,
    refetchOnWindowFocus: false 
  });
  const colorsQuery = trpc.analytics.colors.useQuery(undefined, { 
    retry: false,
    refetchOnWindowFocus: false 
  });
  const wearQuery = trpc.analytics.wear.useQuery({ timeFrame, limit: 1 }, { 
    retry: false,
    refetchOnWindowFocus: false 
  });
  const purchasesQuery = trpc.analytics.purchases.useQuery({ months: 12 }, { 
    retry: false,
    refetchOnWindowFocus: false 
  });
  const maintenanceQuery = trpc.analytics.maintenance.useQuery(undefined, { 
    retry: false,
    refetchOnWindowFocus: false 
  });
  
  // Calculate local analytics as fallback
  const localAnalytics = useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
    const totalWears = items.reduce((sum, item) => sum + (item.wearCount || 0), 0);
    const totalWashes = items.reduce((sum, item) => sum + (item.washHistory?.length || 0), 0);
    const itemsNeedingWash = items.filter(item => item.cleaningStatus === 'dirty').length;
    
    // Category breakdown
    const categoryStats = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Color breakdown
    const colorStats = items.reduce((acc, item) => {
      acc[item.color] = (acc[item.color] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Most worn item
    const mostWornItem = items
      .filter(item => (item.wearCount || 0) > 0)
      .sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0))[0];
    
    // Least worn item
    const leastWornItem = items
      .filter(item => (item.wearCount || 0) > 0)
      .sort((a, b) => (a.wearCount || 0) - (b.wearCount || 0))[0];
    
    // Recent purchase
    const recentPurchase = items
      .filter(item => item.purchaseDate)
      .sort((a, b) => new Date(b.purchaseDate!).getTime() - new Date(a.purchaseDate!).getTime())[0];
    
    return {
      overview: {
        totalItems,
        totalValue,
        averageWearCount: totalItems > 0 ? totalWears / totalItems : 0,
        averageItemValue: totalItems > 0 ? totalValue / totalItems : 0,
        costPerWear: totalWears > 0 ? totalValue / totalWears : 0,
        totalWashes,
        avgWearsBetweenWashes: totalWashes > 0 ? totalWears / totalWashes : 0,
        itemsNeedingWash
      },
      categories: Object.entries(categoryStats).map(([category, count]) => ({
        category,
        count,
        percentage: (count / totalItems) * 100
      })),
      colors: Object.entries(colorStats).map(([color, count]) => ({
        color,
        count,
        percentage: (count / totalItems) * 100
      })),
      wear: {
        mostWornItems: mostWornItem ? [{
          id: mostWornItem.id,
          name: mostWornItem.name,
          brand: mostWornItem.brand,
          category: mostWornItem.category,
          wearCount: mostWornItem.wearCount || 0,
          lastWorn: mostWornItem.lastWorn || ''
        }] : [],
        leastWornItems: leastWornItem ? [{
          id: leastWornItem.id,
          name: leastWornItem.name,
          brand: leastWornItem.brand,
          category: leastWornItem.category,
          wearCount: leastWornItem.wearCount || 0,
          lastWorn: leastWornItem.lastWorn || ''
        }] : [],
        notWornItems: []
      },
      purchases: {
        recentPurchases: recentPurchase ? [{
          id: recentPurchase.id,
          name: recentPurchase.name,
          brand: recentPurchase.brand,
          category: recentPurchase.category,
          purchasePrice: recentPurchase.purchasePrice || 0,
          purchaseDate: recentPurchase.purchaseDate || ''
        }] : [],
        monthlySpending: [],
        categorySpending: []
      },
      maintenance: {
        cleanItems: items.filter(item => item.cleaningStatus === 'clean').length,
        dirtyItems: items.filter(item => item.cleaningStatus === 'dirty').length,
        needsRepairItems: items.filter(item => item.cleaningStatus === 'needs repair').length,
        washFrequency: [],
        upcomingMaintenance: []
      }
    };
  }, [items]);
  
  const isLoading = overviewQuery.isLoading || categoriesQuery.isLoading || colorsQuery.isLoading || wearQuery.isLoading || purchasesQuery.isLoading || maintenanceQuery.isLoading;
  
  // Use tRPC data if available, otherwise fall back to local analytics
  const overview = overviewQuery.data || localAnalytics.overview;
  const categories = categoriesQuery.data || localAnalytics.categories;
  const colorsData = colorsQuery.data || localAnalytics.colors;
  const wearData = wearQuery.data || localAnalytics.wear;
  const purchaseData = purchasesQuery.data || localAnalytics.purchases;
  const maintenanceData = maintenanceQuery.data || localAnalytics.maintenance;
  
  // Show loading only if we don't have local data and queries are still loading
  if (isLoading && items.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.title, { marginTop: 16 }]}>Loading Analytics...</Text>
      </View>
    );
  }
  
  // Convert categories to breakdown format
  const categoryBreakdown = categories.reduce((acc: Record<string, number>, cat: any) => {
    acc[cat.category] = cat.count;
    return acc;
  }, {} as Record<string, number>);
  
  // Convert colors to breakdown format
  const colorBreakdown = colorsData.reduce((acc: Record<string, number>, color: any) => {
    acc[color.color] = color.count;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Wardrobe Analytics</Text>
        <BarChart2 size={24} color={colors.primary} />
      </View>
      
      <View style={styles.timeFrameSelector}>
        <Text style={styles.timeFrameLabel}>Time Frame:</Text>
        <View style={styles.timeFrameOptions}>
          <Pressable
            style={[
              styles.timeFrameOption,
              timeFrame === '7days' && styles.selectedTimeFrameOption
            ]}
            onPress={() => setTimeFrame('7days')}
          >
            <Text 
              style={[
                styles.timeFrameOptionText,
                timeFrame === '7days' && styles.selectedTimeFrameOptionText
              ]}
            >
              7 Days
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.timeFrameOption,
              timeFrame === '30days' && styles.selectedTimeFrameOption
            ]}
            onPress={() => setTimeFrame('30days')}
          >
            <Text 
              style={[
                styles.timeFrameOptionText,
                timeFrame === '30days' && styles.selectedTimeFrameOptionText
              ]}
            >
              30 Days
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.timeFrameOption,
              timeFrame === '90days' && styles.selectedTimeFrameOption
            ]}
            onPress={() => setTimeFrame('90days')}
          >
            <Text 
              style={[
                styles.timeFrameOptionText,
                timeFrame === '90days' && styles.selectedTimeFrameOptionText
              ]}
            >
              90 Days
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.timeFrameOption,
              timeFrame === 'all' && styles.selectedTimeFrameOption
            ]}
            onPress={() => setTimeFrame('all')}
          >
            <Text 
              style={[
                styles.timeFrameOptionText,
                timeFrame === 'all' && styles.selectedTimeFrameOptionText
              ]}
            >
              All Time
            </Text>
          </Pressable>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statsItem}>
            <StatsCard 
              title="Total Items" 
              value={overview?.totalItems || 0} 
              subtitle="in your wardrobe" 
            />
          </View>
          <View style={styles.statsItem}>
            <StatsCard 
              title="Total Value" 
              value={`${(overview?.totalValue || 0).toFixed(2)}`} 
              subtitle="estimated worth" 
              color={colors.success}
            />
          </View>
          <View style={styles.statsItem}>
            <StatsCard 
              title="Avg. Wear Count" 
              value={(overview?.averageWearCount || 0).toFixed(1)} 
              subtitle="times per item" 
              color={colors.info}
            />
          </View>
          <View style={styles.statsItem}>
            <StatsCard 
              title="Items Needing Wash" 
              value={overview?.itemsNeedingWash || 0} 
              subtitle="need attention" 
              color={colors.warning}
            />
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cleaning & Maintenance</Text>
        <View style={styles.washStatsContainer}>
          <View style={styles.washStat}>
            <View style={styles.washStatIconContainer}>
              <Droplets size={24} color={colors.info} />
            </View>
            <Text style={styles.washStatValue}>{overview?.totalWashes || 0}</Text>
            <Text style={styles.washStatLabel}>Total Washes</Text>
          </View>
          
          <View style={styles.washStat}>
            <View style={styles.washStatIconContainer}>
              <Clock size={24} color={colors.primary} />
            </View>
            <Text style={styles.washStatValue}>{(overview?.avgWearsBetweenWashes || 0).toFixed(1)}</Text>
            <Text style={styles.washStatLabel}>Wears Between Washes</Text>
          </View>
          
          <View style={styles.washStat}>
            <View style={styles.washStatIconContainer}>
              <AlertTriangle size={24} color={colors.warning} />
            </View>
            <Text style={styles.washStatValue}>{maintenanceData?.dirtyItems || 0}</Text>
            <Text style={styles.washStatLabel}>Need Washing</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage Insights</Text>
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightTitle}>Most Worn</Text>
            <TrendingUp size={18} color={colors.success} />
          </View>
          {wearData?.mostWornItems && wearData.mostWornItems.length > 0 ? (
            <View style={styles.insightContent}>
              <Text style={styles.insightItemName}>{wearData.mostWornItems[0].name}</Text>
              <Text style={styles.insightItemDetail}>
                {wearData.mostWornItems[0].brand} • Worn {wearData.mostWornItems[0].wearCount} times
              </Text>
            </View>
          ) : (
            <Text style={styles.noDataText}>No wear data available</Text>
          )}
        </View>
        
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightTitle}>Least Worn</Text>
            <TrendingDown size={18} color={colors.error} />
          </View>
          {wearData?.leastWornItems && wearData.leastWornItems.length > 0 ? (
            <View style={styles.insightContent}>
              <Text style={styles.insightItemName}>{wearData.leastWornItems[0].name}</Text>
              <Text style={styles.insightItemDetail}>
                {wearData.leastWornItems[0].brand} • Worn {wearData.leastWornItems[0].wearCount} times
              </Text>
            </View>
          ) : (
            <Text style={styles.noDataText}>No wear data available</Text>
          )}
        </View>
        
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightTitle}>Latest Purchase</Text>
            <Calendar size={18} color={colors.info} />
          </View>
          {purchaseData?.recentPurchases && purchaseData.recentPurchases.length > 0 ? (
            <View style={styles.insightContent}>
              <Text style={styles.insightItemName}>{purchaseData.recentPurchases[0].name}</Text>
              <Text style={styles.insightItemDetail}>
                {purchaseData.recentPurchases[0].brand} • Purchased on {purchaseData.recentPurchases[0].purchaseDate}
              </Text>
            </View>
          ) : (
            <Text style={styles.noDataText}>No purchase data available</Text>
          )}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wardrobe Composition</Text>
        <View style={styles.compositionCard}>
          <View style={styles.compositionHeader}>
            <Text style={styles.compositionTitle}>Categories</Text>
            <ShoppingBag size={18} color={colors.primary} />
          </View>
          <View style={styles.compositionContent}>
            {Object.entries(categoryBreakdown).map(([category, count]) => (
              <View key={category} style={styles.compositionItem}>
                <View style={styles.compositionLabelContainer}>
                  <Text style={styles.compositionLabel}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </View>
                <View style={styles.compositionBarContainer}>
                  <View 
                    style={[
                      styles.compositionBar, 
                      { 
                        width: `${(count / (overview?.totalItems || 1)) * 100}%`,
                        backgroundColor: colors.primary,
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.compositionCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.compositionCard}>
          <View style={styles.compositionHeader}>
            <Text style={styles.compositionTitle}>Colors</Text>
            <Palette size={18} color={colors.secondary} />
          </View>
          <View style={styles.compositionContent}>
            {Object.entries(colorBreakdown)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([color, count]) => (
                <View key={color} style={styles.compositionItem}>
                  <View style={styles.compositionLabelContainer}>
                    <Text style={styles.compositionLabel}>{color}</Text>
                  </View>
                  <View style={styles.compositionBarContainer}>
                    <View 
                      style={[
                        styles.compositionBar, 
                        { 
                          width: `${(count / (overview?.totalItems || 1)) * 100}%`,
                          backgroundColor: colors.secondary,
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.compositionCount}>{count}</Text>
                </View>
              ))}
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Value Analysis</Text>
        <View style={styles.valueCard}>
          <View style={styles.valueHeader}>
            <Text style={styles.valueTitle}>Wardrobe Value</Text>
            <DollarSign size={18} color={colors.success} />
          </View>
          <Text style={styles.valueAmount}>${(overview?.totalValue || 0).toFixed(2)}</Text>
          <Text style={styles.valueSubtitle}>Total estimated value</Text>
          
          <View style={styles.valueDivider} />
          
          <View style={styles.valueMetrics}>
            <View style={styles.valueMetric}>
              <Text style={styles.valueMetricLabel}>Avg. Item Value</Text>
              <Text style={styles.valueMetricAmount}>
                ${(overview?.averageItemValue || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.valueMetric}>
              <Text style={styles.valueMetricLabel}>Cost Per Wear</Text>
              <Text style={styles.valueMetricAmount}>
                ${(overview?.costPerWear || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  timeFrameSelector: {
    marginBottom: 16,
  },
  timeFrameLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  timeFrameOptions: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 4,
  },
  timeFrameOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  selectedTimeFrameOption: {
    backgroundColor: colors.background,
  },
  timeFrameOptionText: {
    fontSize: 12,
    color: colors.subtext,
  },
  selectedTimeFrameOptionText: {
    color: colors.primary,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsItem: {
    width: '48%',
    marginBottom: 12,
  },
  washStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  washStat: {
    alignItems: 'center',
    flex: 1,
  },
  washStatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  washStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  washStatLabel: {
    fontSize: 12,
    color: colors.subtext,
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  insightContent: {
    marginTop: 4,
  },
  insightItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  insightItemDetail: {
    fontSize: 14,
    color: colors.subtext,
  },
  noDataText: {
    fontSize: 14,
    color: colors.subtext,
    fontStyle: 'italic',
  },
  compositionCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compositionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  compositionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  compositionContent: {
    marginTop: 4,
  },
  compositionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  compositionLabelContainer: {
    width: 80,
  },
  compositionLabel: {
    fontSize: 14,
    color: colors.text,
  },
  compositionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginHorizontal: 12,
  },
  compositionBar: {
    height: 8,
    borderRadius: 4,
  },
  compositionCount: {
    fontSize: 14,
    color: colors.subtext,
    width: 30,
    textAlign: 'right',
  },
  valueCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  valueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  valueAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 4,
  },
  valueSubtitle: {
    fontSize: 14,
    color: colors.subtext,
  },
  valueDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  valueMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueMetric: {
    flex: 1,
  },
  valueMetricLabel: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 4,
  },
  valueMetricAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});