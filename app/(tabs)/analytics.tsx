import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, tokens } from '@/constants/colors';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Award, Package } from 'lucide-react-native';

interface AnalyticsData {
  total_items: number;
  total_purchase_value: number;
  total_estimated_value: number;
  total_wears: number;
  top_brand: string | null;
  top_color: string | null;
  top_category: string | null;
  brands_count: number;
  categories_count: number;
  average_purchase_price: number;
  average_estimated_value: number;
}

export default function AnalyticsScreen() {
  const { user } = useAuth();

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.rpc('get_closet_analytics', {
        p_user_id: user.id,
      });
      
      if (error) {
        console.error('Analytics error:', error);
        throw error;
      }
      
      return data as AnalyticsData;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading analytics</Text>
        <Text style={styles.errorSubtext}>
          {error instanceof Error ? error.message : 'Please try again later'}
        </Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Closet Analytics</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.grid}>
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Package size={24} color={colors.primary} />
            </View>
            <Text style={styles.cardValue}>{analytics.total_items}</Text>
            <Text style={styles.cardLabel}>Total Items</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <TrendingUp size={24} color={colors.secondary} />
            </View>
            <Text style={styles.cardValue}>{analytics.total_wears}</Text>
            <Text style={styles.cardLabel}>Total Wears</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Valuation</Text>
        <View style={styles.valuationCard}>
          <View style={styles.valuationRow}>
            <DollarSign size={20} color={colors.success} />
            <Text style={styles.valuationLabel}>Total Purchase Value</Text>
          </View>
          <Text style={styles.valuationValue}>
            ${analytics.total_purchase_value.toFixed(2)}
          </Text>
        </View>

        <View style={styles.valuationCard}>
          <View style={styles.valuationRow}>
            <DollarSign size={20} color={colors.primary} />
            <Text style={styles.valuationLabel}>Total Estimated Value</Text>
          </View>
          <Text style={styles.valuationValue}>
            ${analytics.total_estimated_value.toFixed(2)}
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Avg Purchase</Text>
            <Text style={styles.cardValue}>
              ${analytics.average_purchase_price.toFixed(0)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Avg Value</Text>
            <Text style={styles.cardValue}>
              ${analytics.average_estimated_value.toFixed(0)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Insights</Text>
        
        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Award size={20} color={colors.primary} />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Top Brand</Text>
            <Text style={styles.insightValue}>
              {analytics.top_brand || 'No brand data yet'}
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Award size={20} color={colors.secondary} />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Top Color</Text>
            <Text style={styles.insightValue}>
              {analytics.top_color || 'No color data yet'}
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Award size={20} color={colors.success} />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Top Category</Text>
            <Text style={styles.insightValue}>
              {analytics.top_category || 'No category data yet'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diversity</Text>
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{analytics.brands_count}</Text>
            <Text style={styles.cardLabel}>Unique Brands</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardValue}>{analytics.categories_count}</Text>
            <Text style={styles.cardLabel}>Categories</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: tokens.spacing.xl,
  },
  content: {
    padding: tokens.spacing.md,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: tokens.spacing.lg,
  },
  section: {
    marginBottom: tokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: tokens.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  valuationCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  valuationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  valuationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  valuationValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  loadingText: {
    marginTop: tokens.spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
