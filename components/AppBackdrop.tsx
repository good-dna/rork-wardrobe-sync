import React from 'react';
import { StyleSheet, ImageBackground, View } from 'react-native';
import { colors } from '@/constants/colors';

const BACKDROP_URL = 'https://mpqgxxxagueuqehiazyl.supabase.co/storage/v1/object/public/wardrobe/backgrounds/closet-backdrop.png';

interface AppBackdropProps {
  children: React.ReactNode;
  overlay?: number; // 0-1, darkness of overlay
}

export default function AppBackdrop({ children, overlay = 0.75 }: AppBackdropProps) {
  return (
    <ImageBackground
      source={{ uri: BACKDROP_URL }}
      style={styles.backdrop}
      imageStyle={styles.backdropImage}
    >
      <View style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${overlay})` }]}>
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  backdropImage: { opacity: 0.4 },
  overlay: { flex: 1 },
});
