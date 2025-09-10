// Premium Dark Theme Design Tokens
export const colors = {
  // Primary gradient backgrounds
  background: '#0B0B0D', // Pure black base
  backgroundSecondary: '#141419', // Charcoal gradient end
  
  // Surface colors
  card: '#1C1C21', // Glass card surface
  cardElevated: '#252529', // Elevated cards
  cardPressed: '#2A2A2F', // Pressed state
  
  // Text hierarchy
  text: '#FFFFFF', // Primary text
  textSecondary: '#B8B8C0', // Secondary text
  textTertiary: '#8A8A95', // Tertiary/disabled text
  
  // Accent colors
  primary: '#F5C85B', // Sun/accent gold
  primaryLight: 'rgba(245, 200, 91, 0.1)', // Light primary background
  secondary: '#8A8AFF', // Action purple
  success: '#52D1A6', // Success green
  error: '#FF6B6B', // Error red
  warning: '#FFB84D', // Warning orange
  info: '#5DADE2', // Info blue
  
  // Interactive states
  border: '#2A2A2F',
  borderActive: '#3A3A3F',
  overlay: 'rgba(0, 0, 0, 0.8)',
  glass: 'rgba(28, 28, 33, 0.8)',
  
  // Legacy support
  subtext: '#B8B8C0',
  lightGray: '#3A3A3F',
  mediumGray: '#8A8A95',
  darkGray: '#5A5A5F',
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
  dark: {
    text: colors.text,
    background: colors.background,
    tint: colors.primary,
    tabIconDefault: colors.mediumGray,
    tabIconSelected: colors.primary,
    card: colors.card,
    border: colors.border,
  },
};