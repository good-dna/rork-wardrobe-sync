import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Calendar, Cloud, Sun } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import Typography from './Typography';

interface ForecastCardProps {
  day: string;
  date: string;
  temperature: string;
  weatherType: 'sunny' | 'cloudy' | 'rainy';
  onPress?: () => void;
}

export default function ForecastCard({ day, date, temperature, weatherType, onPress }: ForecastCardProps) {
  const WeatherIcon = weatherType === 'sunny' ? Sun : Cloud;
  
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.calendarIcon}>
          <Calendar size={12} color={colors.textSecondary} />
        </View>
      </View>
      <View style={styles.content}>
        <Typography variant="caption" color={colors.textSecondary} style={styles.day}>
          {day}
        </Typography>
        <Typography variant="small" color={colors.textSecondary} style={styles.date}>
          {date}
        </Typography>
        <View style={styles.weatherIcon}>
          <WeatherIcon size={32} color={colors.primary} />
        </View>
        <Typography variant="body" style={styles.temperature}>
          {temperature}
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 110,
    backgroundColor: colors.background,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    marginRight: tokens.spacing.sm,
    ...tokens.shadow.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: tokens.spacing.xs,
  },
  calendarIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  day: {
    fontWeight: '600',
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    marginBottom: tokens.spacing.sm,
  },
  weatherIcon: {
    marginVertical: tokens.spacing.xs,
  },
  temperature: {
    fontWeight: '700',
    fontSize: 16,
    marginTop: tokens.spacing.xs,
  },
});
