import React from 'react';
import { StyleSheet, View, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Scan, Sparkles } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import Typography from '@/components/ui/Typography';
import Card from '@/components/ui/Card';
import TemperatureBadge from '@/components/ui/TemperatureBadge';
import OutfitCard from '@/components/ui/OutfitCard';
import Carousel from '@/components/ui/Carousel';

const mockOutfits = [
  {
    title: 'Office Chic',
    subtitle: 'Business Meetings',
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
  },
  {
    title: 'Casual Friday',
    subtitle: 'Relaxed Professional',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop',
  },
  {
    title: 'Weekend Vibes',
    subtitle: 'Casual Outings',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  
  const handleScanPress = () => {
    router.push('/add-item');
  };

  const handleWeatherPress = () => {
    router.push('/weather-outfit');
  };

  const handleOutfitPress = (index: number) => {
    router.push('/outfits');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Typography variant=\"h1\" style={styles.greeting}>
                  Welcome, {profile?.displayName?.split(' ')[0] || 'there'}
                </Typography>
                <Typography variant=\"body\" color={colors.textSecondary}>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
              </View>
              <Pressable style={styles.scanButton} onPress={handleScanPress}>
                <Scan size={24} color={colors.background} />
              </Pressable>
            </View>

            {/* Weather Badge */}
            <TemperatureBadge 
              temperature={24}
              onPress={handleWeatherPress}
            />

            {/* AI-Powered Section */}
            <View style={styles.sectionHeader}>
              <Typography variant=\"h2\" style={styles.sectionTitle}>
                AI-powered wardrobe suggestion
              </Typography>
            </View>

            {/* Outfit Carousel */}
            <Carousel onSnapToItem={handleOutfitPress}>
              {mockOutfits.map((outfit, index) => (
                <OutfitCard
                  key={index}
                  title={outfit.title}
                  subtitle={outfit.subtitle}
                  imageUrl={outfit.imageUrl}
                  onPress={() => handleOutfitPress(index)}
                  onFavorite={() => console.log('Favorited:', outfit.title)}
                />
              ))}
            </Carousel>

            {/* Collections Section */}
            <View style={styles.sectionHeader}>
              <Typography variant=\"h3\" style={styles.sectionTitle}>
                Your Collections
              </Typography>
              <Pressable onPress={() => router.push('/wardrobe')}>
                <Typography variant=\"caption\" color={colors.primary}>
                  View All
                </Typography>
              </Pressable>
            </View>

            <View style={styles.collectionsGrid}>
              <Card style={styles.collectionCard}>
                <Typography variant=\"h3\" color={colors.text}>
                  42
                </Typography>
                <Typography variant=\"caption\" color={colors.textSecondary}>
                  Total Items
                </Typography>
              </Card>
              
              <Card style={styles.collectionCard}>
                <Typography variant=\"h3\" color={colors.success}>
                  $2,340
                </Typography>
                <Typography variant=\"caption\" color={colors.textSecondary}>
                  Total Value
                </Typography>
              </Card>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Pressable 
                style={styles.actionButton}
                onPress={() => router.push('/outfits')}
              >
                <Sparkles size={20} color={colors.primary} />
                <Typography variant=\"caption\" color={colors.text} style={styles.actionText}>
                  Generate Outfit
                </Typography>
              </Pressable>
              
              <Pressable 
                style={styles.actionButton}
                onPress={() => router.push('/calendar')}
              >
                <Scan size={20} color={colors.secondary} />
                <Typography variant=\"caption\" color={colors.text} style={styles.actionText}>
                  Plan Outfits
                </Typography>
              </Pressable>
            </View>

          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.xl,
  },
  greeting: {
    marginBottom: tokens.spacing.xs,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadow.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacing.xl,
    marginBottom: tokens.spacing.lg,
  },
  sectionTitle: {
    flex: 1,
  },
  collectionsGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  collectionCard: {
    flex: 1,
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.lg,
    ...tokens.shadow.sm,
  },
  actionText: {
    marginLeft: tokens.spacing.xs,
  },
});