import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { DollarSign, TrendingUp, ShoppingBag, Award, RefreshCw } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { supabase, Tables } from '@/lib/supabase';

type WardrobeItem = Tables<'wardrobe_items'>;

interface AnalyticsData {
  valuation: {
    total_items: number;
    total_estimated_value: number;
    total_purchase_value: number;
    total_wears: number;
  };
  top_brand: {
    brand: string | null;
    wears: number | null;
  };
  top_color: {
    color: string | null;
    wears: number | null;
  };
  top_category: {
    category: string | null;
    wears: number | null;
  };
}

export default function ClosetAnalyticsScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [topWornItems, setTopWornItems] = useState<WardrobeItem[]>([]);
  
  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Error', 'Not authenticated. Please sign in.');
        router.back();
        return;
      }
      
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_closet_analytics');
      
      if (analyticsError) {
        console.error('Error loading analytics:', JSON.stringify(analyticsError, null, 2));
        Alert.alert('Error', `Failed to load analytics: ${analyticsError.message || 'Unknown error'}`);
        return;
      }
      
      console.log('Analytics data received:', JSON.stringify(analyticsData, null, 2));
      
      if (analyticsData && typeof analyticsData === 'object') {
        const defaultAnalytics: AnalyticsData = {
          valuation: {
            total_items: 0,
            total_estimated_value: 0,
            total_purchase_value: 0,
            total_wears: 0,
          },
          top_brand: {
            brand: null,
            wears: null,
          },
          top_color: {
            color: null,
            wears: null,
          },
          top_category: {
            category: null,
            wears: null,
          },
        };
        
        setAnalytics({
          ...defaultAnalytics,
          ...analyticsData,
          valuation: {
            ...defaultAnalytics.valuation,
            ...(analyticsData.valuation || {}),
          },
          top_brand: {
            ...defaultAnalytics.top_brand,
            ...(analyticsData.top_brand || {}),
          },
          top_color: {
            ...defaultAnalytics.top_color,
            ...(analyticsData.top_color || {}),
          },
          top_category: {
            ...defaultAnalytics.top_category,
            ...(analyticsData.top_category || {}),
          },
        });
      } else {
        setAnalytics({
          valuation: {
            total_items: 0,
            total_estimated_value: 0,
            total_purchase_value: 0,
            total_wears: 0,
          },
          top_brand: { brand: null, wears: null },
          top_color: { color: null, wears: null },
          top_category: { category: null, wears: null },
        });
      }
      
      const { data: topItems, error: topItemsError } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id)
        .order('times_worn', { ascending: false })
        .limit(10);
      
      if (topItemsError) {
        console.error('Error loading top items:', JSON.stringify(topItemsError, null, 2));
        Alert.alert('Top Items Error', `Could not load top items: ${topItemsError.message || 'Unknown error'}`);
      } else {
        setTopWornItems(topItems || []);
      }
    } catch (err) {
      console.error('Error in loadAnalytics:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Closet Analytics' }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }
  
  if (!analytics) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Closet Analytics' }} />
        <ShoppingBag size={64} color={colors.mediumGray} />
        <Text style={styles.emptyTitle}>No Data Available</Text>
        <Text style={styles.emptySubtitle}>Add items to your closet to see analytics</Text>
      </View>
    );
  }
  
  const hasItems = analytics?.valuation?.total_items ? analytics.valuation.total_items > 0 : false;
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen 
        options={{
          title: 'Closet Analytics',
          headerRight: () => (
            <Pressable onPress={handleRefresh} disabled={refreshing} style={styles.headerButton}>
              {refreshing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <RefreshCw size={20} color={colors.primary} />
              )}
            </Pressable>
          ),
        }}
      />
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <DollarSign size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Closet Valuation</Text>
        </View>
        
        <View style={styles.cardsGrid}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Text style={styles.statLabel}>Total Items</Text>
            <Text style={styles.statValue}>{analytics?.valuation?.total_items ?? 0}</Text>
          </View>
          
          <View style={[styles.statCard, styles.successCard]}>
            <Text style={styles.statLabel}>Estimated Value</Text>
            <Text style={styles.statValue}>
              {formatCurrency(analytics?.valuation?.total_estimated_value ?? 0)}
            </Text>
          </View>
          
          <View style={[styles.statCard, styles.warningCard]}>
            <Text style={styles.statLabel}>Purchase Value</Text>
            <Text style={styles.statValue}>
              {formatCurrency(analytics?.valuation?.total_purchase_value ?? 0)}
            </Text>
          </View>
          
          <View style={[styles.statCard, styles.infoCard]}>
            <Text style={styles.statLabel}>Total Wears</Text>
            <Text style={styles.statValue}>{analytics?.valuation?.total_wears ?? 0}</Text>
          </View>
        </View>
      </View>
      
      {hasItems && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Usage Insights</Text>
          </View>
          
          <View style={styles.insightsContainer}>
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Award size={20} color={colors.primary} />
                <Text style={styles.insightTitle}>Most Used Brand</Text>
              </View>
              {analytics?.top_brand?.brand ? (
                <>
                  <Text style={styles.insightValue}>{analytics.top_brand.brand}</Text>
                  <Text style={styles.insightSubtext}>
                    {analytics.top_brand.wears ?? 0} {analytics.top_brand.wears === 1 ? 'wear' : 'wears'}
                  </Text>
                </>
              ) : (
                <Text style={styles.insightNoData}>No brand data</Text>
              )}
            </View>
            
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Award size={20} color={colors.secondary} />
                <Text style={styles.insightTitle}>Most Used Color</Text>
              </View>
              {analytics?.top_color?.color ? (
                <>
                  <Text style={styles.insightValue}>
                    {analytics.top_color.color.charAt(0).toUpperCase() + analytics.top_color.color.slice(1)}
                  </Text>
                  <Text style={styles.insightSubtext}>
                    {analytics.top_color.wears ?? 0} {analytics.top_color.wears === 1 ? 'wear' : 'wears'}
                  </Text>
                </>
              ) : (
                <Text style={styles.insightNoData}>No color data</Text>
              )}
            </View>
            
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Award size={20} color={colors.success} />
                <Text style={styles.insightTitle}>Most Used Category</Text>
              </View>
              {analytics?.top_category?.category ? (
                <>
                  <Text style={styles.insightValue}>
                    {analytics.top_category.category.charAt(0).toUpperCase() + analytics.top_category.category.slice(1)}
                  </Text>
                  <Text style={styles.insightSubtext}>
                    {analytics.top_category.wears ?? 0} {analytics.top_category.wears === 1 ? 'wear' : 'wears'}
                  </Text>
                </>
              ) : (
                <Text style={styles.insightNoData}>No category data</Text>
              )}
            </View>
          </View>
        </View>
      )}
      
      {topWornItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Top 10 Most Worn Items</Text>
          </View>
          
          <View style={styles.topItemsList}>
            {topWornItems.map((item, index) => (
              <View key={item.id} style={styles.topItemCard}>
                <View style={styles.topItemRank}>
                  <Text style={styles.topItemRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.topItemInfo}>
                  <Text style={styles.topItemName}>{item.name}</Text>
                  <Text style={styles.topItemDetails}>
                    {item.brand} • {item.category}
                  </Text>
                </View>
                <View style={styles.topItemWears}>
                  <Text style={styles.topItemWearsValue}>{item.times_worn}</Text>
                  <Text style={styles.topItemWearsLabel}>wears</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {!hasItems && (
        <View style={styles.emptyStateCard}>
          <ShoppingBag size={48} color={colors.mediumGray} />
          <Text style={styles.emptyStateTitle}>Your closet is empty</Text>
          <Text style={styles.emptyStateSubtitle}>
            Start adding items to see detailed analytics and insights
          </Text>
        </View>
      )}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.subtext,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.subtext,
    marginTop: 8,
    textAlign: 'center',
  },
  headerButton: {
    padding: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryCard: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  successCard: {
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  warningCard: {
    backgroundColor: colors.warning + '15',
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  infoCard: {
    backgroundColor: colors.info + '15',
    borderWidth: 1,
    borderColor: colors.info + '30',
  },
  statLabel: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  insightSubtext: {
    fontSize: 14,
    color: colors.subtext,
  },
  insightNoData: {
    fontSize: 14,
    color: colors.mediumGray,
    fontStyle: 'italic',
  },
  topItemsList: {
    gap: 8,
  },
  topItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topItemRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  topItemDetails: {
    fontSize: 14,
    color: colors.subtext,
  },
  topItemWears: {
    alignItems: 'flex-end',
  },
  topItemWearsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  topItemWearsLabel: {
    fontSize: 12,
    color: colors.subtext,
  },
  emptyStateCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 8,
    textAlign: 'center',
  },
});
