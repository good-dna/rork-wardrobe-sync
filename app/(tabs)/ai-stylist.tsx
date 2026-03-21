import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Wand2, Sparkles, Cloud, Calendar, ShoppingBag } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';

const OPTIONS = [
  {
    id: 'casual',
    title: 'Casual Day',
    subtitle: 'Relaxed everyday look',
    icon: <Sparkles size={28} color={colors.primary} />,
    route: '/ai-recommendations?occasion=casual',
  },
  {
    id: 'work',
    title: 'Work Professional',
    subtitle: 'Business meetings & office',
    icon: <ShoppingBag size={28} color={colors.secondary} />,
    route: '/ai-recommendations?occasion=work',
  },
  {
    id: 'weather',
    title: 'Weather-Based',
    subtitle: "Perfect for today's forecast",
    icon: <Cloud size={28} color={colors.info} />,
    route: '/ai-recommendations?occasion=weather',
  },
  {
    id: 'formal',
    title: 'Formal Event',
    subtitle: 'Special occasions',
    icon: <Wand2 size={28} color={colors.success} />,
    route: '/ai-recommendations?occasion=formal',
  },
  {
    id: 'evening',
    title: 'Evening Out',
    subtitle: 'Dinner & social events',
    icon: <Sparkles size={28} color={colors.warning} />,
    route: '/ai-recommendations?occasion=evening',
  },
  {
    id: 'athletic',
    title: 'Active Wear',
    subtitle: 'Gym & sports activities',
    icon: <Sparkles size={28} color={colors.error} />,
    route: '/ai-recommendations?occasion=athletic',
  },
];

export default function AIStylistScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Wand2 size={28} color={colors.primary} />
          <Text style={s.title}>AI Stylist</Text>
        </View>
        <Text style={s.subtitle}>Choose an occasion and let AI build the perfect outfit from your wardrobe</Text>

        <View style={s.grid}>
          {OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              style={s.card}
              onPress={() => router.push(opt.route as any)}
            >
              <View style={s.cardIcon}>{opt.icon}</View>
              <Text style={s.cardTitle}>{opt.title}</Text>
              <Text style={s.cardSub}>{opt.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: tokens.spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: tokens.spacing.sm },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: tokens.spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%', backgroundColor: colors.card,
    borderRadius: tokens.radius.xl, padding: tokens.spacing.lg,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  cardIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center', marginBottom: tokens.spacing.md,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 4 },
  cardSub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
});
