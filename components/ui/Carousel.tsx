import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { colors, tokens } from '@/constants/colors';

interface CarouselProps {
  children: React.ReactNode[];
  itemWidth?: number;
  spacing?: number;
  showsIndicators?: boolean;
  onSnapToItem?: (index: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function Carousel({ 
  children, 
  itemWidth = screenWidth - 64,
  spacing = 16,
  showsIndicators = true,
  onSnapToItem
}: CarouselProps) {
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffset / (itemWidth + spacing));
        if (index !== activeIndex && index >= 0 && index < children.length) {
          setActiveIndex(index);
          onSnapToItem?.(index);
        }
      }
    }
  );

  const handleMomentumScrollEnd = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (itemWidth + spacing));
    if (index !== activeIndex && index >= 0 && index < children.length) {
      setActiveIndex(index);
      onSnapToItem?.(index);
    }
  };

  const renderIndicators = () => {
    if (!showsIndicators || children.length <= 1) return null;

    return (
      <View style={styles.indicatorContainer}>
        {children.map((_, index) => {
          const inputRange = [
            (index - 1) * (itemWidth + spacing),
            index * (itemWidth + spacing),
            (index + 1) * (itemWidth + spacing),
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.indicator,
                {
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate='fast'
        snapToInterval={itemWidth + spacing}
        snapToAlignment='start'
        contentInset={Platform.OS === 'ios' ? { left: spacing, right: spacing } : undefined}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingHorizontal: Platform.OS === 'android' ? spacing : 0 }
        ]}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        bounces={true}
        bouncesZoom={false}
      >
        {children.map((child, index) => (
          <View key={index} style={[styles.item, { width: itemWidth, marginRight: index === children.length - 1 ? 0 : spacing }]}>
            {child}
          </View>
        ))}
      </ScrollView>
      {renderIndicators()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.md,
  },
  scrollContainer: {
    alignItems: 'center',
  },
  item: {
    // marginRight handled dynamically in render
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.spacing.lg,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
  },
});