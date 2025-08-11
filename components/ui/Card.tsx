import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, tokens } from '@/constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  glass?: boolean;
  padding?: keyof typeof tokens.spacing;
}

export default function Card({ 
  children, 
  style, 
  elevated = false, 
  glass = false,
  padding = 'md'
}: CardProps) {
  return (
    <View 
      style={[
        styles.card,
        elevated && styles.elevated,
        glass && styles.glass,
        { padding: tokens.spacing[padding] },
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: tokens.radius.lg,
    ...tokens.shadow.sm,
  },
  elevated: {
    backgroundColor: colors.cardElevated,
    ...tokens.shadow.md,
  },
  glass: {
    backgroundColor: colors.glass,
    ...tokens.shadow.lg,
  },
});