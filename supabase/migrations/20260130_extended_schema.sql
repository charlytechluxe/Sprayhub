-- Add status for moderation in routes
ALTER TABLE routes ADD COLUMN status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Gym Configuration Table
CREATE TABLE gym_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL, -- e.g. 'grade_colors', 'hold_types'
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initialize default config
INSERT INTO gym_config (key, value) VALUES 
('grade_colors', '[
  {"name": "Vert", "hex": "#A4C639"},
  {"name": "Bleu", "hex": "#32A9D6"},
  {"name": "Jaune", "hex": "#FFD700"},
  {"name": "Rouge", "hex": "#FB2056"},
  {"name": "Rose", "hex": "#FB2056"},
  {"name": "Orange", "hex": "#FF8C00"},
  {"name": "Blanc", "#ffffff"}
]'::jsonb),
('hold_types', '[
  {"id": "start", "label": "Départ", "color": "#A4C639"},
  {"id": "handfoot", "label": "Main/Pied", "color": "#32A9D6"},
  {"id": "foot", "label": "Pied", "color": "#FFD700"},
  {"id": "top", "label": "Top", "color": "#FB2056"}
]'::jsonb);

-- Training Folders
CREATE TABLE training_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL, -- The climber this folder is for
  coach_id uuid NOT NULL, -- The coach who created it
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE folder_routes (
  folder_id uuid REFERENCES training_folders(id) ON DELETE CASCADE,
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  PRIMARY KEY (folder_id, route_id)
);

-- Sponsors
CREATE TABLE sponsors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo_url text NOT NULL,
  slot text NOT NULL, -- e.g. 'home_banner', 'route_loading'
  link_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Updates
ALTER TABLE gym_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read config" ON gym_config FOR SELECT USING (true);
CREATE POLICY "Public read active sponsors" ON sponsors FOR SELECT USING (is_active = true);
CREATE POLICY "Users can read their own training folders" ON training_folders FOR SELECT USING (auth.uid() = user_id OR auth.uid() = coach_id);
CREATE POLICY "Coaches can create training folders" ON training_folders FOR INSERT WITH CHECK (auth.role() = 'authenticated'); -- Logic for coach role needed later
