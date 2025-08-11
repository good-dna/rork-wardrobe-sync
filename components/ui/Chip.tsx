import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { colors, tokens } from '@/constants/colors';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'filled';
}

export default function Chip({ 
  label, 
  active = false, 
  onPress,
  icon,
  variant = 'default'
}: ChipProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getChipStyle = () => {
    if (active) {
      return variant === 'outline' ? styles.chipActiveOutline : styles.chipActive;
    }
    return variant === 'outline' ? styles.chipOutline : styles.chip;
  };

  const getTextStyle = () => {
    if (active) {
      return variant === 'outline' ? styles.chipTextActiveOutline : styles.chipTextActive;
    }
    return variant === 'outline' ? styles.chipTextOutline : styles.chipText;
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[getChipStyle()]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={getTextStyle()}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipActiveOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipText: {
    ...tokens.typography.caption,
    color: colors.textSecondary,
  },
  chipTextOutline: {
    ...tokens.typography.caption,
    color: colors.textSecondary,
  },
  chipTextActive: {
    ...tokens.typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  chipTextActiveOutline: {
    ...tokens.typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  icon: {
    marginRight: tokens.spacing.xs,
  },
});