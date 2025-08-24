import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationPreferences, WeatherCache, WeatherRule } from '@/types/wardrobe';

export type StylePreference = 'casual' | 'business' | 'athletic' | 'formal' | 'bohemian' | 'minimalist';
export type FavoriteCategory = 'shirts' | 'pants' | 'jackets' | 'shoes' | 'accessories' | 'fragrances';

// Export default preferences for use in components
export { defaultLocationPreferences };

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  stylePreference: StylePreference;
  favoriteCategory: FavoriteCategory;
  joinDate: string;
  avatar?: string;
  locationPreferences?: LocationPreferences;
}

interface UserState {
  isLoggedIn: boolean;
  profile: UserProfile | null;
  weatherCache: WeatherCache | null;
  
  // Actions
  login: (profile: UserProfile) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateLocationPreferences: (preferences: Partial<LocationPreferences>) => void;
  updateWeatherCache: (cache: WeatherCache) => void;
  clearWeatherCache: () => void;
}

const defaultLocationPreferences: LocationPreferences = {
  units: 'metric',
  tempBasis: 'actual',
  weatherFlags: {
    rain: true,
    wind: true,
    uv: true,
    humidity: true,
    pollen: false,
  },
  rules: [
    {
      id: '1',
      name: 'Cold Weather',
      condition: { type: 'temperature', operator: 'lt', value: 7 }, // 45°F
      recommendationTags: ['thermal', 'insulated', 'warm', 'layers'],
      enabled: true,
    },
    {
      id: '2',
      name: 'Rainy Weather',
      condition: { type: 'precipitation', operator: 'gte', value: 40 },
      recommendationTags: ['waterproof', 'umbrella', 'rubber_strap'],
      enabled: true,
    },
    {
      id: '3',
      name: 'High UV',
      condition: { type: 'uv', operator: 'gte', value: 6 },
      recommendationTags: ['sunglasses', 'hat', 'spf'],
      enabled: true,
    },
    {
      id: '4',
      name: 'Hot & Humid',
      condition: { type: 'humidity', operator: 'gte', value: 70 },
      recommendationTags: ['breathable', 'lightweight', 'fresh_fragrance'],
      enabled: true,
    },
  ],
};

const defaultProfile: UserProfile = {
  id: '1',
  displayName: 'Demo User',
  email: 'demo@example.com',
  stylePreference: 'casual',
  favoriteCategory: 'shirts',
  joinDate: new Date().toISOString(),
  locationPreferences: defaultLocationPreferences,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn: true, // Default to logged in for demo purposes
      profile: defaultProfile,
      weatherCache: null,
      
      login: (profile) => set({ isLoggedIn: true, profile }),
      
      logout: () => set({ isLoggedIn: false, profile: null, weatherCache: null }),
      
      updateProfile: (updates) => set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null
      })),
      
      updateLocationPreferences: (preferences) => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          locationPreferences: {
            ...state.profile.locationPreferences,
            ...defaultLocationPreferences,
            ...preferences,
          }
        } : null
      })),
      
      updateWeatherCache: (cache) => set({ weatherCache: cache }),
      
      clearWeatherCache: () => set({ weatherCache: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);