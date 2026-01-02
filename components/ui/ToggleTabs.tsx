import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Typography from './Typography';
import { colors, tokens } from '@/constants/colors';

interface ToggleTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function ToggleTabs({ tabs, activeTab, onTabChange }: ToggleTabsProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <Pressable
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && styles.activeTab,
          ]}
          onPress={() => onTabChange(tab)}
        >
          <Typography
            variant="body"
            color={activeTab === tab ? colors.text : colors.textSecondary}
            style={styles.tabText}
          >
            {tab}
          </Typography>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: tokens.radius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.background,
    ...tokens.shadow.sm,
  },
  tabText: {
    fontWeight: '600',
  },
});
