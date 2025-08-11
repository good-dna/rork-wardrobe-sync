import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';

interface TemperatureBadgeProps {
  temperature: number;
  condition?: string;
  onPress?: () => void;
}

export default function TemperatureBadge({ 
  temperature, 
  condition = 'sunny',
  onPress 
}: TemperatureBadgeProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const glowAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();
    return () => glowAnimation.stop();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={styles.container}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={[colors.primary, '#FFD700']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.content}>
            <Animated.View 
              style={[
                styles.sunContainer,
                { transform: [{ scale: glowAnim }] }
              ]}
            >
              <Sun size={24} color={colors.background} />
            </Animated.View>
            <View style={styles.textContainer}>
              <Text style={styles.temperature}>{temperature}°C</Text>
              <Text style={styles.condition}>Today&apos;s temperature</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    ...tokens.shadow.md,
  },
  gradient: {
    padding: tokens.spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sunContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  temperature: {
    ...tokens.typography.display,
    color: colors.background,
    fontWeight: '700',
  },
  condition: {
    ...tokens.typography.caption,
    color: 'rgba(11, 11, 13, 0.8)',
    marginTop: 2,
  },
});