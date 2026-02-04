-- ============================================================================
-- MIGRATION CONSOLIDÉE SPRAYHUB
-- Date: 2026-02-04
-- Description: Combine toutes les migrations (profiles, training, voting, filters, colors)
-- ============================================================================

-- ============================================================================
-- 1. TABLE DES PROFILS (Indispensable pour voir les utilisateurs dans le Hub)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'user', 'admin', 'coach'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✨ Ajouter la colonne username si elle n'existe pas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- ✨ Contrainte d'unicité pour le username (insensible à la casse)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx 
ON public.profiles (LOWER(username));

-- ✨ Index pour recherches rapides par username
CREATE INDEX IF NOT EXISTS profiles_username_idx 
ON public.profiles (username);

-- ✨ Validation du format username (3-20 caractères, alphanumériques + underscore)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'username_format_check'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT username_format_check 
    CHECK (username IS NULL OR (username ~ '^[a-zA-Z0-9_]{3,20}$'));
  END IF;
END $$;

-- ============================================================================
-- 2. TABLES D'ENTRAÎNEMENT (Dossiers et Items)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.training_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  coach_id UUID REFERENCES auth.users(id),
  assigned_user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.training_folder_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID REFERENCES public.training_folders(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. AJOUT DE LA COLONNE "FEATURED" (Le Bloc du Moment)
-- ============================================================================
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- ============================================================================
-- 4. 🆕 SYSTÈME DE VOTE POUR DIFFICULTÉ
-- ============================================================================

-- Table des votes
CREATE TABLE IF NOT EXISTS grade_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    suggested_grade TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(route_id, user_id) -- Un vote par utilisateur par bloc
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_grade_votes_route ON grade_votes(route_id);
CREATE INDEX IF NOT EXISTS idx_grade_votes_user ON grade_votes(user_id);

-- Colonne pour indiquer si le grade a été ajusté par votes
ALTER TABLE routes
ADD COLUMN IF NOT EXISTS grade_adjusted_by_votes BOOLEAN DEFAULT FALSE;

-- Fonction pour calculer le consensus (90% de votes identiques)
CREATE OR REPLACE FUNCTION calculate_grade_consensus(p_route_id UUID)
RETURNS TEXT AS $$
DECLARE
    total_votes INTEGER;
    majority_grade TEXT;
    majority_count INTEGER;
    consensus_threshold DECIMAL := 0.9; -- 90%
BEGIN
    -- Compter le total de votes pour ce bloc
    SELECT COUNT(*) INTO total_votes
    FROM grade_votes
    WHERE route_id = p_route_id;
    
    -- Besoin d'au moins 3 votes pour un consensus
    IF total_votes < 3 THEN
        RETURN NULL;
    END IF;
    
    -- Trouver le grade le plus voté
    SELECT suggested_grade, COUNT(*) INTO majority_grade, majority_count
    FROM grade_votes
    WHERE route_id = p_route_id
    GROUP BY suggested_grade
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Vérifier si le consensus est atteint (90%)
    IF majority_count::DECIMAL / total_votes >= consensus_threshold THEN
        RETURN majority_grade;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Fonction trigger pour mettre à jour le grade automatiquement
CREATE OR REPLACE FUNCTION update_route_grade_on_vote()
RETURNS TRIGGER AS $$
DECLARE
    new_grade TEXT;
BEGIN
    -- Calculer le consensus
    new_grade := calculate_grade_consensus(NEW.route_id);
    
    -- Si consensus atteint, mettre à jour le grade du bloc
    IF new_grade IS NOT NULL THEN
        UPDATE routes
        SET 
            grade = new_grade,
            grade_adjusted_by_votes = TRUE,
            updated_at = NOW()
        WHERE id = NEW.route_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger qui se déclenche après chaque vote
DROP TRIGGER IF EXISTS trigger_update_grade_on_vote ON grade_votes;
CREATE TRIGGER trigger_update_grade_on_vote
AFTER INSERT OR UPDATE ON grade_votes
FOR EACH ROW
EXECUTE FUNCTION update_route_grade_on_vote();

-- RLS pour grade_votes
ALTER TABLE grade_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view votes" ON grade_votes;
CREATE POLICY "Anyone can view votes"
ON grade_votes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own votes" ON grade_votes;
CREATE POLICY "Users can insert their own votes"
ON grade_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own votes" ON grade_votes;
CREATE POLICY "Users can update their own votes"
ON grade_votes FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own votes" ON grade_votes;
CREATE POLICY "Users can delete their own votes"
ON grade_votes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 5. 🆕 FILTRES AVANCÉS (Style, Couleur, Auteur)
-- ============================================================================

-- Colonne style (tableau de tags: Dynamique, Physique, Technique, Résistance)
ALTER TABLE routes
ADD COLUMN IF NOT EXISTS style TEXT[] DEFAULT '{}';

-- Index GIN pour recherche efficace dans les tableaux
CREATE INDEX IF NOT EXISTS idx_routes_style ON routes USING GIN(style);

-- Index pour filtrage par grade
CREATE INDEX IF NOT EXISTS idx_routes_grade ON routes(grade);

-- Index pour filtrage par auteur
CREATE INDEX IF NOT EXISTS idx_routes_author ON routes(author_id);

-- ============================================================================
-- 6. 🆕 CONFIGURATION DES COULEURS (Admin Hub)
-- ============================================================================

-- Table des couleurs de grade (personnalisables)
CREATE TABLE IF NOT EXISTS grade_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    hex TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour tri par ordre d'affichage
CREATE INDEX IF NOT EXISTS idx_grade_colors_order ON grade_colors(display_order);

-- Insérer les couleurs par défaut
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

-- RLS pour grade_colors
ALTER TABLE grade_colors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view grade colors" ON grade_colors;
CREATE POLICY "Anyone can view grade colors"
ON grade_colors FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can modify grade colors" ON grade_colors;
CREATE POLICY "Admins can modify grade colors"
ON grade_colors FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'coach')
    )
);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_grade_colors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_grade_colors_timestamp ON grade_colors;
CREATE TRIGGER trigger_update_grade_colors_timestamp
BEFORE UPDATE ON grade_colors
FOR EACH ROW
EXECUTE FUNCTION update_grade_colors_updated_at();

-- ============================================================================
-- 7. SYNCHRONISATION DES COMPTES EXISTANTS
-- ============================================================================
INSERT INTO public.profiles (id, email, full_name, username)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'username'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. FONCTION TRIGGER POUR CRÉER AUTOMATIQUEMENT LE PROFIL
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour appeler la fonction à chaque inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 9. 🔧 VOUS PASSER ADMIN (Remplacez par votre email)
-- ============================================================================
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'VOTRE_EMAIL_ICI'; 

-- ============================================================================
-- ✅ MIGRATION TERMINÉE
-- ============================================================================
SELECT '🚀 Migration complète réussie ! Toutes les fonctionnalités sont activées !' as status;
