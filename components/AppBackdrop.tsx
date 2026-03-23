import React from 'react';
import { StyleSheet, ImageBackground, View } from 'react-native';

export default function AppBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <ImageBackground
      source={require('../assets/images/closet-backdrop.png')}
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
  backdropImage: { opacity: 0.4 },
  overlay: { flex: 1, backgroundColor: 'rgba(11, 11, 13, 0.6)' },
});