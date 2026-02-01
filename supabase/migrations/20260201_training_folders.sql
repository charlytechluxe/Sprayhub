-- 1. PROFILES (Mirror of auth.users for Admin listing)
-- Create a table for public profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'user', 'coach', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. TRAINING FOLDERS ("Dossiers Entraînement")
CREATE TABLE IF NOT EXISTS public.training_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  coach_id UUID REFERENCES auth.users(id), -- The admin who created it
  assigned_user_id UUID REFERENCES auth.users(id) NOT NULL, -- The climber who sees it
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.training_folders ENABLE ROW LEVEL SECURITY;

-- Policies for Folders
-- Admins/Coaches can do everything (simulated by checking if user is coach or made it)
-- For MVP, let's allow "public select" but filtered logically in frontend, 
-- OR strictly: Select if (auth.uid() = assigned_user_id) OR (auth.uid() = coach_id)

CREATE POLICY "View own folders or if coach"
ON public.training_folders FOR SELECT
USING ( auth.uid() = assigned_user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('coach','admin')) );

CREATE POLICY "Coach can insert folders"
ON public.training_folders FOR INSERT
WITH CHECK ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('coach','admin')) );

CREATE POLICY "Coach can update folders"
ON public.training_folders FOR UPDATE
USING ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('coach','admin')) );

CREATE POLICY "Coach can delete folders"
ON public.training_folders FOR DELETE
USING ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('coach','admin')) );


-- 3. FOLDER ITEMS (Routes inside folders)
CREATE TABLE IF NOT EXISTS public.training_folder_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID REFERENCES public.training_folders(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.training_folder_items ENABLE ROW LEVEL SECURITY;

-- Policies for Items (inherit access from folder basically)
CREATE POLICY "View items if can view folder"
ON public.training_folder_items FOR SELECT
USING (
   EXISTS (
     SELECT 1 FROM public.training_folders f
     WHERE f.id = folder_id
     AND (f.assigned_user_id = auth.uid() OR f.coach_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'coach')))
   )
);

CREATE POLICY "Coach can maintain items"
ON public.training_folder_items FOR ALL
USING ( auth.uid() IN (SELECT id FROM profiles WHERE role IN ('coach','admin')) );

-- Add 'role' to existing users if any?
-- (Manual step or migration script often needed, but this schema sets foundation)
