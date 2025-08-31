import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart, Eye, Calendar, DollarSign } from 'lucide-react-native';
import { Sneaker } from '@/types/sneaker';

interface SneakerCardProps {
  sneaker: Sneaker;
  onPress?: () => void;
  onFavoritePress?: () => void;
  onWearPress?: () => void;
  showStats?: boolean;
  compact?: boolean;
}

export function SneakerCard({ 
  sneaker, 
  onPress, 
  onFavoritePress, 
  onWearPress,
  showStats = true,
  compact = false 
}: SneakerCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Deadstock': return '#00C851';
      case 'New': return '#2BBBAD';
      case 'Very Good': return '#4285F4';
      case 'Good': return '#FF8800';
      case 'Fair': return '#FF4444';
      case 'Poor': return '#AA2E25';
      default: return '#757575';
    }
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress}>
        <Image 
          source={{ uri: sneaker.imageUrls[0] || 'https://via.placeholder.com/80x80' }} 
          style={styles.compactImage}
          resizeMode="cover"
        />
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>{sneaker.name}</Text>
          <Text style={styles.compactBrand}>{sneaker.brand}</Text>
          <Text style={styles.compactSize}>US {sneaker.size.us}</Text>
        </View>
        <TouchableOpacity 
          style={styles.compactFavorite}
          onPress={onFavoritePress}
        >
          <Heart 
            size={16} 
            color={sneaker.favorite ? '#FF4444' : '#999'} 
            fill={sneaker.favorite ? '#FF4444' : 'transparent'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: sneaker.imageUrls[0] || 'https://via.placeholder.com/300x200' }} 
          style={styles.image}
          resizeMode="cover"
        />
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={onFavoritePress}
        >
          <Heart 
            size={20} 
            color={sneaker.favorite ? '#FF4444' : '#FFF'} 
            fill={sneaker.favorite ? '#FF4444' : 'transparent'}
          />
        </TouchableOpacity>
        <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(sneaker.condition) }]}>
          <Text style={styles.conditionText}>{sneaker.condition}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>{sneaker.brand}</Text>
          <Text style={styles.category}>{sneaker.category}</Text>
        </View>
        
        <Text style={styles.name} numberOfLines={2}>{sneaker.name}</Text>
        <Text style={styles.model}>{sneaker.model}</Text>

        <View style={styles.colorwayContainer}>
          <View style={[styles.colorDot, { backgroundColor: sneaker.details.colorway.primary }]} />
          {sneaker.details.colorway.secondary && (
            <View style={[styles.colorDot, { backgroundColor: sneaker.details.colorway.secondary }]} />
          )}
          {sneaker.details.colorway.accent && (
            <View style={[styles.colorDot, { backgroundColor: sneaker.details.colorway.accent }]} />
          )}
          {sneaker.details.colorway.nickname && (
            <Text style={styles.nickname}>{sneaker.details.colorway.nickname}</Text>
          )}
        </View>

        <View style={styles.sizePrice}>
          <Text style={styles.size}>US {sneaker.size.us}</Text>
          {sneaker.purchasePrice && (
            <Text style={styles.price}>{formatPrice(sneaker.purchasePrice)}</Text>
          )}
        </View>

        {showStats && (
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Eye size={14} color="#666" />
              <Text style={styles.statText}>{sneaker.wearCount}</Text>
            </View>
            {sneaker.lastWorn && (
              <View style={styles.statItem}>
                <Calendar size={14} color="#666" />
                <Text style={styles.statText}>{formatDate(sneaker.lastWorn)}</Text>
              </View>
            )}
            {sneaker.details.currentMarketPrice && (
              <View style={styles.statItem}>
                <DollarSign size={14} color="#666" />
                <Text style={styles.statText}>{formatPrice(sneaker.details.currentMarketPrice)}</Text>
              </View>
            )}
          </View>
        )}

        {onWearPress && (
          <TouchableOpacity style={styles.wearButton} onPress={onWearPress}>
            <Text style={styles.wearButtonText}>Mark as Worn</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  compactCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  compactImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  compactFavorite: {
    padding: 8,
  },
  conditionBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  compactContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    textTransform: 'uppercase',
  },
  category: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    lineHeight: 20,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  model: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  compactBrand: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  colorwayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  nickname: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  sizePrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  size: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  compactSize: {
    fontSize: 12,
    color: '#666',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  wearButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  wearButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});