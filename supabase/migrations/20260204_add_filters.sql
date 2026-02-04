-- Migration: Add advanced filtering capabilities
-- Created: 2026-02-04

-- 1. Add style column to routes table (array of text)
ALTER TABLE routes
ADD COLUMN IF NOT EXISTS style TEXT[] DEFAULT '{}';

-- 2. Create GIN index for efficient array searching
CREATE INDEX IF NOT EXISTS idx_routes_style ON routes USING GIN(style);

-- 3. Add index on grade for filtering
CREATE INDEX IF NOT EXISTS idx_routes_grade ON routes(grade);

-- 4. Add index on author_id for filtering by author
CREATE INDEX IF NOT EXISTS idx_routes_author ON routes(author_id);
