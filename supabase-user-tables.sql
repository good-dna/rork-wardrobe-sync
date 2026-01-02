-- User Database Tables for Supabase Wardrobe App
-- Run this SQL in your Supabase SQL Editor to create all necessary tables

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    location TEXT,
    city TEXT,
    country TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    temperature_unit TEXT DEFAULT 'celsius' CHECK (temperature_unit IN ('celsius', 'fahrenheit')),
    style_preferences TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WARDROBE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wardrobe_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT NOT NULL,
    color TEXT,
    size TEXT,
    material TEXT,
    season TEXT[] DEFAULT '{}',
    image_url TEXT,
    bg_removed_url TEXT,
    barcode TEXT,
    sku TEXT,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'scan', 'ai')),
    price DECIMAL,
    purchase_date DATE,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    
    -- Category-specific attributes
    waterproof BOOLEAN,
    warmth_rating INTEGER CHECK (warmth_rating BETWEEN 1 AND 5),
    breathability INTEGER CHECK (breathability BETWEEN 1 AND 5),
    fragrance_family TEXT,
    strap_type TEXT,
    
    -- Usage tracking
    worn_count INTEGER DEFAULT 0,
    last_worn TIMESTAMP WITH TIME ZONE,
    is_favorite BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- OUTFITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.outfits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    items UUID[] DEFAULT '{}',
    
    -- Occasion and season
    occasion TEXT,
    season TEXT[] DEFAULT '{}',
    
    -- Weather suitability
    weather_min_temp DECIMAL,
    weather_max_temp DECIMAL,
    weather_conditions TEXT[] DEFAULT '{}',
    
    -- Media
    image_url TEXT,
    
    -- Tracking
    is_favorite BOOLEAN DEFAULT FALSE,
    wear_count INTEGER DEFAULT 0,
    last_worn TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PLANS TABLE (Calendar/Scheduled Outfits)
-- ============================================
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date_ymd DATE NOT NULL,
    outfit_id UUID REFERENCES public.outfits(id) ON DELETE CASCADE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date_ymd)
);

-- ============================================
-- WISHLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT NOT NULL,
    color TEXT,
    size TEXT,
    estimated_price DECIMAL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    image_url TEXT,
    link_url TEXT,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);

-- Wardrobe items indexes
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_id ON public.wardrobe_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_category ON public.wardrobe_items(category);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_color ON public.wardrobe_items(color);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_brand ON public.wardrobe_items(brand);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_is_favorite ON public.wardrobe_items(is_favorite);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_created_at ON public.wardrobe_items(created_at);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_worn_count ON public.wardrobe_items(worn_count);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_last_worn ON public.wardrobe_items(last_worn);

-- Outfits indexes
CREATE INDEX IF NOT EXISTS idx_outfits_user_id ON public.outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_outfits_occasion ON public.outfits(occasion);
CREATE INDEX IF NOT EXISTS idx_outfits_is_favorite ON public.outfits(is_favorite);
CREATE INDEX IF NOT EXISTS idx_outfits_created_at ON public.outfits(created_at);
CREATE INDEX IF NOT EXISTS idx_outfits_wear_count ON public.outfits(wear_count);
CREATE INDEX IF NOT EXISTS idx_outfits_last_worn ON public.outfits(last_worn);

-- Plans indexes
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON public.plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_date_ymd ON public.plans(date_ymd);
CREATE INDEX IF NOT EXISTS idx_plans_outfit_id ON public.plans(outfit_id);
CREATE INDEX IF NOT EXISTS idx_plans_user_date ON public.plans(user_id, date_ymd);

-- Wishlist indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_priority ON public.wishlist(priority);
CREATE INDEX IF NOT EXISTS idx_wishlist_category ON public.wishlist(category);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- RLS POLICIES - WARDROBE ITEMS
-- ============================================

CREATE POLICY "Users can view their own items"
ON public.wardrobe_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
ON public.wardrobe_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
ON public.wardrobe_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
ON public.wardrobe_items FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - OUTFITS
-- ============================================

CREATE POLICY "Users can view their own outfits"
ON public.outfits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outfits"
ON public.outfits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outfits"
ON public.outfits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outfits"
ON public.outfits FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - PLANS
-- ============================================

CREATE POLICY "Users can view their own plans"
ON public.plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans"
ON public.plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
ON public.plans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
ON public.plans FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - WISHLIST
-- ============================================

CREATE POLICY "Users can view their own wishlist"
ON public.wishlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlist items"
ON public.wishlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlist items"
ON public.wishlist FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items"
ON public.wishlist FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wardrobe_items_updated_at BEFORE UPDATE ON public.wardrobe_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outfits_updated_at BEFORE UPDATE ON public.outfits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlist_updated_at BEFORE UPDATE ON public.wishlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION TO AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.wardrobe_items TO authenticated;
GRANT ALL ON public.outfits TO authenticated;
GRANT ALL ON public.plans TO authenticated;
GRANT ALL ON public.wishlist TO authenticated;

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.wardrobe_items TO anon;
GRANT SELECT ON public.outfits TO anon;
GRANT SELECT ON public.plans TO anon;
GRANT SELECT ON public.wishlist TO anon;

-- ============================================
-- HELPFUL VIEWS (OPTIONAL)
-- ============================================

-- View to get item stats per user
CREATE OR REPLACE VIEW public.user_wardrobe_stats AS
SELECT 
    user_id,
    COUNT(*) as total_items,
    COUNT(CASE WHEN category = 'shirts' THEN 1 END) as shirts_count,
    COUNT(CASE WHEN category = 'pants' THEN 1 END) as pants_count,
    COUNT(CASE WHEN category = 'shoes' THEN 1 END) as shoes_count,
    COUNT(CASE WHEN category = 'jackets' THEN 1 END) as jackets_count,
    COUNT(CASE WHEN category = 'accessories' THEN 1 END) as accessories_count,
    COUNT(CASE WHEN is_favorite = true THEN 1 END) as favorites_count,
    SUM(worn_count) as total_wears,
    AVG(worn_count) as avg_wears_per_item
FROM public.wardrobe_items
GROUP BY user_id;

GRANT SELECT ON public.user_wardrobe_stats TO authenticated;
