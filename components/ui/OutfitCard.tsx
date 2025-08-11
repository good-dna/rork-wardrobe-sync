import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Image } from 'react-native';
import { Heart } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import Card from './Card';

interface OutfitCardProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
  onPress?: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
  ctaText?: string;
}

export default function OutfitCard({ 
  title,
  subtitle,
  imageUrl,
  onPress,
  onFavorite,
  isFavorited = false,
  ctaText = 'Try it out'
}: OutfitCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const heartScale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handleFavoritePress = () => {
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.3,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();
    onFavorite?.();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Card style={styles.container} elevated>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.pressable}
        >
          <View style={styles.content}>
            <View style={styles.leftColumn}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
              
              <Pressable style={styles.ctaButton} onPress={onPress}>
                <Text style={styles.ctaText}>{ctaText}</Text>
              </Pressable>
            </View>
            
            <View style={styles.rightColumn}>
              {imageUrl ? (
                <Image 
                  source={{ uri: imageUrl }} 
                  style={styles.outfitImage}
                  resizeMode='cover'
                />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>Outfit Preview</Text>
                </View>
              )}
            </View>
          </View>
          
          <Pressable 
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart 
                size={20} 
                color={isFavorited ? colors.error : colors.textSecondary}
                fill={isFavorited ? colors.error : 'transparent'}
              />
            </Animated.View>
          </Pressable>
        </Pressable>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
    overflow: 'hidden',
  },
  pressable: {
    position: 'relative',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftColumn: {
    flex: 1,
    paddingRight: tokens.spacing.md,
  },
  rightColumn: {
    width: 120,
    height: 120,
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  title: {
    ...tokens.typography.h3,
    color: colors.text,
    marginBottom: tokens.spacing.xs,
  },
  subtitle: {
    ...tokens.typography.body,
    color: colors.textSecondary,
    marginBottom: tokens.spacing.lg,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    alignSelf: 'flex-start',
  },
  ctaText: {
    ...tokens.typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    ...tokens.typography.small,
    color: colors.textTertiary,
  },
  favoriteButton: {
    position: 'absolute',
    top: tokens.spacing.md,
    right: tokens.spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadow.sm,
  },
});