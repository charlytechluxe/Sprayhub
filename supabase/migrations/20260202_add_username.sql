-- Add username field to profiles table
-- Migration: 20260202_add_username.sql

-- 1. Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Create unique constraint on username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx 
ON public.profiles (LOWER(username));

-- 3. Create index for faster username lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx 
ON public.profiles (username);

-- 4. Add check constraint for username format (3-20 chars, alphanumeric + underscore)
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format_check 
CHECK (username IS NULL OR (username ~ '^[a-zA-Z0-9_]{3,20}$'));

-- 5. Update the handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Existing users will have NULL username until they update their profile
