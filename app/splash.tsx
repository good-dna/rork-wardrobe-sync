import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  PanResponder,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Scan, Calendar, Plus, ArrowUp } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import Typography from '@/components/ui/Typography';
import Card from '@/components/ui/Card';

const { height: screenHeight } = Dimensions.get('window');

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
}

function ActionCard({ title, subtitle, icon, onPress }: ActionCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={styles.actionCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={title}
        accessibilityHint={subtitle}
      >
        <Card style={styles.cardContent} glass>
          <View style={styles.iconContainer}>
            {icon}
          </View>
          <Typography variant="h3" style={styles.cardTitle}>
            {title}
          </Typography>
          <Typography variant="caption" color={colors.textSecondary}>
            {subtitle}
          </Typography>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

export default function SplashScreen() {
  const router = useRouter();
  const [showCards, setShowCards] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const parallaxAnim = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation sequence
    Animated.sequence([
      // Logo fade in
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Text fade in with slight delay
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Overall fade and scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, logoOpacity, scaleAnim, textOpacity]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 10 && gestureState.dy < 0;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy < 0 && !isRevealed) {
        const progress = Math.min(Math.abs(gestureState.dy) / 100, 1);
        parallaxAnim.setValue(progress);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy < -50 && !isRevealed) {
        revealCards();
      } else {
        Animated.spring(parallaxAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const revealCards = () => {
    setIsRevealed(true);
    setShowCards(true);
    
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(parallaxAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleEnter = () => {
    router.replace('/(tabs)');
  };

  const handleSignIn = () => {
    // Navigate to sign in
    console.log('Sign In pressed');
  };

  const handleCreateAccount = () => {
    // Navigate to create account
    console.log('Create Account pressed');
  };

  const handleScanAdd = () => {
    router.push('/add-item');
  };

  const handleTodaysDrop = () => {
    router.push('/(tabs)/wardrobe');
  };

  const handleUpcomingRotations = () => {
    router.push('/(tabs)/calendar');
  };

  const logoTransform = {
    transform: [
      {
        translateY: parallaxAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -50],
        }),
      },
      {
        scale: parallaxAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.8],
        }),
      },
    ],
    opacity: parallaxAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.3],
    }),
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <LinearGradient
        colors={['#0C0C0F', '#141419', '#0B0B0D']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Hero Background Image */}
        <View style={styles.heroBackground}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=1200&fit=crop&crop=center' }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(12, 12, 15, 0.8)', '#0C0C0F']}
            style={styles.overlay}
          />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Logo and Brand */}
            <Animated.View style={[styles.logoSection, logoTransform]}>
              <Animated.View style={[styles.logoContainer, { opacity: logoOpacity }]}>
                {/* Crypto Closet inspired logo */}
                <View style={styles.logo}>
                  <View style={styles.logoCircle}>
                    <View style={styles.logoHanger} />
                    <Typography variant="display" style={styles.logoText}>
                      C
                    </Typography>
                  </View>
                </View>
              </Animated.View>
              
              <Animated.View style={[styles.brandText, { opacity: textOpacity }]}>
                <Typography variant="display" style={styles.headline}>
                  YOUR CLOSET,
                </Typography>
                <Typography variant="display" style={styles.headline}>
                  UNLOCKED
                </Typography>
                <Typography variant="body" style={styles.subline}>
                  Discover, organize, and style your wardrobe with AI-powered insights
                </Typography>
              </Animated.View>
            </Animated.View>

            {/* CTA Section */}
            {!isRevealed && (
              <View style={styles.ctaSection}>
                <Pressable style={styles.enterButton} onPress={handleEnter}>
                  <Typography variant="h3" style={styles.enterText}>
                    Enter
                  </Typography>
                </Pressable>
                
                <View style={styles.secondaryActions}>
                  <Pressable style={styles.secondaryButton} onPress={handleSignIn}>
                    <Typography variant="caption" style={styles.secondaryText}>
                      Sign In
                    </Typography>
                  </Pressable>
                  <Pressable style={styles.secondaryButton} onPress={handleCreateAccount}>
                    <Typography variant="caption" style={styles.secondaryText}>
                      Create Account
                    </Typography>
                  </Pressable>
                </View>

                {/* Swipe Up Indicator */}
                <View style={styles.swipeIndicator}>
                  <ArrowUp size={20} color={colors.textSecondary} />
                  <Typography variant="small" color={colors.textSecondary}>
                    Swipe up to explore
                  </Typography>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Revealed Cards */}
          {showCards && (
            <Animated.View 
              style={[
                styles.cardsContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.cardsGrid}>
                <ActionCard
                  title="Today's Drop"
                  subtitle="Fresh outfit suggestions"
                  icon={<Plus size={24} color={colors.primary} />}
                  onPress={handleTodaysDrop}
                />
                <ActionCard
                  title="Scan & Add"
                  subtitle="Add items to your closet"
                  icon={<Scan size={24} color={colors.secondary} />}
                  onPress={handleScanAdd}
                />
                <ActionCard
                  title="Upcoming Rotations"
                  subtitle="Plan your weekly looks"
                  icon={<Calendar size={24} color={colors.success} />}
                  onPress={handleUpcomingRotations}
                />
              </View>
            </Animated.View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: tokens.spacing.xl,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: tokens.spacing.xxl,
  },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    ...tokens.shadow.lg,
  },
  logoHanger: {
    position: 'absolute',
    top: 20,
    width: 40,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  logoText: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: '700',
  },
  brandText: {
    alignItems: 'center',
  },
  headline: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 42,
  },
  subline: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: tokens.spacing.md,
    maxWidth: 280,
    lineHeight: 22,
  },
  ctaSection: {
    alignItems: 'center',
    paddingBottom: tokens.spacing.xl,
  },
  enterButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: tokens.spacing.xxl,
    paddingVertical: tokens.spacing.lg,
    borderRadius: tokens.radius.full,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadow.md,
  },
  enterText: {
    color: colors.background,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: tokens.spacing.xl,
    marginBottom: tokens.spacing.xxl,
  },
  secondaryButton: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
  },
  secondaryText: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  swipeIndicator: {
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  cardsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: tokens.radius.xxl,
    borderTopRightRadius: tokens.radius.xxl,
    padding: tokens.spacing.xl,
    ...tokens.shadow.lg,
  },
  cardsGrid: {
    gap: tokens.spacing.lg,
  },
  actionCard: {
    marginBottom: tokens.spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  cardTitle: {
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
});