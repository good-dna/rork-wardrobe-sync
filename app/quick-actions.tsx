import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Plus, Shirt, Calendar } from 'lucide-react-native';
import Typography from '@/components/ui/Typography';
import { colors, tokens } from '@/constants/colors';

export default function QuickActionsModal() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  const handleAction = (route: string) => {
    router.back();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Typography variant="h2" style={styles.title}>
            Quick Actions
          </Typography>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleAction('/add-item')}
          >
            <View style={styles.actionIcon}>
              <Plus size={24} color={colors.primary} />
            </View>
            <Typography variant="body" style={styles.actionText}>
              Add Item
            </Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              Upload a new wardrobe item
            </Typography>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => handleAction('/add-outfit')}
          >
            <View style={styles.actionIcon}>
              <Shirt size={24} color={colors.primary} />
            </View>
            <Typography variant="body" style={styles.actionText}>
              Add Outfit
            </Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              Create a new outfit combination
            </Typography>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => handleAction('/calendar')}
          >
            <View style={styles.actionIcon}>
              <Calendar size={24} color={colors.primary} />
            </View>
            <Typography variant="body" style={styles.actionText}>
              Plan OOTD
            </Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              Schedule an outfit for a date
            </Typography>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
    paddingHorizontal: tokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  title: {
    fontWeight: '700',
  },
  closeButton: {
    padding: tokens.spacing.xs,
  },
  actions: {
    gap: tokens.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  actionText: {
    fontWeight: '600',
    flex: 1,
  },
});
