import React from 'react';
import { StyleSheet, Text, View, Image, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Cloud, Droplets, Wind, Sun, Thermometer } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { WeatherData } from '@/services/weatherService';
import { Item } from '@/types/wardrobe';
import ItemCard from './ItemCard';

interface WeatherOutfitCardProps {
  weather: WeatherData;
  items: Item[];
  reasonings: { category: string; reason: string }[];
  onSaveOutfit?: () => void;
}

export default function WeatherOutfitCard({ 
  weather, 
  items, 
  reasonings,
  onSaveOutfit
}: WeatherOutfitCardProps) {
  const router = useRouter();
  
  const getWeatherIcon = () => {
    const { temperature, precipitation, windSpeed, uvIndex } = weather;
    
    if (precipitation > 0.5) {
      return <Cloud size={24} color={colors.primary} />;
    } else if (windSpeed > 7) {
      return <Wind size={24} color={colors.primary} />;
    } else if (uvIndex > 7) {
      return <Sun size={24} color={colors.primary} />;
    } else if (temperature > 28) {
      return <Thermometer size={24} color={colors.primary} />;
    } else if (temperature < 5) {
      return <Thermometer size={24} color={colors.primary} />;
    } else {
      return <Cloud size={24} color={colors.primary} />;
    }
  };
  
  const getWeatherColor = () => {
    const { temperature, precipitation } = weather;
    
    if (precipitation > 0.5) {
      return '#A7C5EB'; // Light blue for rain
    } else if (temperature > 28) {
      return '#FFD7BA'; // Light orange for hot
    } else if (temperature < 5) {
      return '#C7CEEA'; // Lavender for cold
    } else {
      return '#B5EAD7'; // Mint for mild
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={[styles.weatherHeader, { backgroundColor: getWeatherColor() }]}>
        <View style={styles.weatherInfo}>
          <View style={styles.weatherIconContainer}>
            {getWeatherIcon()}
          </View>
          <View>
            <Text style={styles.location}>{weather.location}</Text>
            <Text style={styles.weatherDescription}>{weather.description}</Text>
          </View>
        </View>
        <Text style={styles.temperature}>{Math.round(weather.temperature)}°C</Text>
      </View>
      
      <View style={styles.weatherDetails}>
        <View style={styles.weatherDetail}>
          <Droplets size={16} color={colors.subtext} />
          <Text style={styles.weatherDetailText}>
            {Math.round(weather.humidity)}% humidity
          </Text>
        </View>
        <View style={styles.weatherDetail}>
          <Wind size={16} color={colors.subtext} />
          <Text style={styles.weatherDetailText}>
            {weather.windSpeed.toFixed(1)} m/s wind
          </Text>
        </View>
        <View style={styles.weatherDetail}>
          <Sun size={16} color={colors.subtext} />
          <Text style={styles.weatherDetailText}>
            UV index {weather.uvIndex}
          </Text>
        </View>
      </View>
      
      <View style={styles.outfitContainer}>
        <Text style={styles.outfitTitle}>Recommended Outfit</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.itemsScroll}
          contentContainerStyle={styles.itemsContainer}
        >
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <ItemCard item={item} compact />
            </View>
          ))}
        </ScrollView>
        
        <View style={styles.reasoningsContainer}>
          <Text style={styles.reasoningsTitle}>Why This Outfit?</Text>
          {reasonings.map((reasoning, index) => (
            <View key={index} style={styles.reasoningItem}>
              <Text style={styles.reasoningCategory}>{reasoning.category}:</Text>
              <Text style={styles.reasoningText}>{reasoning.reason}</Text>
            </View>
          ))}
        </View>
        
        {onSaveOutfit && (
          <Pressable style={styles.saveButton} onPress={onSaveOutfit}>
            <Text style={styles.saveButtonText}>Save This Outfit</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  location: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  weatherDescription: {
    fontSize: 14,
    color: colors.subtext,
    textTransform: 'capitalize',
  },
  temperature: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherDetailText: {
    fontSize: 12,
    color: colors.subtext,
    marginLeft: 4,
  },
  outfitContainer: {
    padding: 16,
  },
  outfitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  itemsScroll: {
    marginBottom: 16,
  },
  itemsContainer: {
    paddingRight: 16,
  },
  itemCard: {
    marginRight: 12,
  },
  reasoningsContainer: {
    marginBottom: 16,
  },
  reasoningsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  reasoningItem: {
    marginBottom: 8,
  },
  reasoningCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  reasoningText: {
    fontSize: 14,
    color: colors.subtext,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});