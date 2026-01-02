import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import Typography from './Typography';

interface AddItemCardProps {
  onPress?: () => void;
}

export default function AddItemCard({ onPress }: AddItemCardProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Plus size={32} color={colors.textSecondary} strokeWidth={2} />
        </View>
        <Typography variant="caption" color={colors.textSecondary} style={styles.text}>
          Add Item
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 200,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: tokens.radius.lg,
    marginRight: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: tokens.spacing.xs,
  },
  text: {
    fontWeight: '500',
  },
});
