-- Add detection_data column to walls table if it doesn't exist
ALTER TABLE walls ADD COLUMN IF NOT EXISTS detection_data jsonb DEFAULT '[]'::jsonb;

-- Add name column to walls table for better identification
ALTER TABLE walls ADD COLUMN IF NOT EXISTS name text DEFAULT 'Main Wall';

COMMENT ON COLUMN walls.detection_data IS 'Array of hold objects from AI segmentation: {id, contour: [[x,y],...], role}';
