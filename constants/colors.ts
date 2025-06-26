// Color palette for the app
export const colors = {
  primary: '#6A7FDB', // Soft blue for primary actions
  secondary: '#F7C59F', // Soft peach for accents
  background: '#FFFFFF',
  card: '#F9F9F9',
  text: '#333333',
  subtext: '#666666',
  border: '#EEEEEE',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#2196F3',
  lightGray: '#E0E0E0',
  mediumGray: '#9E9E9E',
  darkGray: '#616161',
};

// Category colors for different clothing types
export const categoryColors = {
  shirts: '#A7C5EB', // Light blue
  pants: '#B5EAD7', // Mint
  jackets: '#E2F0CB', // Light green
  shoes: '#FFD7BA', // Light orange
  accessories: '#C7CEEA', // Lavender
  fragrances: '#FFDAC1', // Peach
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