import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  Pressable,
  Alert,
  Platform
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { RefreshCw, MapPin, AlertCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { 
  getWeatherData, 
  getMockWeatherData, 
  WeatherData 
} from '@/services/weatherService';
import { generateOutfitRecommendation } from '@/services/outfitRecommendationService';
import WeatherOutfitCard from '@/components/WeatherOutfitCard';
import * as Haptics from 'expo-haptics';

export default function WeatherOutfitScreen() {
  const router = useRouter();
  const items = useWardrobeStore((state) => state.items);
  const addOutfit = useWardrobeStore((state) => state.addOutfit);
  
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  
  // For demo purposes, we'll use mock weather conditions
  const [selectedWeather, setSelectedWeather] = useState<'sunny' | 'rainy' | 'cold' | 'hot' | 'windy'>('sunny');
  
  useEffect(() => {
    fetchWeatherAndGenerateOutfit();
  }, [selectedWeather]);
  
  const fetchWeatherAndGenerateOutfit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, we would use the actual weather API
      // const weatherData = await getWeatherData();
      
      // For demo purposes, we'll use mock data
      const weatherData = getMockWeatherData(selectedWeather);
      
      if (weatherData) {
        setWeather(weatherData);
        
        // Generate outfit recommendation
        const outfitRecommendation = generateOutfitRecommendation(items, weatherData);
        
        if (outfitRecommendation) {
          // Get the actual items from the store based on IDs
          const recommendedItems = items.filter(item => 
            outfitRecommendation.outfit.items.includes(item.id)
          );
          
          setRecommendation({
            ...outfitRecommendation,
            items: recommendedItems
          });
        } else {
          setError("Couldn't generate an outfit recommendation with your current wardrobe items.");
        }
      } else {
        setError("Couldn't fetch weather data. Please try again.");
      }
    } catch (err) {
      console.error('Error:', err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    fetchWeatherAndGenerateOutfit();
  };
  
  const handleSaveOutfit = () => {
    if (recommendation) {
      addOutfit(recommendation.outfit);
      Alert.alert(
        "Outfit Saved",
        "The weather-based outfit has been saved to your outfits collection.",
        [{ text: "OK" }]
      );
    }
  };
  
  const handleWeatherSelect = (condition: 'sunny' | 'rainy' | 'cold' | 'hot' | 'windy') => {
    setSelectedWeather(condition);
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen 
        options={{
          title: "Weather Outfit",
          headerRight: () => (
            <Pressable onPress={handleRefresh} style={styles.refreshButton}>
              <RefreshCw size={20} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Weather-Based Outfit</Text>
        <Text style={styles.subtitle}>
          Get outfit recommendations based on current weather conditions
        </Text>
      </View>
      
      {/* Demo weather selector */}
      <View style={styles.demoContainer}>
        <Text style={styles.demoTitle}>Demo: Select Weather Condition</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weatherOptions}
        >
          <Pressable
            style={[
              styles.weatherOption,
              selectedWeather === 'sunny' && styles.selectedWeatherOption
            ]}
            onPress={() => handleWeatherSelect('sunny')}
          >
            <Text 
              style={[
                styles.weatherOptionText,
                selectedWeather === 'sunny' && styles.selectedWeatherOptionText
              ]}
            >
              Sunny (25°C)
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.weatherOption,
              selectedWeather === 'rainy' && styles.selectedWeatherOption
            ]}
            onPress={() => handleWeatherSelect('rainy')}
          >
            <Text 
              style={[
                styles.weatherOptionText,
                selectedWeather === 'rainy' && styles.selectedWeatherOptionText
              ]}
            >
              Rainy (18°C)
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.weatherOption,
              selectedWeather === 'cold' && styles.selectedWeatherOption
            ]}
            onPress={() => handleWeatherSelect('cold')}
          >
            <Text 
              style={[
                styles.weatherOptionText,
                selectedWeather === 'cold' && styles.selectedWeatherOptionText
              ]}
            >
              Cold (2°C)
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.weatherOption,
              selectedWeather === 'hot' && styles.selectedWeatherOption
            ]}
            onPress={() => handleWeatherSelect('hot')}
          >
            <Text 
              style={[
                styles.weatherOptionText,
                selectedWeather === 'hot' && styles.selectedWeatherOptionText
              ]}
            >
              Hot (35°C)
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.weatherOption,
              selectedWeather === 'windy' && styles.selectedWeatherOption
            ]}
            onPress={() => handleWeatherSelect('windy')}
          >
            <Text 
              style={[
                styles.weatherOptionText,
                selectedWeather === 'windy' && styles.selectedWeatherOptionText
              ]}
            >
              Windy (15°C)
            </Text>
          </Pressable>
        </ScrollView>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching weather and generating outfit...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.error} style={styles.errorIcon} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {weather && recommendation && (
            <WeatherOutfitCard 
              weather={weather}
              items={recommendation.items}
              reasonings={recommendation.reasonings}
              onSaveOutfit={handleSaveOutfit}
            />
          )}
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>How It Works</Text>
            <Text style={styles.infoText}>
              This feature analyzes current weather conditions and recommends the most appropriate outfit from your wardrobe. It considers temperature, precipitation, wind, UV index, and humidity to suggest items that will keep you comfortable throughout the day.
            </Text>
            <Text style={styles.infoText}>
              For the best recommendations, make sure your wardrobe includes items for different weather conditions and that you've tagged them appropriately.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  refreshButton: {
    padding: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
  },
  demoContainer: {
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },
  weatherOptions: {
    paddingBottom: 8,
  },
  weatherOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginRight: 8,
  },
  selectedWeatherOption: {
    backgroundColor: colors.primary,
  },
  weatherOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedWeatherOptionText: {
    color: 'white',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.subtext,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 8,
    lineHeight: 20,
  },
});