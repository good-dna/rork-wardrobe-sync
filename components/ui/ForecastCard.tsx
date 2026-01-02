import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Calendar } from 'lucide-react-native';
import Typography from './Typography';
import { colors, tokens } from '@/constants/colors';

interface ForecastCardProps {
  day: string;
  date: string;
  temperature: string;
  weatherIcon: string;
  onPress?: () => void;
}

export default function ForecastCard({ day, date, temperature, weatherIcon, onPress }: ForecastCardProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Typography variant="caption" color={colors.textSecondary} style={styles.dayText}>
            {day}
          </Typography>
          <Typography variant="small" color={colors.text} style={styles.dateText}>
            {date}
          </Typography>
        </View>
        <Calendar size={14} color={colors.textSecondary} />
      </View>
      
      <View style={styles.weatherContainer}>
        <Typography variant="h1" style={styles.weatherIcon}>
          {weatherIcon}
        </Typography>
        <Typography variant="h3" style={styles.temperature}>
          {temperature}
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    marginRight: tokens.spacing.sm,
    width: 110,
    borderWidth: 1,
    borderColor: colors.border,
    ...tokens.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
  },
  dateContainer: {
    flex: 1,
  },
  dayText: {
    fontSize: 11,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  weatherContainer: {
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 32,
    marginBottom: tokens.spacing.xs,
  },
  temperature: {
    fontWeight: '700',
    fontSize: 18,
  },
});
