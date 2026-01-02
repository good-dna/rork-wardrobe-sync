import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Bookmark, Plus } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import { useWardrobeStore } from '@/store/wardrobeStore';
import Typography from '@/components/ui/Typography';
import ToggleTabs from '@/components/ui/ToggleTabs';
import ForecastCard from '@/components/ui/ForecastCard';
import ClosetItemCard from '@/components/ui/ClosetItemCard';
import AddItemTile from '@/components/ui/AddItemTile';
import { Item } from '@/types/wardrobe';


const mockForecast = [
  { day: 'Fri', date: 'April 30', temperature: '30°C', weatherIcon: '☀️' },
  { day: 'Sat', date: 'May 1', temperature: '28°C', weatherIcon: '⛅' },
  { day: 'Sun', date: 'May 2', temperature: '26°C', weatherIcon: '🌤️' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { items, getItemsByCategory } = useWardrobeStore();
  const [activeTab, setActiveTab] = useState<string>('Closet');
  
  const location = profile?.locationPreferences?.location?.city || 'Comilla';
  const displayName = profile?.displayName || 'User';
  
  const tops = getItemsByCategory('shirts');
  const pants = getItemsByCategory('pants');
  const shoes = getItemsByCategory('shoes');
  
  const totalItems = items.length;

  const handleAddItem = (category?: string) => {
    router.push('/add-item');
  };

  const handleItemPress = (itemId: string) => {
    router.push(`/item/${itemId}`);
  };

  const renderClosetSection = (title: string, items: Item[]) => (
    <View key={title} style={styles.closetSection}>
      <Typography variant="body" style={styles.sectionTitle}>
        {title}
      </Typography>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.itemsScroll}
      >
        {items.map((item) => (
          <ClosetItemCard
            key={item.id}
            id={item.id}
            title={item.name}
            imageUrl={item.imageUrl}
            wornCount={item.wearCount}
            onPress={() => handleItemPress(item.id)}
          />
        ))}
        <AddItemTile onPress={() => handleAddItem(title.toLowerCase())} />
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Typography variant="h3" color={colors.background}>
                  {displayName.charAt(0).toUpperCase()}
                </Typography>
              </View>
            </View>
            <View>
              <Typography variant="h3" style={styles.greeting}>
                Welcome {displayName}
              </Typography>
              <Pressable onPress={() => router.push('/profile')}>
                <Typography variant="caption" color={colors.primary} style={styles.profileLink}>
                  See your profile
                </Typography>
              </Pressable>
            </View>
          </View>
          <Pressable style={styles.bookmarkButton}>
            <Bookmark size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.locationLeft}>
            <MapPin size={16} color={colors.textSecondary} />
            <Typography variant="body" style={styles.locationText}>
              {location}
            </Typography>
          </View>
          <Pressable onPress={() => router.push('/calendar')}>
            <Typography variant="body" color={colors.primary} style={styles.calendarLink}>
              OOTD Calendar
            </Typography>
          </Pressable>
        </View>

        <View style={styles.forecastSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.forecastScroll}
          >
            {mockForecast.map((day, index) => (
              <ForecastCard
                key={index}
                day={day.day}
                date={day.date}
                temperature={day.temperature}
                weatherIcon={day.weatherIcon}
                onPress={() => router.push('/weather-outfit')}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.toggleSection}>
          <ToggleTabs
            tabs={['Closet', 'Outfit']}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </View>

        {activeTab === 'Closet' ? (
          <View style={styles.closetContent}>
            <View style={styles.closetHeader}>
              <View>
                <Typography variant="h2" style={styles.closetTitle}>
                  Your Closet
                </Typography>
                <Typography variant="caption" color={colors.textSecondary}>
                  {totalItems} items
                </Typography>
              </View>
              <Pressable style={styles.addButton} onPress={() => handleAddItem()}>
                <Plus size={22} color={colors.text} />
              </Pressable>
            </View>

            {renderClosetSection('Tops', tops)}
            {renderClosetSection('Pants', pants)}
            {renderClosetSection('Shoes', shoes)}
          </View>
        ) : (
          <View style={styles.outfitContent}>
            <Typography variant="body" color={colors.textSecondary} style={styles.comingSoon}>
              Outfit view coming soon
            </Typography>
            <Pressable
              style={styles.createOutfitButton}
              onPress={() => router.push('/add-outfit')}
            >
              <Typography variant="body" color={colors.background}>
                Create New Outfit
              </Typography>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  avatarContainer: {
    marginRight: tokens.spacing.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontWeight: '600',
    marginBottom: 2,
  },
  profileLink: {
    fontSize: 12,
  },
  bookmarkButton: {
    padding: tokens.spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  locationText: {
    fontSize: 14,
  },
  calendarLink: {
    fontWeight: '600',
    fontSize: 14,
  },
  forecastSection: {
    marginBottom: tokens.spacing.lg,
  },
  forecastScroll: {
    paddingRight: tokens.spacing.lg,
  },
  toggleSection: {
    marginBottom: tokens.spacing.lg,
  },
  closetContent: {
    gap: tokens.spacing.xl,
  },
  closetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.lg,
  },
  closetTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closetSection: {
    marginBottom: tokens.spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: tokens.spacing.md,
  },
  itemsScroll: {
    paddingRight: tokens.spacing.lg,
  },
  outfitContent: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xxl,
  },
  comingSoon: {
    marginBottom: tokens.spacing.lg,
  },
  createOutfitButton: {
    backgroundColor: colors.primary,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.xl,
    borderRadius: tokens.radius.lg,
    ...tokens.shadow.md,
  },
});