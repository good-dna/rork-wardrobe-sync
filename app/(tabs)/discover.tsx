import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, TrendingUp, Star, ExternalLink } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { mockUpcomingReleases, mockBrands } from '@/constants/sneakerData';

export default function DiscoverScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('upcoming');

  const categories = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'trending', label: 'Trending' },
    { id: 'brands', label: 'Brands' },
    { id: 'deals', label: 'Deals' },
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

  const renderUpcoming = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upcoming Releases</Text>
      {mockUpcomingReleases.map((release) => (
        <TouchableOpacity key={release.id} style={styles.releaseCard}>
          <Image source={{ uri: release.images[0] }} style={styles.releaseImage} />
          <View style={styles.releaseContent}>
            <View style={styles.releaseHeader}>
              <Text style={styles.releaseBrand}>{release.brand}</Text>
              <View style={styles.releaseDateBadge}>
                <Calendar size={12} color={colors.primary} />
                <Text style={styles.releaseDateText}>
                  {formatDate(release.releaseDate)}
                </Text>
              </View>
            </View>
            <Text style={styles.releaseName} numberOfLines={2}>
              {release.name}
            </Text>
            <Text style={styles.releaseColorway}>{release.colorway}</Text>
            <View style={styles.releaseFooter}>
              <Text style={styles.releasePrice}>
                {formatPrice(release.retailPrice)}
              </Text>
              {release.raffleLinks && release.raffleLinks.length > 0 && (
                <TouchableOpacity style={styles.raffleButton}>
                  <ExternalLink size={14} color={colors.primary} />
                  <Text style={styles.raffleText}>Raffle</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTrending = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Trending Now</Text>
      <View style={styles.trendingGrid}>
        {mockUpcomingReleases.map((item, index) => (
          <TouchableOpacity key={item.id} style={styles.trendingCard}>
            <Image source={{ uri: item.images[0] }} style={styles.trendingImage} />
            <View style={styles.trendingOverlay}>
              <View style={styles.trendingRank}>
                <Text style={styles.trendingRankText}>#{index + 1}</Text>
              </View>
              <TrendingUp size={16} color={colors.success} />
            </View>
            <View style={styles.trendingContent}>
              <Text style={styles.trendingName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.trendingPrice}>
                {formatPrice(item.retailPrice)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBrands = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Popular Brands</Text>
      <View style={styles.brandsGrid}>
        {mockBrands.map((brand) => (
          <TouchableOpacity key={brand.id} style={styles.brandCard}>
            <Image source={{ uri: brand.logo }} style={styles.brandLogo} />
            <Text style={styles.brandName}>{brand.name}</Text>
            <View style={styles.brandStats}>
              <Star size={12} color={colors.primary} fill={colors.primary} />
              <Text style={styles.brandRating}>4.8</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDeals = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Best Deals</Text>
      <View style={styles.dealsContainer}>
        <Text style={styles.comingSoon}>Coming Soon</Text>
        <Text style={styles.comingSoonSubtext}>
          Price tracking and deal alerts will be available soon
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (selectedCategory) {
      case 'upcoming': return renderUpcoming();
      case 'trending': return renderTrending();
      case 'brands': return renderBrands();
      case 'deals': return renderDeals();
      default: return renderUpcoming();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Latest releases and trends</Text>
      </View>

      <View style={styles.categoryTabs}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.id && styles.activeTab
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[
                styles.categoryTabText,
                selectedCategory === category.id && styles.activeTabText
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
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
  categoryTabs: {
    marginBottom: 20,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mediumGray,
  },
  activeTabText: {
    color: colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  releaseCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  releaseImage: {
    width: 120,
    height: 120,
  },
  releaseContent: {
    flex: 1,
    padding: 16,
  },
  releaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  releaseBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  releaseDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  releaseDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  releaseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  releaseColorway: {
    fontSize: 14,
    color: colors.mediumGray,
    marginBottom: 12,
  },
  releaseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  releasePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  raffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  raffleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  trendingCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trendingImage: {
    width: '100%',
    height: 120,
  },
  trendingOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingRank: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendingRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.background,
  },
  trendingContent: {
    padding: 12,
  },
  trendingName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  trendingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  brandCard: {
    width: '30%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  brandStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandRating: {
    fontSize: 12,
    color: colors.mediumGray,
  },
  dealsContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  comingSoon: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: colors.mediumGray,
    textAlign: 'center',
  },
});