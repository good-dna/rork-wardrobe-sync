import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { BarChart2, TrendingUp, TrendingDown, DollarSign, Calendar, Palette, ShoppingBag, Clock, Droplets, AlertTriangle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import StatsCard from '@/components/StatsCard';

type TimeFrame = '7days' | '30days' | '90days' | 'all';

export default function AnalyticsScreen() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('30days');
  
  const items = useWardrobeStore((state) => state.items);
  const getMostWornItems = useWardrobeStore((state) => state.getMostWornItems);
  const getLeastWornItems = useWardrobeStore((state) => state.getLeastWornItems);
  const getTotalWardrobeValue = useWardrobeStore((state) => state.getTotalWardrobeValue);
  const getItemsNeedingWash = useWardrobeStore((state) => state.getItemsNeedingWash);
  const getItemsNotWornSince = useWardrobeStore((state) => state.getItemsNotWornSince);
  
  // Memoize calculations to prevent infinite loops
  const totalValue = useMemo(() => getTotalWardrobeValue(), [getTotalWardrobeValue, items]);
  const mostWornItems = useMemo(() => getMostWornItems(1), [getMostWornItems, items]);
  const leastWornItems = useMemo(() => getLeastWornItems(1), [getLeastWornItems, items]);
  const itemsNeedingWash = useMemo(() => getItemsNeedingWash(), [getItemsNeedingWash, items]);
  
  // Calculate items not worn based on selected timeframe
  const notWornItems = useMemo(() => {
    const days = timeFrame === '7days' ? 7 : timeFrame === '30days' ? 30 : timeFrame === '90days' ? 90 : 365;
    return getItemsNotWornSince(days);
  }, [getItemsNotWornSince, timeFrame, items]);
  
  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);
  
  // Calculate color breakdown
  const colorBreakdown = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.color] = (acc[item.color] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);
  
  // Calculate average wear count
  const averageWearCount = useMemo(() => {
    return items.length > 0
      ? items.reduce((sum, item) => sum + item.wearCount, 0) / items.length
      : 0;
  }, [items]);
  
  // Calculate most recent purchase
  const mostRecentPurchase = useMemo(() => {
    return items.length > 0
      ? [...items].sort((a, b) => 
          new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
        )[0]
      : null;
  }, [items]);
  
  // Calculate wash statistics
  const washStats = useMemo(() => {
    const totalWashes = items.reduce((sum, item) => sum + (item.washHistory?.length || 0), 0);
    const avgWearsBetweenWashes = totalWashes > 0 
      ? items.reduce((sum, item) => sum + item.wearCount, 0) / totalWashes 
      : 0;
    
    return {
      totalWashes,
      avgWearsBetweenWashes,
      itemsNeedingWash: itemsNeedingWash.length
    };
  }, [items, itemsNeedingWash]);
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
              value={items.length} 
              subtitle="in your wardrobe" 
            />
          </View>
          <View style={styles.statsItem}>
            <StatsCard 
              title="Total Value" 
              value={`$${totalValue.toFixed(2)}`} 
              subtitle="estimated worth" 
              color={colors.success}
            />
          </View>
          <View style={styles.statsItem}>
            <StatsCard 
              title="Avg. Wear Count" 
              value={averageWearCount.toFixed(1)} 
              subtitle="times per item" 
              color={colors.info}
            />
          </View>
          <View style={styles.statsItem}>
            <StatsCard 
              title="Not Worn" 
              value={notWornItems.length} 
              subtitle={`in ${timeFrame === 'all' ? 'a year' : timeFrame.replace('days', ' days')}`} 
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
            <Text style={styles.washStatValue}>{washStats.totalWashes}</Text>
            <Text style={styles.washStatLabel}>Total Washes</Text>
          </View>
          
          <View style={styles.washStat}>
            <View style={styles.washStatIconContainer}>
              <Clock size={24} color={colors.primary} />
            </View>
            <Text style={styles.washStatValue}>{washStats.avgWearsBetweenWashes.toFixed(1)}</Text>
            <Text style={styles.washStatLabel}>Wears Between Washes</Text>
          </View>
          
          <View style={styles.washStat}>
            <View style={styles.washStatIconContainer}>
              <AlertTriangle size={24} color={colors.warning} />
            </View>
            <Text style={styles.washStatValue}>{washStats.itemsNeedingWash}</Text>
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
          {mostWornItems.length > 0 ? (
            <View style={styles.insightContent}>
              <Text style={styles.insightItemName}>{mostWornItems[0].name}</Text>
              <Text style={styles.insightItemDetail}>
{mostWornItems[0].brand} • Worn {mostWornItems[0].wearCount} times
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
          {leastWornItems.length > 0 ? (
            <View style={styles.insightContent}>
              <Text style={styles.insightItemName}>{leastWornItems[0].name}</Text>
              <Text style={styles.insightItemDetail}>
{leastWornItems[0].brand} • Worn {leastWornItems[0].wearCount} times
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
          {mostRecentPurchase ? (
            <View style={styles.insightContent}>
              <Text style={styles.insightItemName}>{mostRecentPurchase.name}</Text>
              <Text style={styles.insightItemDetail}>
{mostRecentPurchase.brand} • Purchased on {mostRecentPurchase.purchaseDate}
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
                        width: `${(count / items.length) * 100}%`,
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
                          width: `${(count / items.length) * 100}%`,
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
          <Text style={styles.valueAmount}>${totalValue.toFixed(2)}</Text>
          <Text style={styles.valueSubtitle}>Total estimated value</Text>
          
          <View style={styles.valueDivider} />
          
          <View style={styles.valueMetrics}>
            <View style={styles.valueMetric}>
              <Text style={styles.valueMetricLabel}>Avg. Item Value</Text>
              <Text style={styles.valueMetricAmount}>
                ${items.length > 0 ? (totalValue / items.length).toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={styles.valueMetric}>
              <Text style={styles.valueMetricLabel}>Cost Per Wear</Text>
              <Text style={styles.valueMetricAmount}>
                ${items.length > 0 && items.reduce((sum, item) => sum + item.wearCount, 0) > 0
                  ? (totalValue / items.reduce((sum, item) => sum + item.wearCount, 0)).toFixed(2)
                  : '0.00'
                }
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