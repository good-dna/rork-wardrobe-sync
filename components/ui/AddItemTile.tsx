import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import Typography from './Typography';
import { colors, tokens } from '@/constants/colors';

interface AddItemTileProps {
  onPress?: () => void;
}

export default function AddItemTile({ onPress }: AddItemTileProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Plus size={28} color={colors.textSecondary} strokeWidth={2} />
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
    backgroundColor: colors.background,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginRight: tokens.spacing.md,
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: tokens.spacing.xs,
  },
  text: {
    fontWeight: '600',
  },
});
