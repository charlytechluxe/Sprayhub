-- ============================================================================
-- MIGRATION COMPLÈTE SPRAYHUB (+ Correction "Inconnu")
-- Date: 2026-02-13
-- ============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des PROFILS (Indispensable pour voir les utilisateurs dans le Hub)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'user', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✨ NOUVEAU : Ajouter la colonne username si elle n'existe pas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- ✨ NOUVEAU : Contrainte d'unicité pour le username (insensible à la casse)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx 
ON public.profiles (LOWER(username));

-- ✨ NOUVEAU : Index pour recherches rapides par username
CREATE INDEX IF NOT EXISTS profiles_username_idx 
ON public.profiles (username);

-- ✨ NOUVEAU : Validation du format username (3-20 caractères, alphanumériques + underscore)
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

-- ✨ FIX RLS: Autoriser la lecture des profils pour que les noms apparaissent
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Tables d'ENTRAÎNEMENT (Dossiers et Items)
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

-- 3. Ajout de la colonne "Featured" (Le Bloc du Moment) si elle manque
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- ✨ FIX BUG "INCONNU" : Ajout colonne author_username à routes
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS author_username TEXT;

-- (Le remplissage rétroactif se fera APRÈS la synchro des profils pour être sûr d'avoir les données)


-- 4. Synchroniser vos comptes existants pour qu'ils apparaissent enfin
INSERT INTO public.profiles (id, email, full_name, username)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name',
  -- ✨ SANITIZATION : Remplace caractères invalides (espaces, accents...) par '_'
  SUBSTRING(
    REGEXP_REPLACE(
        COALESCE(NULLIF(raw_user_meta_data->>'username', ''), SPLIT_PART(email, '@', 1)),
        '[^a-zA-Z0-9_]',
        '_',
        'g'
    ), 1, 20
  )
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ✨ FIX BUG "INCONNU" : Remplir les auteurs manquants MAINTENANT que les profils sont là
-- ✨ FIX BUG "INCONNU" : Remplir les auteurs manquants MAINTENANT que les profils sont là
-- FORCE UPDATE pour écraser 'Inconnu' même si déjà défini
UPDATE public.routes
SET author_username = profiles.username
FROM public.profiles
WHERE routes.author_id = profiles.id
AND (routes.author_username IS NULL OR routes.author_username = 'Inconnu' OR routes.author_username = '');

-- 5. VOUS PASSER ADMIN (Remplacez par votre mail si besoin)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'VOTRE_EMAIL_ICI'; 

-- ✨ NOUVEAU : Fonction trigger pour créer automatiquement le profil avec username
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    -- ✨ SANITIZATION AUTOMATIQUE
    SUBSTRING(
        REGEXP_REPLACE(
            COALESCE(NULLIF(new.raw_user_meta_data->>'username', ''), SPLIT_PART(new.email, '@', 1)),
            '[^a-zA-Z0-9_]',
            '_',
            'g'
        ), 1, 20
    ),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✨ NOUVEAU : Trigger pour appeler la fonction à chaque inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 🆕 6. SYSTÈME DE VOTE POUR DIFFICULTÉ
-- ============================================================================

-- Table des votes
CREATE TABLE IF NOT EXISTS grade_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    suggested_grade TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(route_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_grade_votes_route ON grade_votes(route_id);
CREATE INDEX IF NOT EXISTS idx_grade_votes_user ON grade_votes(user_id);

ALTER TABLE routes ADD COLUMN IF NOT EXISTS grade_adjusted_by_votes BOOLEAN DEFAULT FALSE;

-- Fonction consensus (90%)
CREATE OR REPLACE FUNCTION calculate_grade_consensus(p_route_id UUID)
RETURNS TEXT AS $$
DECLARE
    total_votes INTEGER;
    majority_grade TEXT;
    majority_count INTEGER;
    consensus_threshold DECIMAL := 0.9;
BEGIN
    SELECT COUNT(*) INTO total_votes FROM grade_votes WHERE route_id = p_route_id;
    IF total_votes < 3 THEN RETURN NULL; END IF;
    
    SELECT suggested_grade, COUNT(*) INTO majority_grade, majority_count
    FROM grade_votes WHERE route_id = p_route_id
    GROUP BY suggested_grade ORDER BY COUNT(*) DESC LIMIT 1;
    
    IF majority_count::DECIMAL / total_votes >= consensus_threshold THEN
        RETURN majority_grade;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger auto-update grade
CREATE OR REPLACE FUNCTION update_route_grade_on_vote()
RETURNS TRIGGER AS $$
DECLARE
    new_grade TEXT;
BEGIN
    new_grade := calculate_grade_consensus(NEW.route_id);
    IF new_grade IS NOT NULL THEN
        UPDATE routes SET grade = new_grade, grade_adjusted_by_votes = TRUE, updated_at = NOW()
        WHERE id = NEW.route_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_grade_on_vote ON grade_votes;
CREATE TRIGGER trigger_update_grade_on_vote
AFTER INSERT OR UPDATE ON grade_votes
FOR EACH ROW EXECUTE FUNCTION update_route_grade_on_vote();

-- RLS
ALTER TABLE grade_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view votes" ON grade_votes;
CREATE POLICY "Anyone can view votes" ON grade_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own votes" ON grade_votes;
CREATE POLICY "Users can insert their own votes" ON grade_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own votes" ON grade_votes;
CREATE POLICY "Users can update their own votes" ON grade_votes FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own votes" ON grade_votes;
CREATE POLICY "Users can delete their own votes" ON grade_votes FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 🆕 7. FILTRES AVANCÉS (Style, Couleur, Auteur)
-- ============================================================================

ALTER TABLE routes ADD COLUMN IF NOT EXISTS style TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_routes_style ON routes USING GIN(style);
CREATE INDEX IF NOT EXISTS idx_routes_grade ON routes(grade);
CREATE INDEX IF NOT EXISTS idx_routes_author ON routes(author_id);

-- ============================================================================
-- 🆕 8. CONFIGURATION DES COULEURS (Admin Hub)
-- ============================================================================

CREATE TABLE IF NOT EXISTS grade_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    hex TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grade_colors_order ON grade_colors(display_order);

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

ALTER TABLE grade_colors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view grade colors" ON grade_colors;
CREATE POLICY "Anyone can view grade colors" ON grade_colors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can modify grade colors" ON grade_colors;
CREATE POLICY "Admins can modify grade colors" ON grade_colors FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coach')));

CREATE OR REPLACE FUNCTION update_grade_colors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_grade_colors_timestamp ON grade_colors;
CREATE TRIGGER trigger_update_grade_colors_timestamp
BEFORE UPDATE ON grade_colors
FOR EACH ROW EXECUTE FUNCTION update_grade_colors_updated_at();

-- ============================================================================
-- ✅ PREVIOUS MIGRATION STATUS
-- ============================================================================
SELECT '🚀 Migration complète (Profiles, Training, Vote, Filtres, Couleurs, Fix Inconnu) OK' as status;

-- ============================================================================
-- 🆕 9. FEEDBACK EMAILS
-- ============================================================================

-- 1. Table pour suivre les envois
CREATE TABLE IF NOT EXISTS public.feedback_email_logs (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedback_email_logs ENABLE ROW LEVEL SECURITY;

-- 2. Fonction sécurisée pour trouver les utilisateurs à contacter
-- (Inscrits il y a plus de 7 jours, moins de 30 jours, et jamais contactés)
CREATE OR REPLACE FUNCTION public.get_feedback_candidates()
RETURNS TABLE (id UUID, email VARCHAR)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id, 
    au.email::VARCHAR
  FROM auth.users au
  LEFT JOIN public.feedback_email_logs fel ON au.id = fel.user_id
  WHERE 
    au.created_at < (NOW() - INTERVAL '7 days') 
    AND au.created_at > (NOW() - INTERVAL '30 days')
    AND fel.user_id IS NULL;
END;
$$;

-- 3. Sécuriser la fonction (seul le serveur peut l'appeler)
REVOKE EXECUTE ON FUNCTION public.get_feedback_candidates() FROM public;
REVOKE EXECUTE ON FUNCTION public.get_feedback_candidates() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_feedback_candidates() TO service_role;


-- ============================================================================
-- 🆕 10. ACTIVATION AUTOMATIQUE (CRON JOB)
-- ============================================================================

-- 1. Active les outils de Cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Supprime l'ancien job UNIQUEMENT S'IL EXISTE (pour éviter l'erreur XX000)
SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname = 'send-feedback-daily';

-- 3. Planifie l'envoi tous les matins à 10h00
SELECT cron.schedule(
    'send-feedback-daily',
    '0 10 * * *',
    $$
    SELECT net.http_post(
        url:='https://lvijsqxgrboolsxxlyir.supabase.co/functions/v1/send-feedback',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWpzcXhncmJvb2xzeHhseWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTQ2NjcsImV4cCI6MjA4NTM3MDY2N30.3d8MTy8otx28wri9L2qx0YB3KGg71lZcpE4HqcOqJLs"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
    $$
);

-- ============================================================================
-- ✅ TERMINÉ GLOBAL
-- ============================================================================
SELECT '🚀 Migration finale avec FIX AUTEURS exécutée avec succès !' as final_status;
