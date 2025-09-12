import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we're using demo/development credentials
const isDemoMode = supabaseUrl === 'https://demo.supabase.co' || supabaseAnonKey === 'demo_anon_key';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a mock client for demo mode
const createMockClient = () => {
  const mockResponse = { data: [], error: null };
  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    eq: () => mockQuery,
    ilike: () => mockQuery,
    limit: () => mockQuery,
    order: () => mockQuery,
    then: (callback: (result: any) => any) => Promise.resolve(callback(mockResponse))
  };
  
  return {
    from: () => mockQuery,
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null })
    }
  };
};

// Client for frontend use (with RLS)
export const supabase = isDemoMode 
  ? createMockClient() as any
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });

// Admin client for backend use (bypasses RLS)
export const supabaseAdmin = isDemoMode || !supabaseServiceRoleKey
  ? null
  : createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      wardrobe_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand: string | null;
          category: string;
          color: string | null;
          size: string | null;
          material: string | null;
          season: string[] | null;
          image_url: string | null;
          bg_removed_url: string | null;
          barcode: string | null;
          sku: string | null;
          source: string;
          price: number | null;
          purchase_date: string | null;
          tags: string[] | null;
          notes: string | null;
          waterproof: boolean | null;
          warmth_rating: number | null;
          breathability: number | null;
          fragrance_family: string | null;
          strap_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          brand?: string | null;
          category: string;
          color?: string | null;
          size?: string | null;
          material?: string | null;
          season?: string[] | null;
          image_url?: string | null;
          bg_removed_url?: string | null;
          barcode?: string | null;
          sku?: string | null;
          source: string;
          price?: number | null;
          purchase_date?: string | null;
          tags?: string[] | null;
          notes?: string | null;
          waterproof?: boolean | null;
          warmth_rating?: number | null;
          breathability?: number | null;
          fragrance_family?: string | null;
          strap_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          brand?: string | null;
          category?: string;
          color?: string | null;
          size?: string | null;
          material?: string | null;
          season?: string[] | null;
          image_url?: string | null;
          bg_removed_url?: string | null;
          barcode?: string | null;
          sku?: string | null;
          source?: string;
          price?: number | null;
          purchase_date?: string | null;
          tags?: string[] | null;
          notes?: string | null;
          waterproof?: boolean | null;
          warmth_rating?: number | null;
          breathability?: number | null;
          fragrance_family?: string | null;
          strap_type?: string | null;
          updated_at?: string;
        };
      };
      outfits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          items: string[];
          occasion: string | null;
          season: string[] | null;
          weather_min_temp: number | null;
          weather_max_temp: number | null;
          weather_conditions: string[] | null;
          image_url: string | null;
          is_favorite: boolean;
          wear_count: number;
          last_worn: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          items: string[];
          occasion?: string | null;
          season?: string[] | null;
          weather_min_temp?: number | null;
          weather_max_temp?: number | null;
          weather_conditions?: string[] | null;
          image_url?: string | null;
          is_favorite?: boolean;
          wear_count?: number;
          last_worn?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          items?: string[];
          occasion?: string | null;
          season?: string[] | null;
          weather_min_temp?: number | null;
          weather_max_temp?: number | null;
          weather_conditions?: string[] | null;
          image_url?: string | null;
          is_favorite?: boolean;
          wear_count?: number;
          last_worn?: string | null;
          updated_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          user_id: string;
          date_ymd: string;
          outfit_id: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date_ymd: string;
          outfit_id: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date_ymd?: string;
          outfit_id?: string;
          notes?: string | null;
          updated_at?: string;
        };
      };
      sneakers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand: string;
          model: string;
          category: string;
          size_us: number;
          size_uk: number | null;
          size_eu: number | null;
          size_cm: number | null;
          condition: string;
          purchase_date: string | null;
          purchase_price: number | null;
          purchase_location: string | null;
          image_urls: string[];
          sku: string | null;
          style_code: string | null;
          release_date: string | null;
          retail_price: number | null;
          current_market_price: number | null;
          materials: string[];
          colorway_primary: string;
          colorway_secondary: string | null;
          colorway_accent: string | null;
          colorway_nickname: string | null;
          limited_edition: boolean;
          collaboration: string | null;
          designer: string | null;
          technology: string[];
          wear_count: number;
          last_worn: string | null;
          notes: string | null;
          tags: string[];
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          brand: string;
          model: string;
          category: string;
          size_us: number;
          size_uk?: number | null;
          size_eu?: number | null;
          size_cm?: number | null;
          condition: string;
          purchase_date?: string | null;
          purchase_price?: number | null;
          purchase_location?: string | null;
          image_urls: string[];
          sku?: string | null;
          style_code?: string | null;
          release_date?: string | null;
          retail_price?: number | null;
          current_market_price?: number | null;
          materials: string[];
          colorway_primary: string;
          colorway_secondary?: string | null;
          colorway_accent?: string | null;
          colorway_nickname?: string | null;
          limited_edition?: boolean;
          collaboration?: string | null;
          designer?: string | null;
          technology: string[];
          wear_count?: number;
          last_worn?: string | null;
          notes?: string | null;
          tags: string[];
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          brand?: string;
          model?: string;
          category?: string;
          size_us?: number;
          size_uk?: number | null;
          size_eu?: number | null;
          size_cm?: number | null;
          condition?: string;
          purchase_date?: string | null;
          purchase_price?: number | null;
          purchase_location?: string | null;
          image_urls?: string[];
          sku?: string | null;
          style_code?: string | null;
          release_date?: string | null;
          retail_price?: number | null;
          current_market_price?: number | null;
          materials?: string[];
          colorway_primary?: string;
          colorway_secondary?: string | null;
          colorway_accent?: string | null;
          colorway_nickname?: string | null;
          limited_edition?: boolean;
          collaboration?: string | null;
          designer?: string | null;
          technology?: string[];
          wear_count?: number;
          last_worn?: string | null;
          notes?: string | null;
          tags?: string[];
          is_favorite?: boolean;
          updated_at?: string;
        };
      };
      sneaker_collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          sneaker_ids: string[];
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          sneaker_ids: string[];
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          sneaker_ids?: string[];
          is_public?: boolean;
          updated_at?: string;
        };
      };
      sneaker_wishlist: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand: string;
          model: string;
          colorway_primary: string;
          colorway_secondary: string | null;
          colorway_accent: string | null;
          colorway_nickname: string | null;
          size_us: number;
          size_uk: number | null;
          size_eu: number | null;
          size_cm: number | null;
          estimated_price: number | null;
          priority: string;
          release_date: string | null;
          image_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          brand: string;
          model: string;
          colorway_primary: string;
          colorway_secondary?: string | null;
          colorway_accent?: string | null;
          colorway_nickname?: string | null;
          size_us: number;
          size_uk?: number | null;
          size_eu?: number | null;
          size_cm?: number | null;
          estimated_price?: number | null;
          priority: string;
          release_date?: string | null;
          image_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          brand?: string;
          model?: string;
          colorway_primary?: string;
          colorway_secondary?: string | null;
          colorway_accent?: string | null;
          colorway_nickname?: string | null;
          size_us?: number;
          size_uk?: number | null;
          size_eu?: number | null;
          size_cm?: number | null;
          estimated_price?: number | null;
          priority?: string;
          release_date?: string | null;
          image_url?: string | null;
          notes?: string | null;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];