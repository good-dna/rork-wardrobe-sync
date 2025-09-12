-- Sneaker Database Tables for Supabase
-- Run this SQL in your Supabase SQL Editor to create the sneaker tables

-- Create sneakers table
CREATE TABLE IF NOT EXISTS public.sneakers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    category TEXT NOT NULL,
    size_us DECIMAL NOT NULL,
    size_uk DECIMAL,
    size_eu DECIMAL,
    size_cm DECIMAL,
    condition TEXT NOT NULL,
    purchase_date DATE,
    purchase_price DECIMAL,
    purchase_location TEXT,
    image_urls TEXT[] DEFAULT '{}',
    sku TEXT,
    style_code TEXT,
    release_date DATE,
    retail_price DECIMAL,
    current_market_price DECIMAL,
    materials TEXT[] DEFAULT '{}',
    colorway_primary TEXT NOT NULL,
    colorway_secondary TEXT,
    colorway_accent TEXT,
    colorway_nickname TEXT,
    limited_edition BOOLEAN DEFAULT FALSE,
    collaboration TEXT,
    designer TEXT,
    technology TEXT[] DEFAULT '{}',
    wear_count INTEGER DEFAULT 0,
    last_worn TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sneaker_collections table
CREATE TABLE IF NOT EXISTS public.sneaker_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sneaker_ids UUID[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sneaker_wishlist table
CREATE TABLE IF NOT EXISTS public.sneaker_wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    colorway_primary TEXT NOT NULL,
    colorway_secondary TEXT,
    colorway_accent TEXT,
    colorway_nickname TEXT,
    size_us DECIMAL NOT NULL,
    size_uk DECIMAL,
    size_eu DECIMAL,
    size_cm DECIMAL,
    estimated_price DECIMAL,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    release_date DATE,
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sneakers_user_id ON public.sneakers(user_id);
CREATE INDEX IF NOT EXISTS idx_sneakers_brand ON public.sneakers(brand);
CREATE INDEX IF NOT EXISTS idx_sneakers_category ON public.sneakers(category);
CREATE INDEX IF NOT EXISTS idx_sneakers_condition ON public.sneakers(condition);
CREATE INDEX IF NOT EXISTS idx_sneakers_is_favorite ON public.sneakers(is_favorite);
CREATE INDEX IF NOT EXISTS idx_sneakers_created_at ON public.sneakers(created_at);
CREATE INDEX IF NOT EXISTS idx_sneakers_wear_count ON public.sneakers(wear_count);
CREATE INDEX IF NOT EXISTS idx_sneakers_last_worn ON public.sneakers(last_worn);

CREATE INDEX IF NOT EXISTS idx_sneaker_collections_user_id ON public.sneaker_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_sneaker_collections_is_public ON public.sneaker_collections(is_public);

CREATE INDEX IF NOT EXISTS idx_sneaker_wishlist_user_id ON public.sneaker_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_sneaker_wishlist_priority ON public.sneaker_wishlist(priority);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sneakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sneaker_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sneaker_wishlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Sneakers policies
CREATE POLICY "Users can view their own sneakers" ON public.sneakers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sneakers" ON public.sneakers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sneakers" ON public.sneakers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sneakers" ON public.sneakers
    FOR DELETE USING (auth.uid() = user_id);

-- Sneaker collections policies
CREATE POLICY "Users can view their own collections and public ones" ON public.sneaker_collections
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own collections" ON public.sneaker_collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON public.sneaker_collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON public.sneaker_collections
    FOR DELETE USING (auth.uid() = user_id);

-- Sneaker wishlist policies
CREATE POLICY "Users can view their own wishlist" ON public.sneaker_wishlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlist items" ON public.sneaker_wishlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlist items" ON public.sneaker_wishlist
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items" ON public.sneaker_wishlist
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_sneakers_updated_at BEFORE UPDATE ON public.sneakers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sneaker_collections_updated_at BEFORE UPDATE ON public.sneaker_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional - only works if user is authenticated)
-- You can run this separately after setting up authentication
/*
INSERT INTO public.sneakers (
    user_id, name, brand, model, category, size_us, condition,
    purchase_date, purchase_price, purchase_location, image_urls,
    sku, style_code, release_date, retail_price, current_market_price,
    materials, colorway_primary, colorway_secondary, colorway_accent, colorway_nickname,
    limited_edition, technology, wear_count, tags, is_favorite
) VALUES (
    auth.uid(), -- This will use the current authenticated user's ID
    'Air Jordan 1 Retro High OG',
    'Jordan',
    'Air Jordan 1',
    'Basketball',
    10.5,
    'New',
    '2024-01-15',
    170,
    'Nike SNKRS',
    ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop'],
    'DZ5485-612',
    '555088-612',
    '2023-12-16',
    170,
    220,
    ARRAY['Leather', 'Synthetic'],
    '#DC143C',
    '#FFFFFF',
    '#000000',
    'Chicago',
    false,
    ARRAY['Air-Sole', 'Encapsulated Air'],
    5,
    ARRAY['retro', 'basketball', 'classic'],
    true
);
*/

-- Grant necessary permissions
GRANT ALL ON public.sneakers TO authenticated;
GRANT ALL ON public.sneaker_collections TO authenticated;
GRANT ALL ON public.sneaker_wishlist TO authenticated;

GRANT SELECT ON public.sneakers TO anon;
GRANT SELECT ON public.sneaker_collections TO anon;
GRANT SELECT ON public.sneaker_wishlist TO anon;