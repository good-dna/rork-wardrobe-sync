import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Calendar } from 'lucide-react-native';
import { colors } from '@/constants/colors';

const { width } = Dimensions.get('window');

export default function TrendsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week');

  const periods = [
    { id: 'week', label: '7D' },
    { id: 'month', label: '30D' },
    { id: 'quarter', label: '3M' },
    { id: 'year', label: '1Y' },
  ];

  const trendingBrands = [
    { name: 'Nike', change: '+12.5%', isUp: true, volume: '2.4K' },
    { name: 'Jordan', change: '+8.3%', isUp: true, volume: '1.8K' },
    { name: 'Adidas', change: '-3.2%', isUp: false, volume: '1.2K' },
    { name: 'New Balance', change: '+15.7%', isUp: true, volume: '890' },
    { name: 'Converse', change: '+2.1%', isUp: true, volume: '650' },
  ];

  const hotReleases = [
    { name: 'Air Jordan 1 Chicago', price: '$2,500', change: '+25%' },
    { name: 'Travis Scott x Nike', price: '$1,800', change: '+18%' },
    { name: 'Yeezy 350 Zebra', price: '$300', change: '+12%' },
    { name: 'Dunk Low Panda', price: '$120', change: '+8%' },
  ];

  const marketStats = [
    { label: 'Market Cap', value: '$6.2B', change: '+5.2%', isUp: true },
    { label: 'Daily Volume', value: '$45M', change: '+12.8%', isUp: true },
    { label: 'Active Traders', value: '125K', change: '+3.4%', isUp: true },
    { label: 'Avg. Price', value: '$180', change: '-2.1%', isUp: false },
  ];

  const categoryTrends = [
    { category: 'Basketball', percentage: 35, color: colors.primary },
    { category: 'Lifestyle', percentage: 28, color: colors.secondary },
    { category: 'Running', percentage: 20, color: colors.success },
    { category: 'Skateboarding', percentage: 12, color: colors.warning },
    { category: 'Other', percentage: 5, color: colors.error },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Market Trends</Text>
        <Text style={styles.subtitle}>Real-time sneaker market insights</Text>
      </View>

      <View style={styles.periodSelector}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodContent}
        >
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.activePeriod
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period.id && styles.activePeriodText
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          {marketStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <View style={styles.statChange}>
                {stat.isUp ? (
                  <TrendingUp size={12} color={colors.success} />
                ) : (
                  <TrendingDown size={12} color={colors.error} />
                )}
                <Text style={[
                  styles.statChangeText,
                  { color: stat.isUp ? colors.success : colors.error }
                ]}>
                  {stat.change}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Trending Brands</Text>
          </View>
          <View style={styles.brandsContainer}>
            {trendingBrands.map((brand, index) => (
              <View key={index} style={styles.brandRow}>
                <View style={styles.brandInfo}>
                  <Text style={styles.brandName}>{brand.name}</Text>
                  <Text style={styles.brandVolume}>{brand.volume} trades</Text>
                </View>
                <View style={styles.brandStats}>
                  <View style={[
                    styles.changeContainer,
                    { backgroundColor: brand.isUp ? colors.success + '20' : colors.error + '20' }
                  ]}>
                    {brand.isUp ? (
                      <TrendingUp size={14} color={colors.success} />
                    ) : (
                      <TrendingDown size={14} color={colors.error} />
                    )}
                    <Text style={[
                      styles.changeText,
                      { color: brand.isUp ? colors.success : colors.error }
                    ]}>
                      {brand.change}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Hot Releases</Text>
          </View>
          <View style={styles.releasesContainer}>
            {hotReleases.map((release, index) => (
              <View key={index} style={styles.releaseRow}>
                <View style={styles.releaseInfo}>
                  <Text style={styles.releaseName}>{release.name}</Text>
                  <Text style={styles.releasePrice}>{release.price}</Text>
                </View>
                <View style={styles.releaseChange}>
                  <Text style={styles.releaseChangeText}>{release.change}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PieChart size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
          </View>
          <View style={styles.categoryContainer}>
            {categoryTrends.map((category, index) => (
              <View key={index} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                  <Text style={styles.categoryName}>{category.category}</Text>
                </View>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
                  <View style={styles.categoryBar}>
                    <View 
                      style={[
                        styles.categoryBarFill,
                        { 
                          width: `${category.percentage}%`,
                          backgroundColor: category.color 
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
          </View>
          <View style={styles.eventsContainer}>
            <View style={styles.eventCard}>
              <Text style={styles.eventTitle}>Nike SNKRS Day</Text>
              <Text style={styles.eventDate}>March 15, 2024</Text>
              <Text style={styles.eventDescription}>
                Special releases and exclusive drops
              </Text>
            </View>
            <View style={styles.eventCard}>
              <Text style={styles.eventTitle}>Adidas Yeezy Drop</Text>
              <Text style={styles.eventDate}>March 22, 2024</Text>
              <Text style={styles.eventDescription}>
                New colorways expected to release
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.mediumGray,
  },
  periodSelector: {
    marginBottom: 20,
  },
  periodContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.card,
  },
  activePeriod: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mediumGray,
  },
  activePeriodText: {
    color: colors.background,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: colors.mediumGray,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  brandsContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  brandVolume: {
    fontSize: 12,
    color: colors.mediumGray,
  },
  brandStats: {
    alignItems: 'flex-end',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  releasesContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  releaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  releaseInfo: {
    flex: 1,
  },
  releaseName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  releasePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  releaseChange: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  releaseChangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  categoryContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  categoryStats: {
    alignItems: 'flex-end',
    flex: 1,
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  categoryBar: {
    width: 80,
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  eventsContainer: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.mediumGray,
    lineHeight: 20,
  },
});