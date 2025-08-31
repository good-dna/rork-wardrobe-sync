import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { sneakerService, wishlistService, publicSneakerService } from '@/services/sneakerService';
import { testSupabaseConnection } from '@/services/supabaseApi';

export default function TestSneakerAPI() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    addTestResult('🔄 Testing Supabase connection...');
    
    try {
      const result = await testSupabaseConnection();
      if (result.success) {
        addTestResult('✅ Supabase connection successful');
      } else {
        addTestResult(`❌ Supabase connection failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Connection test error: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testAddSneaker = async () => {
    setIsLoading(true);
    addTestResult('🔄 Testing add sneaker...');
    
    try {
      const testSneaker = {
        name: 'Test Air Jordan 1',
        brand: 'Jordan',
        model: 'Air Jordan 1',
        colorway: 'Test Red',
        size: 10.5,
        condition: 'deadstock' as const,
        category: 'basketball' as const,
        rarity: 'common' as const,
        retailPrice: 170,
        currentPrice: 200,
        description: 'Test sneaker for API validation'
      };
      
      const result = await sneakerService.addSneaker(testSneaker);
      addTestResult(`✅ Sneaker added successfully: ${result.name}`);
    } catch (error) {
      addTestResult(`❌ Add sneaker failed: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testGetSneakers = async () => {
    setIsLoading(true);
    addTestResult('🔄 Testing get sneakers...');
    
    try {
      const sneakers = await sneakerService.getMySneakers();
      addTestResult(`✅ Retrieved ${sneakers.length} sneakers from collection`);
      
      if (sneakers.length > 0) {
        addTestResult(`📋 First sneaker: ${sneakers[0].name} by ${sneakers[0].brand}`);
      }
    } catch (error) {
      addTestResult(`❌ Get sneakers failed: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testCollectionStats = async () => {
    setIsLoading(true);
    addTestResult('🔄 Testing collection stats...');
    
    try {
      const stats = await sneakerService.getCollectionStats();
      addTestResult(`✅ Collection stats retrieved:`);
      addTestResult(`   📊 Total items: ${stats.totalItems}`);
      addTestResult(`   💰 Total value: $${stats.totalValue.toFixed(2)}`);
      addTestResult(`   📈 Average value: $${stats.averageValue.toFixed(2)}`);
      addTestResult(`   🏷️ Top brands: ${stats.topBrands.map((b: { brand: string; count: number }) => b.brand).join(', ')}`);
    } catch (error) {
      addTestResult(`❌ Collection stats failed: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testWishlist = async () => {
    setIsLoading(true);
    addTestResult('🔄 Testing wishlist...');
    
    try {
      const testWishlistItem = {
        name: 'Test Wishlist Item',
        brand: 'Nike',
        model: 'Dunk Low',
        colorway: 'Test Blue',
        size: 11,
        priority: 'high' as const,
        maxPrice: 150,
        notes: 'Test wishlist item for API validation'
      };
      
      const added = await wishlistService.addToWishlist(testWishlistItem);
      addTestResult(`✅ Added to wishlist: ${added.name}`);
      
      const wishlist = await wishlistService.getMyWishlist();
      addTestResult(`✅ Retrieved ${wishlist.length} wishlist items`);
    } catch (error) {
      addTestResult(`❌ Wishlist test failed: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testPublicData = async () => {
    setIsLoading(true);
    addTestResult('🔄 Testing public data...');
    
    try {
      // Test search (this might fail if public tables don't exist)
      try {
        const searchResults = await publicSneakerService.searchSneakers('Jordan', 5);
        addTestResult(`✅ Search results: ${searchResults.length} items found`);
      } catch (error) {
        addTestResult(`⚠️ Search test skipped (public tables may not exist): ${error}`);
      }
      
      // Test trending (this might fail if public tables don't exist)
      try {
        const trending = await publicSneakerService.getTrendingSneakers(5);
        addTestResult(`✅ Trending sneakers: ${trending.length} items found`);
      } catch (error) {
        addTestResult(`⚠️ Trending test skipped (public tables may not exist): ${error}`);
      }
      
      // Test upcoming releases (this might fail if public tables don't exist)
      try {
        const upcoming = await publicSneakerService.getUpcomingReleases(5);
        addTestResult(`✅ Upcoming releases: ${upcoming.length} items found`);
      } catch (error) {
        addTestResult(`⚠️ Upcoming releases test skipped (public tables may not exist): ${error}`);
      }
    } catch (error) {
      addTestResult(`❌ Public data test failed: ${error}`);
    }
    
    setIsLoading(false);
  };

  const runAllTests = async () => {
    clearResults();
    addTestResult('🚀 Starting comprehensive API tests...');
    
    await testConnection();
    await testAddSneaker();
    await testGetSneakers();
    await testCollectionStats();
    await testWishlist();
    await testPublicData();
    
    addTestResult('🏁 All tests completed!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Sneaker API Test',
          headerStyle: { backgroundColor: '#1F2937' },
          headerTintColor: '#FFFFFF'
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Sneaker Database API Test</Text>
        <Text style={styles.subtitle}>Test the connection and functionality of the sneaker database API</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={runAllTests}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '🔄 Running Tests...' : '🚀 Run All Tests'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={testConnection}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Test Connection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={testAddSneaker}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Add Sneaker</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={testGetSneakers}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Get Collection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={testWishlist}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Test Wishlist</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, styles.warningButton]} 
            onPress={clearResults}
          >
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>
        
        {testResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Test Results:</Text>
            {testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827'
  },
  content: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24
  },
  buttonContainer: {
    marginBottom: 32
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center'
  },
  primaryButton: {
    backgroundColor: '#3B82F6'
  },
  secondaryButton: {
    backgroundColor: '#374151',
    flex: 0.48
  },
  warningButton: {
    backgroundColor: '#EF4444'
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButtonText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600'
  },
  resultsContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    marginTop: 20
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16
  },
  resultText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 8,
    fontFamily: 'monospace',
    lineHeight: 20
  }
});