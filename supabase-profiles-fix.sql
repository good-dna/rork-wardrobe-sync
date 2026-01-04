-- Fix profiles table - add missing columns
-- Run this SQL in your Supabase SQL Editor

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Update existing rows to set member_since if NULL
UPDATE public.profiles 
SET member_since = created_at 
WHERE member_since IS NULL;

-- Create index for state
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles(state);

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        member_since,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        NOW(),
        NOW(), 
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
