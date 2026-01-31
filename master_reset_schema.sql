-- 🚨 SPRAYHUB - MASTER RESET SCHEMA (FULL) 🚨
-- ATTENTION : Ceci va EFFACER toutes les données et recréer la base à neuf.

-- 1. NETTOYAGE TOTAL (Ordre inverse des dépendances)
DROP VIEW IF EXISTS routes_with_stats;
DROP TABLE IF EXISTS ascents CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS user_list_items CASCADE;
DROP TABLE IF EXISTS user_lists CASCADE;
DROP TABLE IF EXISTS folder_routes CASCADE;
DROP TABLE IF EXISTS training_folders CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS user_activity CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS holds CASCADE;
DROP TABLE IF EXISTS walls CASCADE;
DROP TABLE IF EXISTS gym_config CASCADE;
DROP TABLE IF EXISTS sponsors CASCADE;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. CRÉATION DES TABLES

-- Table des versions du mur
CREATE TABLE walls (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text DEFAULT 'Main Wall',
  image_url text NOT NULL,
  detection_data jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  version text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des blocs (Routes)
CREATE TABLE routes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wall_id uuid REFERENCES walls(id) ON DELETE CASCADE,
  name text NOT NULL,
  grade text NOT NULL,
  author_id uuid REFERENCES auth.users(id),
  holds jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table Carnet de Croix (Ascents)
CREATE TABLE ascents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  suggested_grade text,
  quality_rating int,
  comment text,
  UNIQUE(route_id, user_id) 
);

-- Table Likes
CREATE TABLE likes (
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (route_id, user_id)
);

-- Table Config Gym
CREATE TABLE gym_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Table Sponsors
CREATE TABLE sponsors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo_url text NOT NULL,
  link_url text,
  is_active boolean DEFAULT true,
  slot_id text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. SECURITÉ (Row Level Security)
ALTER TABLE walls ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ascents ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Policies Walls
CREATE POLICY "Public read walls" ON walls FOR SELECT USING (true);
CREATE POLICY "Public write walls" ON walls FOR ALL USING (true); -- Simplification Dev

-- Policies Routes
CREATE POLICY "Public read routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Public write routes" ON routes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update routes" ON routes FOR UPDATE USING (true);
CREATE POLICY "Public delete routes" ON routes FOR DELETE USING (true);

-- Policies Ascents
CREATE POLICY "Public read ascents" ON ascents FOR SELECT USING (true);
CREATE POLICY "Users write ascents" ON ascents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update ascents" ON ascents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete ascents" ON ascents FOR DELETE USING (auth.uid() = user_id);

-- Policies Likes
CREATE POLICY "Public read likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users toggle likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Policies Config/Sponsors
CREATE POLICY "Public read config" ON gym_config FOR SELECT USING (true);
CREATE POLICY "Public read sponsors" ON sponsors FOR SELECT USING (true);

-- 5. VUES OPTIMISÉES
CREATE OR REPLACE VIEW routes_with_stats AS
SELECT 
  r.*,
  count(distinct l.user_id) as likes_count,
  count(distinct a.user_id) as ascents_count
FROM routes r
LEFT JOIN likes l ON r.id = l.route_id
LEFT JOIN ascents a ON r.id = a.route_id
GROUP BY r.id;

-- 6. DONNÉES PAR DÉFAUT (SEED)

-- Config Couleurs
INSERT INTO gym_config (key, value) VALUES 
('grade_colors', '[
  {"name": "Vert", "hex": "#A4C639"},
  {"name": "Bleu", "hex": "#32A9D6"},
  {"name": "Jaune", "hex": "#FFD700"},
  {"name": "Rouge", "hex": "#FB2056"},
  {"name": "Projet", "hex": "#a1a1aa"}
]'::jsonb);

-- Sponsor
INSERT INTO sponsors (name, logo_url, link_url, slot_id) VALUES 
('Petzl', 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Petzl_logo.svg', 'https://www.petzl.com', 'home_main');

-- Création d'un Mur (Nécessaire pour le bloc test)
INSERT INTO walls (name, image_url, version, detection_data) VALUES 
('Mur Principal 2024', '/wall_v1.jpg', 'v1', '[]'::jsonb);

-- Insertion du BLOC TEST DE SYNCHRONISATION
INSERT INTO routes (
  name, grade, wall_id, holds, created_at
)
VALUES (
  'Test Sync 3000 🤖', 
  'Bleu', 
  (SELECT id FROM walls LIMIT 1),
  '[
    {"id": "h1", "x":0.5, "y":0.8, "type":"start", "note":"Départ Assis", "contour":[[0.48,0.78],[0.52,0.78],[0.52,0.82],[0.48,0.82]]},
    {"id": "h2", "x": 0.5, "y": 0.5, "type":"handfoot", "note":"Le Crux !", "contour":[[0.48,0.48],[0.52,0.48],[0.52,0.52],[0.48,0.52]]},
    {"id": "h3", "x": 0.5, "y": 0.2, "type":"top", "note":"Jetez !", "contour":[[0.48,0.18],[0.52,0.18],[0.52,0.22],[0.48,0.22]]}
  ]'::jsonb,
  now()
);

SELECT '✅ MASTER RESET TERMINÉ : Base propre + Social + Bloc Test' as status;
