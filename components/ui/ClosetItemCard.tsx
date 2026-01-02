import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import Typography from './Typography';
import { colors, tokens } from '@/constants/colors';

interface ClosetItemCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  wornCount: number;
  onPress?: () => void;
}

export default function ClosetItemCard({ id, title, imageUrl, wornCount, onPress }: ClosetItemCardProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Typography variant="h3" color={colors.textSecondary}>
              {title.charAt(0).toUpperCase()}
            </Typography>
          </View>
        )}
      </View>
      <View style={styles.infoContainer}>
        <Typography variant="body" style={styles.title} numberOfLines={1}>
          {title}
        </Typography>
        <Typography variant="caption" color={colors.textSecondary}>
          Worn {wornCount} times
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    marginRight: tokens.spacing.md,
    width: 140,
    borderWidth: 1,
    borderColor: colors.border,
    ...tokens.shadow.sm,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: colors.lightGray,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGray,
  },
  infoContainer: {
    padding: tokens.spacing.sm,
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
  },
});
