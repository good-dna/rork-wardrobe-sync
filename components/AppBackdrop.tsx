import React from 'react';
import { StyleSheet, ImageBackground, View } from 'react-native';

const BACKDROP_URL = 'https://mpqgxxxagueuqehiazyl.supabase.co/storage/v1/object/public/wardrobe/backgrounds/closet-backdrop.png';

export default function AppBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <ImageBackground
      source={{ uri: BACKDROP_URL }}
      style={styles.backdrop}
      imageStyle={styles.backdropImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  backdropImage: { opacity: 0.35 },
  overlay: { flex: 1, backgroundColor: 'rgba(11, 11, 13, 0.65)' },
});