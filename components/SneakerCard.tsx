import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Heart, TrendingUp, Calendar } from 'lucide-react-native';
import { Sneaker } from '@/types/sneaker';
import { colors } from '@/constants/colors';
import { router } from 'expo-router';

interface SneakerCardProps {
  sneaker: Sneaker;
  onToggleWishlist?: (id: string) => void;
  showPrice?: boolean;
  compact?: boolean;
}

export function SneakerCard({ 
  sneaker, 
  onToggleWishlist, 
  showPrice = true, 
  compact = false 
}: SneakerCardProps) {
  const handlePress = () => {
    router.push(`/(tabs)/collection`);
  };

  const handleWishlistPress = () => {
    onToggleWishlist?.(sneaker.id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'deadstock': return '#00C851';
      case 'vnds': return '#ffbb33';
      case 'used': return '#ff4444';
      case 'beater': return '#666';
      default: return colors.mediumGray;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'grail': return '#FFD700';
      case 'rare': return '#FF6B6B';
      case 'uncommon': return '#4ECDC4';
      case 'common': return colors.mediumGray;
      default: return colors.mediumGray;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, compact && styles.compactCard]} 
      onPress={handlePress}
      testID={`sneaker-card-${sneaker.id}`}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: sneaker.images[0] }} 
          style={[styles.image, compact && styles.compactImage]}
          resizeMode="cover"
        />
        
        <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(sneaker.rarity) }]}>
          <Text style={styles.rarityText}>{sneaker.rarity.toUpperCase()}</Text>
        </View>

        {onToggleWishlist && (
          <TouchableOpacity 
            style={styles.wishlistButton}
            onPress={handleWishlistPress}
            testID={`wishlist-${sneaker.id}`}
          >
            <Heart 
              size={20} 
              color={sneaker.isWishlisted ? '#FF6B6B' : colors.text}
              fill={sneaker.isWishlisted ? '#FF6B6B' : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.content, compact && styles.compactContent]}>
        <View style={styles.header}>
          <Text style={[styles.brand, compact && styles.compactBrand]} numberOfLines={1}>
            {sneaker.brand}
          </Text>
          <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(sneaker.condition) }]}>
            <Text style={styles.conditionText}>{sneaker.condition.toUpperCase()}</Text>
          </View>
        </View>
        
        <Text style={[styles.name, compact && styles.compactName]} numberOfLines={2}>
          {sneaker.name}
        </Text>
        
        <Text style={[styles.colorway, compact && styles.compactColorway]} numberOfLines={1}>
          {sneaker.colorway}
        </Text>

        <View style={styles.details}>
          <View style={styles.sizeContainer}>
            <Text style={styles.sizeLabel}>Size</Text>
            <Text style={styles.sizeValue}>{sneaker.size}</Text>
          </View>
          
          {showPrice && sneaker.currentPrice && (
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <TrendingUp size={14} color={colors.primary} />
                <Text style={styles.currentPrice}>
                  {formatPrice(sneaker.currentPrice)}
                </Text>
              </View>
              {sneaker.purchasePrice && (
                <Text style={styles.retailPrice}>
                  Paid: {formatPrice(sneaker.purchasePrice)}
                </Text>
              )}
            </View>
          )}
        </View>

        {!compact && (
          <View style={styles.footer}>
            <View style={styles.dateContainer}>
              <Calendar size={12} color={colors.mediumGray} />
              <Text style={styles.releaseDate}>
                {new Date(sneaker.releaseDate).getFullYear()}
              </Text>
            </View>
            
            <View style={styles.tags}>
              {sneaker.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  compactCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  compactImage: {
    height: 150,
  },
  rarityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rarityText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
  wishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  compactContent: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  compactBrand: {
    fontSize: 12,
  },
  conditionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conditionText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '600',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  compactName: {
    fontSize: 14,
  },
  colorway: {
    fontSize: 14,
    color: colors.mediumGray,
    marginBottom: 12,
  },
  compactColorway: {
    fontSize: 12,
    marginBottom: 8,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sizeContainer: {
    alignItems: 'flex-start',
  },
  sizeLabel: {
    fontSize: 11,
    color: colors.mediumGray,
    marginBottom: 2,
  },
  sizeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 4,
  },
  retailPrice: {
    fontSize: 11,
    color: colors.mediumGray,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  releaseDate: {
    fontSize: 11,
    color: colors.mediumGray,
    marginLeft: 4,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: colors.mediumGray,
    fontWeight: '500',
  },
});