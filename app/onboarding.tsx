import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Shirt, Cloud, Sun, Ruler } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingScreenType {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  buttonText: string;
}

const weatherIconStyles = {
  weatherIcon: {
    position: 'relative' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sunIcon: {
    position: 'absolute' as const,
    top: -10,
    right: -20,
  },
};

const screens: OnboardingScreenType[] = [
  {
    id: 1,
    title: 'AI That Curates\nYour Fit',
    subtitle: 'Get personalized outfits tailored to your\nwardrobe, events, and style.',
    icon: <Shirt size={120} color="#FFFFFF" strokeWidth={1} />,
    buttonText: 'Get Started',
  },
  {
    id: 2,
    title: 'Dress Smart,\nAnywhere',
    subtitle: 'Clotho checks your local forecast to\nrecommend weather-perfect looks.',
    icon: (
      <View style={weatherIconStyles.weatherIcon}>
        <Cloud size={80} color="#FFFFFF" strokeWidth={1} />
        <Sun size={60} color="#C8A45D" strokeWidth={1} style={weatherIconStyles.sunIcon} />
      </View>
    ),
    buttonText: 'Next',
  },
  {
    id: 3,
    title: 'Fits That\nJust Work',
    subtitle: 'AI predicts perfect sizes for shoes,\nclothes, watches, and fragrances.',
    icon: <Ruler size={120} color="#FFFFFF" strokeWidth={1} />,
    buttonText: 'Finish Setup',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentIndex < screens.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      animateTransition();
    } else {
      router.replace('/avatar-setup' as any);
    }
  };

  const animateTransition = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollX / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const renderScreen = (screen: OnboardingScreenType, index: number) => (
    <View key={screen.id} style={styles.screenContainer}>
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#000000']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Brand */}
            <View style={styles.brandContainer}>
              <Text style={styles.brandText}>Clotho</Text>
            </View>

            {/* Icon */}
            <Animated.View 
              style={[
                styles.iconContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {screen.icon}
            </Animated.View>

            {/* Text Content */}
            <Animated.View 
              style={[
                styles.textContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Text style={styles.title}>{screen.title}</Text>
              <Text style={styles.subtitle}>{screen.subtitle}</Text>
            </Animated.View>

            {/* CTA Button */}
            <Animated.View 
              style={[
                styles.buttonContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.ctaButton,
                  pressed && styles.ctaButtonPressed,
                ]}
                onPress={handleNext}
              >
                <Text style={styles.ctaButtonText}>{screen.buttonText}</Text>
              </Pressable>
            </Animated.View>

            {/* Progress Dots */}
            <View style={styles.dotsContainer}>
              {screens.map((_, dotIndex) => (
                <View
                  key={dotIndex}
                  style={[
                    styles.dot,
                    dotIndex === currentIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {screens.map((screen, index) => renderScreen(screen, index))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  screenContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    paddingTop: 20,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60,
  },
  weatherIcon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunIcon: {
    position: 'absolute',
    top: -10,
    right: -20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#B3B3B3',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#C8A45D',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C8A45D',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: '#C8A45D',
    width: 24,
  },
});