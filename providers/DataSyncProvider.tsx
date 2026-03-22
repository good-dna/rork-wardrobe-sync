import { useEffect, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVATAR_KEY = 'klotho_user_avatar';
const AVATAR_METHOD_KEY = 'klotho_avatar_method';

function dbRowToItem(row: any) {
  return {
    id: row.id,
    name: row.name || '',
    brand: row.brand || '',
    category: row.category || 'shirts',
    color: row.color || '',
    material: row.material || '',
    season: Array.isArray(row.season) ? row.season : [row.season || 'all'],
    purchaseDate: row.purchase_date || new Date().toISOString().split('T')[0],
    purchasePrice: row.purchase_price || 0,
    wearCount: row.wear_count || 0,
    lastWorn: row.last_worn || new Date().toISOString().split('T')[0],
    imageUrl: row.bg_removed_url || row.image_url || '',
    notes: row.notes || '',
    tags: row.tags || [],
    cleaningStatus: row.cleaning_status || 'clean',
    wearHistory: row.wear_history || [],
    washHistory: row.wash_history || [],
  };
}

export function useDataSync() {
  const { user } = useAuth();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!user) { hasSynced.current = false; return; }
    if (hasSynced.current) return;
    hasSynced.current = true;

    const sync = async () => {
      try {
        // Load wardrobe items
        const { data, error } = await supabase
          .from('wardrobe_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data?.length) {
          const store = useWardrobeStore.getState();
          const existingIds = new Set(store.items.map((i: any) => i.id));
          data.forEach(row => {
            if (!existingIds.has(row.id)) store.addItem(dbRowToItem(row));
          });
        }

        // Load avatar
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (profile?.avatar_url) {
          const existing = await AsyncStorage.getItem(AVATAR_KEY);
          if (!existing) {
            await AsyncStorage.setItem(AVATAR_KEY, profile.avatar_url);
            await AsyncStorage.setItem(AVATAR_METHOD_KEY, 'backdrop');
          }
        }
      } catch (err) {
        console.warn('Data sync failed:', err);
      }
    };

    sync();
  }, [user]);
}

export default function DataSyncProvider({ children }: { children: React.ReactNode }) {
  useDataSync();
  return children as any;
}
