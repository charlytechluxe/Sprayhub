-- Add is_featured to routes
ALTER TABLE routes ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add wall_id to routes
ALTER TABLE routes ADD COLUMN IF NOT EXISTS wall_id UUID REFERENCES walls(id);

-- Ensure walls has name and is_active
ALTER TABLE walls ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Trigger to ensure only one route is featured (optional, but good for data integrity)
-- Let's just do it in the app for now to keep it simple, or use a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS one_featured_route ON routes (is_featured) WHERE (is_featured = true);

-- Same for active wall
CREATE UNIQUE INDEX IF NOT EXISTS one_active_wall ON walls (is_active) WHERE (is_active = true);
