import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions, Animated } from 'react-native';
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
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffset / (itemWidth + spacing));
        if (index !== activeIndex) {
          setActiveIndex(index);
          onSnapToItem?.(index);
        }
      }
    }
  );

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
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate='fast'
        snapToInterval={itemWidth + spacing}
        snapToAlignment='start'
        contentInset={{ left: spacing, right: spacing }}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingHorizontal: spacing }
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {children.map((child, index) => (
          <View key={index} style={[styles.item, { width: itemWidth }]}>
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
    marginRight: tokens.spacing.md,
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