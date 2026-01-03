-- Analytics Migration for Wardrobe App
-- Run this SQL in your Supabase SQL Editor to add analytics features

-- ============================================
-- UPDATE PROFILES TABLE
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age BETWEEN 0 AND 120);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_category TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing profiles to set member_since from created_at if not already set
UPDATE public.profiles SET member_since = created_at WHERE member_since IS NULL;

-- ============================================
-- UPDATE WARDROBE_ITEMS TABLE
-- ============================================
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS purchase_price NUMERIC;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS estimated_value NUMERIC;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS times_worn INTEGER DEFAULT 0;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS last_worn_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing data
UPDATE public.wardrobe_items SET colors = ARRAY[color] WHERE color IS NOT NULL AND colors = '{}';
UPDATE public.wardrobe_items SET purchase_price = price WHERE price IS NOT NULL AND purchase_price IS NULL;
UPDATE public.wardrobe_items SET times_worn = worn_count WHERE times_worn = 0;
UPDATE public.wardrobe_items SET last_worn_at = last_worn WHERE last_worn IS NOT NULL AND last_worn_at IS NULL;

-- ============================================
-- CREATE WEAR_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wear_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE NOT NULL,
    worn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'calendar', 'outfit')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR WEAR_LOGS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_wear_logs_user_id ON public.wear_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wear_logs_item_id ON public.wear_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_wear_logs_worn_at ON public.wear_logs(worn_at);
CREATE INDEX IF NOT EXISTS idx_wear_logs_user_item ON public.wear_logs(user_id, item_id);

-- ============================================
-- ENABLE RLS FOR WEAR_LOGS
-- ============================================
ALTER TABLE public.wear_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wear logs"
ON public.wear_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wear logs"
ON public.wear_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wear logs"
ON public.wear_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wear logs"
ON public.wear_logs FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- GRANT PERMISSIONS FOR WEAR_LOGS
-- ============================================
GRANT ALL ON public.wear_logs TO authenticated;
GRANT SELECT ON public.wear_logs TO anon;

-- ============================================
-- FUNCTION: AUTO-UPDATE TIMES_WORN
-- ============================================
CREATE OR REPLACE FUNCTION public.update_item_times_worn()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.wardrobe_items
    SET 
        times_worn = times_worn + 1,
        last_worn_at = NEW.worn_at,
        updated_at = NOW()
    WHERE id = NEW.item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-updating times_worn
DROP TRIGGER IF EXISTS on_wear_log_created ON public.wear_logs;
CREATE TRIGGER on_wear_log_created
    AFTER INSERT ON public.wear_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_item_times_worn();

-- ============================================
-- RPC FUNCTION: GET_CLOSET_ANALYTICS
-- ============================================
CREATE OR REPLACE FUNCTION public.get_closet_analytics()
RETURNS JSON AS $$
DECLARE
    result JSON;
    user_uuid UUID;
    v_total_items INTEGER;
    v_total_estimated_value NUMERIC;
    v_total_purchase_value NUMERIC;
    v_total_wears INTEGER;
    v_top_brand_name TEXT;
    v_top_brand_wears INTEGER;
    v_top_color_name TEXT;
    v_top_color_wears INTEGER;
    v_top_category_name TEXT;
    v_top_category_wears INTEGER;
BEGIN
    user_uuid := auth.uid();
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Get valuation metrics
    SELECT 
        COUNT(*)::INTEGER,
        COALESCE(SUM(estimated_value), 0),
        COALESCE(SUM(purchase_price), 0),
        COALESCE(SUM(times_worn), 0)::INTEGER
    INTO 
        v_total_items,
        v_total_estimated_value,
        v_total_purchase_value,
        v_total_wears
    FROM public.wardrobe_items
    WHERE user_id = user_uuid;
    
    -- Get top brand
    SELECT brand, SUM(times_worn)::INTEGER
    INTO v_top_brand_name, v_top_brand_wears
    FROM public.wardrobe_items
    WHERE user_id = user_uuid AND brand IS NOT NULL
    GROUP BY brand
    ORDER BY SUM(times_worn) DESC
    LIMIT 1;
    
    -- Get top color (unnest colors array)
    SELECT color, SUM(wears)::INTEGER
    INTO v_top_color_name, v_top_color_wears
    FROM (
        SELECT unnest(colors) as color, times_worn as wears
        FROM public.wardrobe_items
        WHERE user_id = user_uuid AND colors IS NOT NULL AND array_length(colors, 1) > 0
    ) color_stats
    GROUP BY color
    ORDER BY SUM(wears) DESC
    LIMIT 1;
    
    -- Get top category
    SELECT category, SUM(times_worn)::INTEGER
    INTO v_top_category_name, v_top_category_wears
    FROM public.wardrobe_items
    WHERE user_id = user_uuid AND category IS NOT NULL
    GROUP BY category
    ORDER BY SUM(times_worn) DESC
    LIMIT 1;
    
    -- Build result JSON
    result := json_build_object(
        'valuation', json_build_object(
            'total_items', v_total_items,
            'total_estimated_value', v_total_estimated_value,
            'total_purchase_value', v_total_purchase_value,
            'total_wears', v_total_wears
        ),
        'top_brand', json_build_object(
            'brand', v_top_brand_name,
            'wears', v_top_brand_wears
        ),
        'top_color', json_build_object(
            'color', v_top_color_name,
            'wears', v_top_color_wears
        ),
        'top_category', json_build_object(
            'category', v_top_category_name,
            'wears', v_top_category_wears
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_closet_analytics() TO authenticated;

-- ============================================
-- HELPFUL VIEWS FOR ANALYTICS
-- ============================================

-- View: Top 10 most worn items per user
CREATE OR REPLACE VIEW public.user_top_worn_items AS
SELECT 
    user_id,
    id,
    name,
    brand,
    category,
    times_worn,
    last_worn_at,
    image_url,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY times_worn DESC) as rank
FROM public.wardrobe_items
WHERE times_worn > 0;

GRANT SELECT ON public.user_top_worn_items TO authenticated;

-- ============================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================

-- Test analytics function:
-- SELECT public.get_closet_analytics();

-- Test top worn items:
-- SELECT * FROM public.user_top_worn_items WHERE user_id = auth.uid() AND rank <= 10;
