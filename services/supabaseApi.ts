import { supabase } from '@/lib/supabase';

export interface WardrobeItem {
  id?: string;
  name: string;
  brand?: string;
  category?: string;
  color?: string;
  size?: string;
  season?: string[];
  image_url?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export async function addItem(input: {
  name: string;
  brand?: string;
  category?: string;
  color?: string;
  size?: string;
  season?: string[];
  image_url?: string;
}): Promise<WardrobeItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('items')
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listMyItems(): Promise<WardrobeItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateItem(id: string, updates: Partial<WardrobeItem>): Promise<WardrobeItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteItem(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function getItem(id: string): Promise<WardrobeItem | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return data;
}

// Test connection function
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('_test')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return { success: false, error: error.message };
    }

    console.log('Supabase connection successful');
    console.log('Test data:', data);
    
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Supabase connection failed:', message);
    return { success: false, error: message };
  }
}