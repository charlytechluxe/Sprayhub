-- Fix RLS Policies for Routes Table
-- Allow public read and write for demo/testing (can be restricted later with auth)

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins have full access on routes" ON routes;

-- Create permissive policies for routes
CREATE POLICY "Public can read routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Public can insert routes" ON routes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update routes" ON routes FOR UPDATE USING (true);
CREATE POLICY "Public can delete routes" ON routes FOR DELETE USING (true);

-- Ensure walls and holds policies are also permissive
DROP POLICY IF EXISTS "Public read for walls" ON walls;
DROP POLICY IF EXISTS "Full access for walls" ON walls;
DROP POLICY IF EXISTS "Public read for holds" ON holds;
DROP POLICY IF EXISTS "Full access for holds" ON holds;

CREATE POLICY "Public can read walls" ON walls FOR SELECT USING (true);
CREATE POLICY "Public can insert walls" ON walls FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update walls" ON walls FOR UPDATE USING (true);
CREATE POLICY "Public can delete walls" ON walls FOR DELETE USING (true);

CREATE POLICY "Public can read holds" ON holds FOR SELECT USING (true);
CREATE POLICY "Public can insert holds" ON holds FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update holds" ON holds FOR UPDATE USING (true);
CREATE POLICY "Public can delete holds" ON holds FOR DELETE USING (true);
