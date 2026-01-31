
-- MIGRATION: CREATE HOLDS TABLE
CREATE TABLE IF NOT EXISTS walls (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    image_url text NOT NULL,
    detection_data jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS holds (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    wall_id uuid REFERENCES walls(id) ON DELETE CASCADE,
    contour jsonb NOT NULL,
    x float8,
    y float8,
    area_px float8,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE walls ENABLE ROW LEVEL SECURITY;
ALTER TABLE holds ENABLE ROW LEVEL SECURITY;

-- Policies (Allow all for simplified admin/client for now)
CREATE POLICY "Public read for walls" ON walls FOR SELECT USING (true);
CREATE POLICY "Public read for holds" ON holds FOR SELECT USING (true);
CREATE POLICY "Full access for walls" ON walls FOR ALL USING (true);
CREATE POLICY "Full access for holds" ON holds FOR ALL USING (true);
