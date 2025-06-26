import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Sparkles, TrendingUp, CloudSun, AlertTriangle, Clock, Droplets } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { useUserStore } from '@/store/userStore';
import ItemCard from '@/components/ItemCard';
import OutfitCard from '@/components/OutfitCard';
import StatsCard from '@/components/StatsCard';
import OutfitGenerator from '@/components/OutfitGenerator';

export default function HomeScreen() {
  const router = useRouter();
  const items = useWardrobeStore((state) => state.items);
  const outfits = useWardrobeStore((state) => state.outfits);
  const getMostWornItems = useWardrobeStore((state) => state.getMostWornItems);
  const getTotalWardrobeValue = useWardrobeStore((state) => state.getTotalWardrobeValue);
  const getItemsNeedingWash = useWardrobeStore((state) => state.getItemsNeedingWash);
  const getItemsNotWornSince = useWardrobeStore((state) => state.getItemsNotWornSince);
  const getWearCountByTimeframe = useWardrobeStore((state) => state.getWearCountByTimeframe);
  const profile = useUserStore((state) => state.profile);
  
  // Use memoized values to avoid re-renders
  const recentItems = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
      .slice(0, 5);
  }, [items]);
  
  const mostWornItems = useMemo(() => {
    return getMostWornItems(3);
  }, [getMostWornItems, items]);
  
  const totalValue = useMemo(() => {
    return getTotalWardrobeValue();
  }, [getTotalWardrobeValue, items]);
  
  const itemsNeedingWash = useMemo(() => {
    return getItemsNeedingWash();
  }, [getItemsNeedingWash, items]);
  
  const itemsNotWornIn60Days = useMemo(() => {
    return getItemsNotWornSince(60);
  }, [getItemsNotWornSince, items]);
  
  const weeklyWearCount = useMemo(() => {
    return getWearCountByTimeframe(7);
  }, [getWearCountByTimeframe, items]);
  
  const totalWeeklyWears = useMemo(() => {
    return weeklyWearCount.reduce((sum, day) => sum + day.count, 0);
  }, [weeklyWearCount]);
  
  const handleAddItem = () => {
    router.push('/add-item');
  };
  
  const handleWeatherOutfit = () => {
    router.push('/weather-outfit');
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {profile?.displayName.split(' ')[0] || 'there'}
          </Text>
          <Text style={styles.subGreeting}>Your digital wardrobe</Text>
        </View>
        <Pressable style={styles.addButton} onPress={handleAddItem}>
          <Plus size={20} color="white" />
        </Pressable>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatsCard 
            title="Total Items" 
            value={items.length} 
            subtitle="in your wardrobe" 
          />
          <StatsCard 
            title="Total Value" 
            value={`$${totalValue.toFixed(2)}`} 
            subtitle="estimated worth" 
            color={colors.success}
          />
        </View>
        <View style={styles.statsRow}>
          <StatsCard 
            title="Weekly Wears" 
            value={totalWeeklyWears} 
            subtitle="items worn this week" 
            color={colors.info}
          />
          <StatsCard 
            title="Needs Wash" 
            value={itemsNeedingWash.length} 
            subtitle="items to clean" 
            color={colors.warning}
          />
        </View>
      </View>
      
      {itemsNeedingWash.length > 0 && (
        <View style={styles.alertSection}>
          <View style={styles.alertHeader}>
            <AlertTriangle size={18} color={colors.warning} />
            <Text style={styles.alertTitle}>Items Needing Wash</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {itemsNeedingWash.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.horizontalItem}>
                <ItemCard item={item} compact />
                <Pressable 
                  style={styles.washButton}
                  onPress={() => router.push('/calendar')}
                >
                  <Droplets size={14} color="white" />
                  <Text style={styles.washButtonText}>Log Wash</Text>
                </Pressable>
              </View>
            ))}
            {itemsNeedingWash.length > 3 && (
              <Pressable 
                style={styles.seeMoreButton}
                onPress={() => router.push('/calendar')}
              >
                <Text style={styles.seeMoreButtonText}>
                  +{itemsNeedingWash.length - 3} more
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      )}
      
      <Pressable style={styles.weatherOutfitButton} onPress={handleWeatherOutfit}>
        <View style={styles.weatherOutfitContent}>
          <CloudSun size={24} color="white" style={styles.weatherIcon} />
          <View>
            <Text style={styles.weatherOutfitTitle}>Weather-Based Outfit</Text>
            <Text style={styles.weatherOutfitSubtitle}>Get recommendations for today's weather</Text>
          </View>
        </View>
      </Pressable>
      
      <View style={styles.weeklyActivityContainer}>
        <Text style={styles.weeklyActivityTitle}>Weekly Activity</Text>
        <View style={styles.weeklyActivityChart}>
          {weeklyWearCount.map((day, index) => (
            <View key={index} style={styles.weeklyActivityBar}>
              <View 
                style={[
                  styles.weeklyActivityBarFill, 
                  { 
                    height: day.count > 0 ? `${Math.min(day.count * 20, 100)}%` : 0,
                    backgroundColor: day.date === new Date().toISOString().split('T')[0] 
                      ? colors.primary 
                      : colors.lightGray
                  }
                ]} 
              />
              <Text style={styles.weeklyActivityBarLabel}>
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      <OutfitGenerator />
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Added</Text>
          <Pressable onPress={() => router.push('/wardrobe')}>
            <Text style={styles.seeAllText}>See All</Text>
          </Pressable>
        </View>
        
        {recentItems.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {recentItems.map((item) => (
              <View key={item.id} style={styles.horizontalItem}>
                <ItemCard item={item} compact />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No items added yet</Text>
          </View>
        )}
      </View>
      
      {itemsNotWornIn60Days.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Not Worn in 60+ Days</Text>
              <Clock size={16} color={colors.warning} style={{ marginLeft: 6 }} />
            </View>
            <Pressable onPress={() => router.push('/analytics')}>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {itemsNotWornIn60Days.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.horizontalItem}>
                <ItemCard item={item} compact />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Most Worn</Text>
            <TrendingUp size={16} color={colors.primary} style={{ marginLeft: 6 }} />
          </View>
        </View>
        
        {mostWornItems.length > 0 ? (
          mostWornItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No wear data available</Text>
          </View>
        )}
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Outfit Ideas</Text>
            <Sparkles size={16} color={colors.primary} style={{ marginLeft: 6 }} />
          </View>
          <Pressable onPress={() => router.push('/outfits')}>
            <Text style={styles.seeAllText}>See All</Text>
          </Pressable>
        </View>
        
        {outfits.length > 0 ? (
          outfits.slice(0, 2).map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No outfits created yet</Text>
          </View>
        )}
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
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subGreeting: {
    fontSize: 16,
    color: colors.subtext,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  alertSection: {
    backgroundColor: colors.warning + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 8,
  },
  washButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: colors.info,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  washButtonText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  seeMoreButton: {
    height: 120,
    width: 80,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  seeMoreButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  weatherOutfitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  weatherOutfitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    marginRight: 12,
  },
  weatherOutfitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  weatherOutfitSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  weeklyActivityContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  weeklyActivityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  weeklyActivityChart: {
    flexDirection: 'row',
    height: 100,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  weeklyActivityBar: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  weeklyActivityBarFill: {
    width: 8,
    borderRadius: 4,
  },
  weeklyActivityBarLabel: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
  },
  horizontalList: {
    paddingBottom: 8,
  },
  horizontalItem: {
    marginRight: 12,
    position: 'relative',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.subtext,
  },
});