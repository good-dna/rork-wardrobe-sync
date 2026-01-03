import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, tokens } from '@/constants/colors';
import { useQuery } from '@tanstack/react-query';
import { Shirt, TrendingUp, User as UserIcon, LogOut } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: itemsCount, isLoading: itemsLoading } = useQuery({
    queryKey: ['items-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const handleLogout = async () => {
    await signOut();
    router.replace('/launch' as any);
  };

  if (profileLoading || itemsLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const memberSince = profile?.member_since
    ? new Date(profile.member_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.nameText}>
            {profile?.full_name || user?.email?.split('@')[0] || 'User'}
          </Text>
        </View>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Shirt size={24} color={colors.primary} />
          </View>
          <Text style={styles.statValue}>{itemsCount}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <UserIcon size={24} color={colors.secondary} />
          </View>
          <Text style={styles.statValue}>{memberSince}</Text>
          <Text style={styles.statLabel}>Member Since</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <Pressable
          style={styles.actionCard}
          onPress={() => router.push('/closet-item/new' as any)}
        >
          <View style={styles.actionIcon}>
            <Shirt size={24} color={colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Add New Item</Text>
            <Text style={styles.actionSubtitle}>Add clothing to your closet</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/analytics' as any)}
        >
          <View style={styles.actionIcon}>
            <TrendingUp size={24} color={colors.secondary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>View Analytics</Text>
            <Text style={styles.actionSubtitle}>See your closet statistics</Text>
          </View>
        </Pressable>
      </View>

      {profile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Info</Text>
          <View style={styles.infoCard}>
            {profile.city && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>
                  {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
            {profile.age && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Age:</Text>
                <Text style={styles.infoValue}>{profile.age}</Text>
              </View>
            )}
            {profile.favorite_category && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Favorite Category:</Text>
                <Text style={styles.infoValue}>{profile.favorite_category}</Text>
              </View>
            )}
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    padding: tokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  logoutButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
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
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
