import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item, OutfitSuggestion, WishlistItem, WardrobeFilters, WearLogEntry, WashLogEntry } from '@/types/wardrobe';
import { mockItems, mockOutfitSuggestions, mockWishlist } from '@/constants/mockData';

interface WardrobeState {
  items: Item[];
  outfits: OutfitSuggestion[];
  wishlist: WishlistItem[];
  filters: WardrobeFilters;
  
  // Actions
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  incrementWearCount: (id: string) => void;
  updateCleaningStatus: (id: string, status: Item['cleaningStatus']) => void;
  
  // New actions for wear and wash tracking
  logItemWorn: (id: string, entry: WearLogEntry) => void;
  logItemWashed: (id: string, entry: WashLogEntry) => void;
  setNextWashDue: (id: string, date: string) => void;
  
  addOutfit: (outfit: OutfitSuggestion) => void;
  updateOutfit: (id: string, updates: Partial<OutfitSuggestion>) => void;
  deleteOutfit: (id: string) => void;
  logOutfitWorn: (id: string, date: string) => void;
  
  addWishlistItem: (item: WishlistItem) => void;
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => void;
  deleteWishlistItem: (id: string) => void;
  
  setFilters: (filters: WardrobeFilters) => void;
  clearFilters: () => void;
  
  // Getters
  getItemsByCategory: (category: Item['category']) => Item[];
  getTotalWardrobeValue: () => number;
  getMostWornItems: (limit?: number) => Item[];
  getLeastWornItems: (limit?: number) => Item[];
  getItemsNeedingWash: () => Item[];
  getItemsNotWornSince: (days: number) => Item[];
  getWearCountByTimeframe: (days: number) => { date: string; count: number }[];
}

// Enhance mock items with wear and wash history
const enhancedMockItems = mockItems.map(item => ({
  ...item,
  wearHistory: Array.from({ length: item.wearCount }, (_, i) => ({
    date: new Date(Date.now() - (i * 86400000)).toISOString().split('T')[0],
    notes: ''
  })),
  washHistory: Array.from({ length: Math.floor(item.wearCount / 3) }, (_, i) => ({
    date: new Date(Date.now() - (i * 86400000 * 3)).toISOString().split('T')[0],
    notes: ''
  })),
  nextWashDue: item.cleaningStatus === 'dirty' 
    ? new Date(Date.now() + 86400000).toISOString().split('T')[0] 
    : undefined
}));

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      items: enhancedMockItems,
      outfits: mockOutfitSuggestions,
      wishlist: mockWishlist,
      filters: {},
      
      // Item actions
      addItem: (item) => set((state) => ({ 
        items: [...state.items, { 
          ...item, 
          id: Date.now().toString(),
          wearHistory: [],
          washHistory: []
        }] 
      })),
      
      updateItem: (id, updates) => set((state) => ({
        items: state.items.map((item) => 
          item.id === id ? { ...item, ...updates } : item
        )
      })),
      
      deleteItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id)
      })),
      
      incrementWearCount: (id) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        return {
          items: state.items.map((item) => 
            item.id === id 
              ? { 
                  ...item, 
                  wearCount: item.wearCount + 1,
                  lastWorn: today,
                  wearHistory: [
                    { date: today, notes: '' },
                    ...item.wearHistory || []
                  ]
                } 
              : item
          )
        };
      }),
      
      updateCleaningStatus: (id, status) => set((state) => ({
        items: state.items.map((item) => 
          item.id === id ? { ...item, cleaningStatus: status } : item
        )
      })),
      
      // New actions for wear and wash tracking
      logItemWorn: (id, entry) => set((state) => ({
        items: state.items.map((item) => 
          item.id === id 
            ? { 
                ...item, 
                wearCount: item.wearCount + 1,
                lastWorn: entry.date,
                wearHistory: [entry, ...(item.wearHistory || [])]
              } 
            : item
        )
      })),
      
      logItemWashed: (id, entry) => set((state) => ({
        items: state.items.map((item) => 
          item.id === id 
            ? { 
                ...item, 
                cleaningStatus: 'clean',
                washHistory: [entry, ...(item.washHistory || [])],
                nextWashDue: undefined
              } 
            : item
        )
      })),
      
      setNextWashDue: (id, date) => set((state) => ({
        items: state.items.map((item) => 
          item.id === id ? { ...item, nextWashDue: date } : item
        )
      })),
      
      // Outfit actions
      addOutfit: (outfit) => set((state) => ({ 
        outfits: [...state.outfits, { ...outfit, id: Date.now().toString() }] 
      })),
      
      updateOutfit: (id, updates) => set((state) => ({
        outfits: state.outfits.map((outfit) => 
          outfit.id === id ? { ...outfit, ...updates } : outfit
        )
      })),
      
      deleteOutfit: (id) => set((state) => ({
        outfits: state.outfits.filter((outfit) => outfit.id !== id)
      })),
      
      logOutfitWorn: (id, date) => set((state) => ({
        outfits: state.outfits.map((outfit) => 
          outfit.id === id 
            ? { 
                ...outfit, 
                dateWorn: [...(outfit.dateWorn || []), date]
              } 
            : outfit
        )
      })),
      
      // Wishlist actions
      addWishlistItem: (item) => set((state) => ({ 
        wishlist: [...state.wishlist, { ...item, id: Date.now().toString() }] 
      })),
      
      updateWishlistItem: (id, updates) => set((state) => ({
        wishlist: state.wishlist.map((item) => 
          item.id === id ? { ...item, ...updates } : item
        )
      })),
      
      deleteWishlistItem: (id) => set((state) => ({
        wishlist: state.wishlist.filter((item) => item.id !== id)
      })),
      
      // Filter actions
      setFilters: (filters) => set({ filters }),
      
      clearFilters: () => set({ filters: {} }),
      
      // Getters
      getItemsByCategory: (category) => {
        return get().items.filter((item) => item.category === category);
      },
      
      getTotalWardrobeValue: () => {
        return get().items.reduce((total, item) => total + item.purchasePrice, 0);
      },
      
      getMostWornItems: (limit = 5) => {
        return [...get().items]
          .sort((a, b) => b.wearCount - a.wearCount)
          .slice(0, limit);
      },
      
      getLeastWornItems: (limit = 5) => {
        return [...get().items]
          .sort((a, b) => a.wearCount - b.wearCount)
          .slice(0, limit);
      },
      
      getItemsNeedingWash: () => {
        return get().items.filter(item => 
          item.cleaningStatus === 'dirty' || 
          (item.nextWashDue && new Date(item.nextWashDue) <= new Date())
        );
      },
      
      getItemsNotWornSince: (days) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffString = cutoffDate.toISOString().split('T')[0];
        
        return get().items.filter(item => 
          item.lastWorn < cutoffString
        );
      },
      
      getWearCountByTimeframe: (days) => {
        const result: { date: string; count: number }[] = [];
        const today = new Date();
        
        // Initialize the result array with dates
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          result.push({ date: dateString, count: 0 });
        }
        
        // Count wears for each date
        get().items.forEach(item => {
          if (item.wearHistory) {
            item.wearHistory.forEach(entry => {
              const index = result.findIndex(r => r.date === entry.date);
              if (index !== -1) {
                result[index].count += 1;
              }
            });
          }
        });
        
        return result.reverse();
      },
    }),
    {
      name: 'wardrobe-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);