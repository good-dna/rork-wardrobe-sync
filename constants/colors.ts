// Clean Light Theme Design Tokens
export const colors = {
  // Primary backgrounds
  background: '#FFFFFF', // Pure white base
  backgroundSecondary: '#F8F9FA', // Light gray secondary
  
  // Surface colors
  card: '#FFFFFF', // White card surface
  cardElevated: '#FFFFFF', // Elevated cards
  cardPressed: '#F5F5F7', // Pressed state
  
  // Text hierarchy
  text: '#1C1C1E', // Primary text (near black)
  textSecondary: '#6C6C70', // Secondary text
  textTertiary: '#AEAEB2', // Tertiary/disabled text
  
  // Accent colors
  primary: '#007AFF', // iOS blue
  primaryLight: 'rgba(0, 122, 255, 0.1)', // Light primary background
  secondary: '#5856D6', // iOS purple
  success: '#34C759', // iOS green
  error: '#FF3B30', // iOS red
  warning: '#FF9500', // iOS orange
  info: '#5AC8FA', // iOS cyan
  
  // Interactive states
  border: '#E5E5EA',
  borderActive: '#C6C6C8',
  overlay: 'rgba(0, 0, 0, 0.4)',
  glass: 'rgba(255, 255, 255, 0.8)',
  
  // Legacy support
  subtext: '#6C6C70',
  lightGray: '#F2F2F7',
  mediumGray: '#AEAEB2',
  darkGray: '#8E8E93',
};

// Design tokens
export const tokens = {
  // Spacing scale
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  
  // Typography
  typography: {
    display: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
  },
  
  // Shadows
  shadow: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Animation durations
  animation: {
    fast: 200,
    normal: 280,
    slow: 450,
    spring: 600,
  },
};

// Category colors for different clothing types
export const categoryColors = {
  shirts: '#5DADE2', // Cool blue
  pants: '#52D1A6', // Success green
  jackets: '#8A8AFF', // Action purple
  shoes: '#FFB84D', // Warning orange
  accessories: '#FF6B6B', // Error red
  fragrances: '#F5C85B', // Primary gold
};

export default {
  light: {
    text: colors.text,
    background: colors.background,
    tint: colors.primary,
    tabIconDefault: colors.mediumGray,
    tabIconSelected: colors.primary,
    card: colors.card,
    border: colors.border,
  },
};