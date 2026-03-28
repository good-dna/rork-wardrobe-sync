import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AvatarOnboarding, { AvatarSettings } from '@/components/AvatarOnboarding';

const AVATAR_SETTINGS_KEY = 'klotho_avatar_settings_v2';

export default function AvatarSetupScreen() {
  const router = useRouter();
  const [visible] = useState(true);

  const handleComplete = async (settings: AvatarSettings) => {
    await AsyncStorage.setItem(AVATAR_SETTINGS_KEY, JSON.stringify(settings));
    router.replace('/(tabs)' as any);
  };

  return (
    <ImageBackground
      source={require('../assets/images/closet-backdrop.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <AvatarOnboarding
          visible={visible}
          onClose={() => {}}
          onComplete={handleComplete}
          existingSettings={null}
          mandatory
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1 },
});
