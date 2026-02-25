-- ============================================================================
-- SCRIPT DE RÉPARATION DES NOMS D'UTILISATEURS (A Lancer dans Supabase SQL Editor)
-- ============================================================================

-- 1. Insérer les profils manquants pour TOUS les utilisateurs existants
-- (Si un utilisateur a créé un bloc mais n'a pas de profil, son nom n'apparaîtra pas)
INSERT INTO public.profiles (id, email, username, full_name, role)
SELECT 
    id, 
    email, 
    -- Nettoyage du username pour éviter les erreurs
    SUBSTRING(
        REGEXP_REPLACE(
            COALESCE(NULLIF(raw_user_meta_data->>'username', ''), SPLIT_PART(email, '@', 1)),
            '[^a-zA-Z0-9_]',
            '_',
            'g'
        ), 1, 20
    ),
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Mettre à jour les routes qui ont encore "Inconnu" ou un champ vide
-- En utilisant les profils fraîchement créés/mis à jour
UPDATE public.routes
SET author_username = profiles.username
FROM public.profiles
WHERE routes.author_id = profiles.id
AND (
    routes.author_username IS NULL 
    OR routes.author_username = 'Inconnu' 
    OR routes.author_username = ''
    -- Force la mise à jour même si le nom est différent, pour être sûr
    OR routes.author_username != profiles.username
);

-- 3. Vérifier le résultat (si 0, tout est bon)
SELECT count(*) as "Blocs encore Inconnus" FROM public.routes WHERE author_username = 'Inconnu';
