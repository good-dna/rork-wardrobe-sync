import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Cloud, MapPin, Thermometer, Wind } from 'lucide-react-native';
import { trpcClient } from '@/lib/trpc';

export default function WeatherAPITest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCurrentWeather = async () => {
    setLoading(true);
    addResult('Testing current weather API...');
    
    try {
      const data = await trpcClient.weather.current.query({
        lat: 40.7128,
        lon: -74.0060,
        units: 'metric'
      });
      
      addResult(`✅ Current weather: ${data.temperature}°C, ${data.description}`);
      addResult(`   Location: ${data.location}`);
      addResult(`   Humidity: ${data.humidity}%, Wind: ${data.windSpeed}m/s`);
    } catch (error) {
      addResult(`❌ Current weather failed: ${error}`);
    }
    
    setLoading(false);
  };

  const testForecast = async () => {
    setLoading(true);
    addResult('Testing forecast API...');
    
    try {
      const data = await trpcClient.weather.forecast.query({
        lat: 40.7128,
        lon: -74.0060,
        units: 'metric',
        days: 3
      });
      
      addResult(`✅ Forecast loaded: ${data.daily.length} days`);
      addResult(`   Location: ${data.location}`);
      if (data.daily.length > 0) {
        const today = data.daily[0];
        addResult(`   Today: ${today.high}°C/${today.low}°C, ${today.description}`);
      }
    } catch (error) {
      addResult(`❌ Forecast failed: ${error}`);
    }
    
    setLoading(false);
  };

  const testLocationSearch = async () => {
    setLoading(true);
    addResult('Testing location search API...');
    
    try {
      const data = await trpcClient.weather.searchLocations.query({
        query: 'New York',
        limit: 3
      });
      
      addResult(`✅ Location search: Found ${data.length} results`);
      data.forEach((location: { city: string; country: string }, index: number) => {
        addResult(`   ${index + 1}. ${location.city}, ${location.country}`);
      });
    } catch (error) {
      addResult(`❌ Location search failed: ${error}`);
    }
    
    setLoading(false);
  };

  const testReverseGeocode = async () => {
    setLoading(true);
    addResult('Testing reverse geocoding API...');
    
    try {
      const data = await trpcClient.weather.reverseGeocode.query({
        lat: 51.5074,
        lon: -0.1278
      });
      
      addResult(`✅ Reverse geocode: ${data.city}, ${data.country}`);
      addResult(`   Coordinates: ${data.latitude}, ${data.longitude}`);
    } catch (error) {
      addResult(`❌ Reverse geocode failed: ${error}`);
    }
    
    setLoading(false);
  };

  const testRecommendations = async () => {
    setLoading(true);
    addResult('Testing weather recommendations API...');
    
    try {
      const data = await trpcClient.weather.recommendations.query({
        lat: 40.7128,
        lon: -74.0060,
        units: 'metric',
        userStyle: 'casual',
        occasion: 'daily'
      });
      
      addResult(`✅ Recommendations: Found ${data.length} suggestions`);
      data.forEach((rec: { title: string; confidence: number; items: any[] }, index: number) => {
        addResult(`   ${index + 1}. ${rec.title} (${rec.confidence}% confidence)`);
        addResult(`      ${rec.items.length} items recommended`);
      });
    } catch (error) {
      addResult(`❌ Recommendations failed: ${error}`);
    }
    
    setLoading(false);
  };

  const testAllAPIs = async () => {
    setResults([]);
    addResult('🚀 Starting comprehensive API test...');
    
    await testCurrentWeather();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testForecast();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testLocationSearch();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testReverseGeocode();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testRecommendations();
    
    addResult('🎉 All API tests completed!');
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Weather API Test',
          headerRight: () => (
            <TouchableOpacity onPress={clearResults} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )
        }} 
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Cloud size={32} color="#4A90E2" />
          <Text style={styles.title}>Weather API Test Suite</Text>
          <Text style={styles.subtitle}>
            Test all 6 weather API endpoints
          </Text>
        </View>

        <View style={styles.buttonGrid}>
          <TouchableOpacity 
            style={[styles.testButton, styles.primaryButton]} 
            onPress={testAllAPIs}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Testing...' : 'Test All APIs'}
            </Text>
          </TouchableOpacity>

          <View style={styles.individualButtons}>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={testCurrentWeather}
              disabled={loading}
            >
              <Thermometer size={16} color="#666" />
              <Text style={styles.buttonText}>Current Weather</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.testButton} 
              onPress={testForecast}
              disabled={loading}
            >
              <Cloud size={16} color="#666" />
              <Text style={styles.buttonText}>Forecast</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.testButton} 
              onPress={testLocationSearch}
              disabled={loading}
            >
              <MapPin size={16} color="#666" />
              <Text style={styles.buttonText}>Search Locations</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.testButton} 
              onPress={testReverseGeocode}
              disabled={loading}
            >
              <MapPin size={16} color="#666" />
              <Text style={styles.buttonText}>Reverse Geocode</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.testButton} 
              onPress={testRecommendations}
              disabled={loading}
            >
              <Wind size={16} color="#666" />
              <Text style={styles.buttonText}>Recommendations</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Running API tests...</Text>
          </View>
        )}

        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {results.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))}
          {results.length === 0 && !loading && (
            <Text style={styles.noResults}>
              No test results yet. Tap &quot;Test All APIs&quot; to begin.
            </Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    flex: 1,
    padding: 16
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF6B6B',
    borderRadius: 6
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center'
  },
  buttonGrid: {
    marginBottom: 20
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    marginBottom: 16
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  individualButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minWidth: '48%',
    gap: 6
  },
  buttonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500'
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666'
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace'
  },
  noResults: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20
  }
});