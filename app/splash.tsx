import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Configuration constants
const AUTO_NAV_DELAY_MS = 2500;
const SHOW_SKIP = true;
const TAGLINE_TEXT = 'Your AI-Powered Wardrobe';

interface SplashScreenProps {
  logoSrc?: string;
  wordmarkText?: string;
  tagline?: string;
  autoNav?: boolean;
  autoNavTo?: string;
  autoNavDelay?: number;
  showSkip?: boolean;
}

export default function SplashScreen({
  logoSrc,
  wordmarkText = 'KLOTHO',
  tagline = TAGLINE_TEXT,
  autoNav = true,
  autoNavTo = '/(tabs)',
  autoNavDelay = AUTO_NAV_DELAY_MS,
  showSkip = SHOW_SKIP,
}: SplashScreenProps = {}) {
  const router = useRouter();

  const [isNavigating, setIsNavigating] = useState(false);
  
  // Animation values
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const threadAnimation = useRef(new Animated.Value(0)).current;
  const skipOpacity = useRef(new Animated.Value(0.7)).current;
  const pageOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;

  const startAnimationSequence = useCallback(() => {
    // 0-600ms: Fade in background and logo
    Animated.sequence([
      Animated.parallel([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // 600-2000ms: Logo spin and glow + wordmark fade in
      Animated.parallel([
        // Logo slow spin loop (15-20° oscillation)
        Animated.loop(
          Animated.sequence([
            Animated.timing(logoRotation, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(logoRotation, {
              toValue: -1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(logoRotation, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          { iterations: -1 }
        ),
        // Soft pulsing glow
        Animated.loop(
          Animated.sequence([
            Animated.timing(logoGlow, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(logoGlow, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          { iterations: -1 }
        ),
        // Wordmark fade in at 1200ms
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(wordmarkOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        // Tagline fade in at 1400ms
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Golden thread animation 1200-2200ms
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(threadAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(threadAnimation, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [backgroundOpacity, logoOpacity, logoRotation, logoGlow, wordmarkOpacity, taglineOpacity, threadAnimation]);

  const handleNavigation = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    
    // Navigation animation: scale down logo and fade page
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 0.96,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(pageOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace(autoNavTo);
    });
  }, [isNavigating, logoScale, pageOpacity, router, autoNavTo]);

  useEffect(() => {
    startAnimationSequence();
    
    if (autoNav) {
      const timer = setTimeout(() => {
        handleNavigation();
      }, autoNavDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoNav, autoNavDelay, handleNavigation, startAnimationSequence]);

  const handleSkip = () => {
    handleNavigation();
  };

  const handleSkipPressIn = () => {
    Animated.timing(skipOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleSkipPressOut = () => {
    Animated.timing(skipOpacity, {
      toValue: 0.7,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const logoRotationInterpolate = logoRotation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '20deg'],
  });

  const logoGlowInterpolate = logoGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const threadRotation = threadAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '360deg'],
  });

  const threadOpacity = threadAnimation.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View style={[styles.container, { opacity: pageOpacity }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Jet Black Background */}
        <Animated.View 
          style={[
            styles.background, 
            { opacity: backgroundOpacity }
          ]} 
        />
        
        {/* Center Content */}
        <View style={styles.centerContent}>
          {/* Spindle Logo with Glow */}
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [
                  { rotate: logoRotationInterpolate },
                  { scale: logoScale },
                ],
              },
            ]}
          >
            {/* Glow Effect */}
            <Animated.View 
              style={[
                styles.logoGlow,
                {
                  opacity: logoGlowInterpolate,
                },
              ]} 
            />
            
            {/* Golden Thread Arc */}
            <Animated.View 
              style={[
                styles.goldenThread,
                {
                  opacity: threadOpacity,
                  transform: [{ rotate: threadRotation }],
                },
              ]} 
            />
            
            {/* Spindle Logo - Fallback to text-based design */}
            <View style={styles.spindleLogo}>
              <View style={styles.spindleTop} />
              <View style={styles.spindleMiddle} />
              <View style={styles.spindleBottom} />
            </View>
          </Animated.View>
          
          {/* KLOTHO Wordmark */}
          <Animated.View 
            style={[
              styles.wordmarkContainer,
              { opacity: wordmarkOpacity },
            ]}
          >
            <Text style={styles.wordmark}>{wordmarkText}</Text>
          </Animated.View>
          
          {/* Tagline */}
          <Animated.View 
            style={[
              styles.taglineContainer,
              { opacity: taglineOpacity },
            ]}
          >
            <Text style={styles.tagline}>{tagline}</Text>
          </Animated.View>
        </View>
        
        {/* Skip Button */}
        {showSkip && (
          <Animated.View 
            style={[
              styles.skipContainer,
              { opacity: skipOpacity },
            ]}
          >
            <Pressable
              style={styles.skipButton}
              onPress={handleSkip}
              onPressIn={handleSkipPressIn}
              onPressOut={handleSkipPressOut}
              accessibilityLabel="Skip splash screen"
              accessibilityRole="button"
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </Animated.View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000', // Jet Black
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#C8A45D',
    shadowColor: '#C8A45D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  goldenThread: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#C8A45D',
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  spindleLogo: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  spindleTop: {
    width: 60,
    height: 8,
    backgroundColor: '#C8A45D',
    borderRadius: 4,
    marginBottom: 4,
  },
  spindleMiddle: {
    width: 4,
    height: 40,
    backgroundColor: '#C8A45D',
    borderRadius: 2,
    marginBottom: 4,
  },
  spindleBottom: {
    width: 60,
    height: 8,
    backgroundColor: '#C8A45D',
    borderRadius: 4,
  },
  wordmarkContainer: {
    marginBottom: 16,
  },
  wordmark: {
    fontSize: 42,
    fontWeight: '600',
    color: '#C8A45D', // Metallic gold
    textAlign: 'center',
    letterSpacing: 4,
    fontFamily: 'System', // Will use SF Pro on iOS, Roboto on Android
  },
  taglineContainer: {
    marginTop: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: '#F5F5F5', // Soft white
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  skipContainer: {
    position: 'absolute',
    bottom: 60,
    right: 24,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#F5F5F5',
    opacity: 0.7,
  },
});