import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { colors, tokens } from '@/constants/colors';
import Typography from './Typography';

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
          <View style={styles.imagePlaceholder}>
            <Typography variant="body" color={colors.textSecondary}>
              {title.charAt(0)}
            </Typography>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Typography variant="body" style={styles.title} numberOfLines={1}>
          {title}
        </Typography>
        <Typography variant="small" color={colors.textSecondary}>
          Worn {wornCount} times
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    backgroundColor: colors.background,
    borderRadius: tokens.radius.lg,
    marginRight: tokens.spacing.sm,
    ...tokens.shadow.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: colors.backgroundSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGray,
  },
  info: {
    padding: tokens.spacing.sm,
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
  },
});
