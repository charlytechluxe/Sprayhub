-- Migration: Add dynamic grade color configuration
-- Created: 2026-02-04

-- 1. Create grade_colors table
CREATE TABLE IF NOT EXISTS grade_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    hex TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for ordering
CREATE INDEX IF NOT EXISTS idx_grade_colors_order ON grade_colors(display_order);

-- 3. Insert default colors (migration from hardcoded values)
INSERT INTO grade_colors (name, hex, display_order) VALUES
    ('Orange', '#FF8C00', 1),
    ('Rose', '#FF00FF', 2),
    ('Vert', '#A4C639', 3),
    ('Jaune', '#FFD700', 4),
    ('Bleu', '#32A9D6', 5),
    ('Rouge', '#FF0000', 6),
    ('Blanc', '#ffffff', 7),
    ('Projet', '#a1a1aa', 8)
ON CONFLICT (name) DO NOTHING;

-- 4. Enable RLS
ALTER TABLE grade_colors ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view colors
CREATE POLICY "Anyone can view grade colors"
ON grade_colors FOR SELECT
USING (true);

-- Policy: Only admins can modify colors
CREATE POLICY "Admins can modify grade colors"
ON grade_colors FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'coach')
    )
);

-- 5. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_grade_colors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_grade_colors_timestamp ON grade_colors;
CREATE TRIGGER trigger_update_grade_colors_timestamp
BEFORE UPDATE ON grade_colors
FOR EACH ROW
EXECUTE FUNCTION update_grade_colors_updated_at();
