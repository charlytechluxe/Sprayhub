-- Add author_username column to routes if it doesn't exist
ALTER TABLE routes ADD COLUMN IF NOT EXISTS author_username TEXT;

-- Update existing records by fetching username from profiles
UPDATE routes
SET author_username = profiles.username
FROM profiles
WHERE routes.author_id = profiles.id
AND (routes.author_username IS NULL OR routes.author_username = 'Inconnu');

-- Optional: Create a trigger to keep it in sync on INSERT/UPDATE?
-- Or rely on backend logic. For now, this fixes the past.
