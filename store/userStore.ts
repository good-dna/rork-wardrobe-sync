import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type StylePreference = 'casual' | 'business' | 'athletic' | 'formal' | 'bohemian' | 'minimalist';
export type FavoriteCategory = 'shirts' | 'pants' | 'jackets' | 'shoes' | 'accessories' | 'fragrances';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  stylePreference: StylePreference;
  favoriteCategory: FavoriteCategory;
  joinDate: string;
  avatar?: string;
}

interface UserState {
  isLoggedIn: boolean;
  profile: UserProfile | null;
  
  // Actions
  login: (profile: UserProfile) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const defaultProfile: UserProfile = {
  id: '1',
  displayName: 'Demo User',
  email: 'demo@example.com',
  stylePreference: 'casual',
  favoriteCategory: 'shirts',
  joinDate: new Date().toISOString(),
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn: true, // Default to logged in for demo purposes
      profile: defaultProfile,
      
      login: (profile) => set({ isLoggedIn: true, profile }),
      
      logout: () => set({ isLoggedIn: false, profile: null }),
      
      updateProfile: (updates) => set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null
      })),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);