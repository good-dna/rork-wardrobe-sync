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


const aiSuggestionOptions = [
  {
    id: 'casual',
    title: 'Casual Day',
    subtitle: 'Relaxed and comfortable',
    icon: '👕',
    color: colors.primary,
  },
  {
    id: 'work',
    title: 'Work Professional',
    subtitle: 'Business meetings',
    icon: '👔',
    color: colors.secondary,
  },
  {
    id: 'formal',
    title: 'Formal Event',
    subtitle: 'Special occasions',
    icon: '🤵',
    color: colors.success,
  },
  {
    id: 'weather',
    title: 'Weather-Based',
    subtitle: 'Perfect for today',
    icon: '🌤️',
    color: '#34C759',
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

  const handleAIRecommendationPress = () => {
    router.push('/ai-recommendations');
  };

  const handleQuickAIPress = (occasionId: string) => {
    router.push(`/ai-recommendations?occasion=${occasionId}`);
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
            <View style={styles.header}>
              <View>
                <Typography variant="h1" style={styles.greeting}>
                  Welcome, {profile?.displayName?.split(' ')[0] || 'there'}
                </Typography>
                <Typography variant="body" color={colors.textSecondary}>
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

            <TemperatureBadge 
              temperature={24}
              onPress={handleWeatherPress}
            />

            <View style={styles.sectionHeader}>
              <Typography variant="h2" style={styles.sectionTitle}>
                AI-powered wardrobe suggestion
              </Typography>
            </View>

            <View style={styles.aiOptionsGrid}>
              {aiSuggestionOptions.map((option) => (
                <Pressable
                  key={option.id}
                  style={styles.aiOptionCard}
                  onPress={() => handleQuickAIPress(option.id)}
                >
                  <View style={[styles.aiOptionIcon, { backgroundColor: option.color + '20' }]}>
                    <Typography variant="h3" style={styles.aiOptionEmoji}>
                      {option.icon}
                    </Typography>
                  </View>
                  <Typography variant="body" style={styles.aiOptionTitle}>
                    {option.title}
                  </Typography>
                  <Typography variant="caption" color={colors.textSecondary} style={styles.aiOptionSubtitle}>
                    {option.subtitle}
                  </Typography>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.viewAllAIButton} onPress={handleAIRecommendationPress}>
              <Sparkles size={18} color={colors.primary} />
              <Typography variant="body" color={colors.primary} style={styles.viewAllAIText}>
                View All AI Options
              </Typography>
            </Pressable>

            <View style={styles.sectionHeader}>
              <Typography variant="h3" style={styles.sectionTitle}>
                Your Collections
              </Typography>
              <Pressable onPress={() => router.push('/wardrobe')}>
                <Typography variant="caption" color={colors.primary}>
                  View All
                </Typography>
              </Pressable>
            </View>

            <View style={styles.collectionsGrid}>
              <Card style={styles.collectionCard}>
                <Typography variant="h3" color={colors.text}>
                  42
                </Typography>
                <Typography variant="caption" color={colors.textSecondary}>
                  Total Items
                </Typography>
              </Card>
              
              <Card style={styles.collectionCard}>
                <Typography variant="h3" color={colors.success}>
                  $2,340
                </Typography>
                <Typography variant="caption" color={colors.textSecondary}>
                  Total Value
                </Typography>
              </Card>
            </View>

            <View style={styles.quickActions}>
              <Pressable 
                style={styles.actionButton}
                onPress={() => router.push('/outfits')}
              >
                <Sparkles size={20} color={colors.primary} />
                <Typography variant="caption" color={colors.text} style={styles.actionText}>
                  Generate Outfit
                </Typography>
              </Pressable>
              
              <Pressable 
                style={styles.actionButton}
                onPress={() => router.push('/calendar')}
              >
                <Scan size={20} color={colors.secondary} />
                <Typography variant="caption" color={colors.text} style={styles.actionText}>
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
  aiOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  aiOptionCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    alignItems: 'center',
    ...tokens.shadow.sm,
  },
  aiOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  aiOptionEmoji: {
    fontSize: 20,
  },
  aiOptionTitle: {
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
    fontWeight: '600',
  },
  aiOptionSubtitle: {
    textAlign: 'center',
    fontSize: 12,
  },
  viewAllAIButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    ...tokens.shadow.sm,
  },
  viewAllAIText: {
    marginLeft: tokens.spacing.sm,
    fontWeight: '600',
  },
});