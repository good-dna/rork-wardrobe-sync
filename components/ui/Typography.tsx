import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors, tokens } from '@/constants/colors';

interface TypographyProps {
  children: React.ReactNode;
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small';
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
}

export default function Typography({ 
  children, 
  variant = 'body', 
  color = colors.text,
  style,
  numberOfLines
}: TypographyProps) {
  return (
    <Text 
      style={[
        styles[variant],
        { color },
        style
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  display: tokens.typography.display,
  h1: tokens.typography.h1,
  h2: tokens.typography.h2,
  h3: tokens.typography.h3,
  body: tokens.typography.body,
  caption: tokens.typography.caption,
  small: tokens.typography.small,
});