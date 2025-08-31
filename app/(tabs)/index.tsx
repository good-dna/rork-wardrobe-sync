import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, TrendingUp, Heart, Calendar } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { router } from 'expo-router';
import { mockSneakers, mockUpcomingReleases } from '@/constants/sneakerData';

export default function HomeScreen() {
  const quickActions = [
    {
      title: 'Add Sneaker',
      subtitle: 'Add to collection',
      icon: Plus,
      color: colors.primary,
      route: '/(tabs)/add',
    },
    {
      title: 'Discover',
      subtitle: 'New releases',
      icon: Search,
      color: colors.secondary,
      route: '/(tabs)/discover',
    },
    {
      title: 'Trends',
      subtitle: 'Market insights',
      icon: TrendingUp,
      color: colors.success,
      route: '/(tabs)/trends',
    },
    {
      title: 'Wishlist',
      subtitle: 'Saved items',
      icon: Heart,
      color: colors.error,
      route: '/(tabs)/wishlist',
    },
  ];

  const collectionValue = mockSneakers.reduce((sum, sneaker) => 
    sum + (sneaker.currentPrice || sneaker.retailPrice), 0
  );

  const stats = [
    { label: 'Pairs', value: mockSneakers.length.toString(), color: colors.primary },
    { label: 'Brands', value: new Set(mockSneakers.map(s => s.brand)).size.toString(), color: colors.secondary },
    { label: 'Grails', value: mockSneakers.filter(s => s.rarity === 'grail').length.toString(), color: colors.warning },
    { label: 'Value', value: `$${(collectionValue / 1000).toFixed(1)}K`, color: colors.success },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.title}>Your Sneaker Collection</Text>
        </View>

        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.actionCard}
                  onPress={() => router.push(action.route as any)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <IconComponent size={24} color={colors.background} />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Additions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/collection')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentContainer}
          >
            {mockSneakers.slice(0, 3).map((sneaker) => (
              <TouchableOpacity key={sneaker.id} style={styles.recentCard}>
                <Image source={{ uri: sneaker.images[0] }} style={styles.recentImage} />
                <View style={styles.recentContent}>
                  <Text style={styles.recentBrand}>{sneaker.brand}</Text>
                  <Text style={styles.recentName} numberOfLines={2}>{sneaker.name}</Text>
                  <Text style={styles.recentPrice}>
                    {formatPrice(sneaker.currentPrice || sneaker.retailPrice)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Releases</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/discover')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.upcomingContainer}>
            {mockUpcomingReleases.slice(0, 2).map((release) => (
              <TouchableOpacity key={release.id} style={styles.upcomingCard}>
                <Image source={{ uri: release.images[0] }} style={styles.upcomingImage} />
                <View style={styles.upcomingContent}>
                  <View style={styles.upcomingHeader}>
                    <Text style={styles.upcomingBrand}>{release.brand}</Text>
                    <View style={styles.upcomingDateBadge}>
                      <Calendar size={10} color={colors.primary} />
                      <Text style={styles.upcomingDateText}>
                        {formatDate(release.releaseDate)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.upcomingName} numberOfLines={1}>
                    {release.name}
                  </Text>
                  <Text style={styles.upcomingColorway}>{release.colorway}</Text>
                  <Text style={styles.upcomingPrice}>
                    {formatPrice(release.retailPrice)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
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
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.mediumGray,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.mediumGray,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.mediumGray,
    textAlign: 'center',
  },
  recentContainer: {
    paddingLeft: 20,
    gap: 16,
  },
  recentCard: {
    width: 160,
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentImage: {
    width: '100%',
    height: 120,
  },
  recentContent: {
    padding: 12,
  },
  recentBrand: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  recentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  upcomingContainer: {
    gap: 12,
  },
  upcomingCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  upcomingImage: {
    width: 100,
    height: 100,
  },
  upcomingContent: {
    flex: 1,
    padding: 16,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  upcomingBrand: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  upcomingDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  upcomingDateText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  upcomingName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  upcomingColorway: {
    fontSize: 12,
    color: colors.mediumGray,
    marginBottom: 8,
  },
  upcomingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});