import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors, tokens } from '@/constants/colors';
import Typography from './Typography';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export default function SegmentedControl({ options, selectedIndex, onSelectIndex }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <Pressable
          key={option}
          style={[
            styles.segment,
            index === selectedIndex && styles.segmentActive,
          ]}
          onPress={() => onSelectIndex(index)}
        >
          <Typography
            variant="body"
            color={index === selectedIndex ? colors.text : colors.textSecondary}
            style={[
              styles.segmentText,
              index === selectedIndex && styles.segmentTextActive,
            ]}
          >
            {option}
          </Typography>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: tokens.radius.lg,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.background,
    ...tokens.shadow.sm,
  },
  segmentText: {
    fontSize: 14,
  },
  segmentTextActive: {
    fontWeight: '600',
  },
});
