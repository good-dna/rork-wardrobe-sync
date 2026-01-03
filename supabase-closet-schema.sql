-- Closet App Database Schema
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- UPDATE PROFILES TABLE
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS favorite_category TEXT,
ADD COLUMN IF NOT EXISTS member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- CREATE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    colors TEXT[] DEFAULT '{}',
    size TEXT,
    condition TEXT,
    purchase_price DECIMAL,
    estimated_value DECIMAL,
    times_worn INTEGER DEFAULT 0,
    last_worn_at TIMESTAMP WITH TIME ZONE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREATE WEAR_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wear_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
    worn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_brand ON public.items(brand);
CREATE INDEX IF NOT EXISTS idx_wear_logs_user_id ON public.wear_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wear_logs_item_id ON public.wear_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_wear_logs_worn_at ON public.wear_logs(worn_at);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wear_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - ITEMS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own items" ON public.items;
CREATE POLICY "Users can view their own items"
ON public.items FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own items" ON public.items;
CREATE POLICY "Users can insert their own items"
ON public.items FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own items" ON public.items;
CREATE POLICY "Users can update their own items"
ON public.items FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own items" ON public.items;
CREATE POLICY "Users can delete their own items"
ON public.items FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - WEAR_LOGS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own wear logs" ON public.wear_logs;
CREATE POLICY "Users can view their own wear logs"
ON public.wear_logs FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own wear logs" ON public.wear_logs;
CREATE POLICY "Users can insert their own wear logs"
ON public.wear_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own wear logs" ON public.wear_logs;
CREATE POLICY "Users can delete their own wear logs"
ON public.wear_logs FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER TO UPDATE times_worn WHEN WEAR_LOG IS INSERTED
-- ============================================
CREATE OR REPLACE FUNCTION update_item_wear_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.items
    SET 
        times_worn = times_worn + 1,
        last_worn_at = NEW.worn_at,
        updated_at = NOW()
    WHERE id = NEW.item_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_wear_log_created ON public.wear_logs;
CREATE TRIGGER on_wear_log_created
    AFTER INSERT ON public.wear_logs
    FOR EACH ROW EXECUTE FUNCTION update_item_wear_stats();

-- ============================================
-- TRIGGER FOR UPDATED_AT ON ITEMS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_items_updated_at ON public.items;
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RPC FUNCTION: get_closet_analytics
-- ============================================
CREATE OR REPLACE FUNCTION get_closet_analytics(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_items', COUNT(*),
        'total_purchase_value', COALESCE(SUM(purchase_price), 0),
        'total_estimated_value', COALESCE(SUM(estimated_value), 0),
        'total_wears', COALESCE(SUM(times_worn), 0),
        'top_brand', (
            SELECT brand 
            FROM public.items 
            WHERE user_id = p_user_id AND brand IS NOT NULL
            GROUP BY brand 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ),
        'top_color', (
            SELECT color
            FROM public.items, unnest(colors) AS color
            WHERE user_id = p_user_id
            GROUP BY color
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ),
        'top_category', (
            SELECT category 
            FROM public.items 
            WHERE user_id = p_user_id
            GROUP BY category 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ),
        'brands_count', (
            SELECT COUNT(DISTINCT brand)
            FROM public.items
            WHERE user_id = p_user_id AND brand IS NOT NULL
        ),
        'categories_count', (
            SELECT COUNT(DISTINCT category)
            FROM public.items
            WHERE user_id = p_user_id
        ),
        'average_purchase_price', (
            SELECT COALESCE(AVG(purchase_price), 0)
            FROM public.items
            WHERE user_id = p_user_id AND purchase_price IS NOT NULL
        ),
        'average_estimated_value', (
            SELECT COALESCE(AVG(estimated_value), 0)
            FROM public.items
            WHERE user_id = p_user_id AND estimated_value IS NOT NULL
        )
    ) INTO result
    FROM public.items
    WHERE user_id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.items TO authenticated;
GRANT ALL ON public.wear_logs TO authenticated;
GRANT SELECT ON public.items TO anon;
GRANT SELECT ON public.wear_logs TO anon;
