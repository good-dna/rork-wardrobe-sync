import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

export const useWearLog = () => {
  const [logging, setLogging] = useState(false);

  const logWear = async (itemId: string, notes?: string) => {
    try {
      setLogging(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('wear_logs')
        .insert({
          user_id: user.id,
          item_id: itemId,
          worn_at: new Date().toISOString(),
          source: 'manual',
          notes: notes || null,
        });

      if (error) {
        console.error('Error logging wear:', error);
        Alert.alert('Error', 'Failed to log wear');
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error in logWear:', err);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLogging(false);
    }
  };

  return { logWear, logging };
};
