import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, ChevronLeft, ChevronRight, X, Cloud, Sun, CloudRain } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { usePlans } from '@/hooks/usePlans';
import { useUserStore } from '@/store/userStore';
import { getMockWeatherData, convertTemperature, getTemperatureUnit } from '@/services/weatherService';

type DayOfWeek = { date: Date; dateString: string; dayName: string; dayNumber: number };

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const items = useWardrobeStore((state) => state.items);
  const { profile } = useUserStore();
  
  const { plansForDate } = usePlans({ date: selectedDate });
  
  const currentWeather = getMockWeatherData('sunny');
  const units = profile?.locationPreferences?.units || 'metric';
  
  const weekDays = useMemo(() => {
    const days: DayOfWeek[] = [];
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        date,
        dateString: date.toLocaleDateString('en-CA'),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
      });
    }
    
    return days;
  }, [selectedDate]);
  
  const selectedOutfits = useMemo(() => {
    return (plansForDate as any[]) || [];
  }, [plansForDate]);
  
  const selectedItems = useMemo(() => {
    if (selectedOutfits.length === 0) return [];
    const itemIds = selectedOutfits.flatMap((outfit: any) => outfit.items || []);
    return items.filter(item => itemIds.includes(item.id));
  }, [selectedOutfits, items]);
  
  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };
  
  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleRemoveItem = (itemId: string) => {
    console.log('Remove item:', itemId);
  };
  
  const handleAddOutfit = () => {
    const dateString = selectedDate.toLocaleDateString('en-CA');
    router.push(`/add-outfit?date=${dateString}`);
  };
  
  const getWeatherIcon = () => {
    const temp = convertTemperature(currentWeather.temperature, units);
    if (temp > 25) return <Sun size={20} color={colors.warning} />;
    if (temp > 15) return <Cloud size={20} color={colors.info} />;
    return <CloudRain size={20} color={colors.primary} />;
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toLocaleDateString('en-CA') === today.toLocaleDateString('en-CA');
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Daily Outfits</Text>
          <Text style={styles.subtitle}>Plan your style ahead</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.weekSection}>
          <View style={styles.weekHeader}>
            <Pressable onPress={handlePrevWeek} style={styles.weekNav}>
              <ChevronLeft size={20} color={colors.text} />
            </Pressable>
            <Text style={styles.monthYear}>
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable onPress={handleNextWeek} style={styles.weekNav}>
              <ChevronRight size={20} color={colors.text} />
            </Pressable>
          </View>
          
          <View style={styles.weekDays}>
            {weekDays.map((day) => {
              const isSelected = day.dateString === selectedDate.toLocaleDateString('en-CA');
              const isTodayDay = isToday(day.date);
              
              return (
                <Pressable
                  key={day.dateString}
                  style={[
                    styles.dayCard,
                    isSelected && styles.dayCardSelected,
                    isTodayDay && styles.dayCardToday,
                  ]}
                  onPress={() => handleDateSelect(day.date)}
                >
                  <Text style={[
                    styles.dayName,
                    isSelected && styles.dayNameSelected,
                  ]}>
                    {day.dayName}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                  ]}>
                    {day.dayNumber}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          
          <View style={styles.weatherCard}>
            <View style={styles.weatherInfo}>
              {getWeatherIcon()}
              <Text style={styles.weatherTemp}>
                {convertTemperature(currentWeather.temperature, units)}{getTemperatureUnit(units)}
              </Text>
              <Text style={styles.weatherDesc}>{currentWeather.description}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          
          {selectedOutfits.length > 0 && (
            <View style={styles.eventsList}>
              {selectedOutfits.map((outfit: any) => (
                <View key={outfit.id} style={styles.eventCard}>
                  <View style={styles.eventDot} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventName}>{outfit.name}</Text>
                    <Text style={styles.eventCategory}>{outfit.category}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.outfitsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Selected Outfits</Text>
            <Pressable onPress={handleAddOutfit} style={styles.addButton}>
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.outfitsGrid}
          >
            {selectedOutfits.map((outfit: any) => (
              <View key={outfit.id} style={styles.outfitCard}>
                <View style={styles.outfitImage}>
                  <Text style={styles.outfitEmoji}>👔</Text>
                </View>
                <Text style={styles.outfitName}>{outfit.name}</Text>
              </View>
            ))}
            
            <Pressable style={styles.addNewCard} onPress={handleAddOutfit}>
              <View style={styles.addNewIcon}>
                <Plus size={24} color={colors.primary} />
              </View>
              <Text style={styles.addNewText}>Add New</Text>
            </Pressable>
          </ScrollView>
        </View>
        
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Selected Items</Text>
          
          {selectedItems.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.itemsChips}
            >
              {selectedItems.map((item) => (
                <View key={item.id} style={styles.itemChip}>
                  <Text style={styles.itemChipText}>{item.name}</Text>
                  <Pressable 
                    onPress={() => handleRemoveItem(item.id)}
                    style={styles.itemChipRemove}
                  >
                    <X size={14} color={colors.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No items selected for this day</Text>
              <Text style={styles.emptyStateSubtext}>Add an outfit to get started</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: tokens.spacing.xxl,
  },
  weekSection: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  weekNav: {
    padding: tokens.spacing.sm,
  },
  monthYear: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.lg,
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: 4,
    borderRadius: tokens.radius.md,
    marginHorizontal: 2,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayCardToday: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  dayName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  dayNameSelected: {
    color: colors.background,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dayNumberSelected: {
    color: colors.background,
  },
  weatherCard: {
    backgroundColor: colors.lightGray,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherTemp: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: tokens.spacing.sm,
  },
  weatherDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: tokens.spacing.sm,
  },
  eventsSection: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: tokens.spacing.md,
  },
  eventsList: {
    gap: tokens.spacing.sm,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: tokens.spacing.md,
  },
  eventContent: {
    flex: 1,
  },
  eventName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  eventCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  outfitsSection: {
    marginBottom: tokens.spacing.xl,
  },
  outfitsGrid: {
    paddingHorizontal: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  outfitCard: {
    width: 100,
    alignItems: 'center',
  },
  outfitImage: {
    width: 100,
    height: 100,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  outfitEmoji: {
    fontSize: 32,
  },
  outfitName: {
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  addNewCard: {
    width: 100,
    alignItems: 'center',
  },
  addNewIcon: {
    width: 100,
    height: 100,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.lightGray,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  addNewText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: tokens.radius.md,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 4,
  },
  itemsSection: {
    paddingHorizontal: tokens.spacing.lg,
  },
  itemsChips: {
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: tokens.radius.full,
    paddingLeft: tokens.spacing.md,
    paddingRight: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemChipText: {
    fontSize: 14,
    color: colors.text,
    marginRight: tokens.spacing.sm,
  },
  itemChipRemove: {
    padding: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xl,
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: colors.textTertiary,
  },
});
