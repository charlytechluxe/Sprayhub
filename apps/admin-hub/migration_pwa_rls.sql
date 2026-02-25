-- Enable RLS on routes table
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can view routes
DROP POLICY IF EXISTS "Routes are viewable by everyone" ON public.routes;
CREATE POLICY "Routes are viewable by everyone" 
ON public.routes FOR SELECT USING (true);

-- 2. Authenticated users can insert routes
DROP POLICY IF EXISTS "Users can insert their own routes" ON public.routes;
CREATE POLICY "Users can insert their own routes" 
ON public.routes FOR INSERT 
WITH CHECK (auth.uid() = author_id);

-- 3. Users can update their own routes (OR Admins)
DROP POLICY IF EXISTS "Users can update their own routes" ON public.routes;
CREATE POLICY "Users can update their own routes" 
ON public.routes FOR UPDATE 
USING (
    auth.uid() = author_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coach'))
);

-- 4. Users can delete their own routes (OR Admins)
DROP POLICY IF EXISTS "Users can delete their own routes" ON public.routes;
CREATE POLICY "Users can delete their own routes" 
ON public.routes FOR DELETE 
USING (
    auth.uid() = author_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coach'))
);

-- Also ensure 'walls' is readable
ALTER TABLE public.walls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Walls are viewable by everyone" ON public.walls;
CREATE POLICY "Walls are viewable by everyone" 
ON public.walls FOR SELECT USING (true);
