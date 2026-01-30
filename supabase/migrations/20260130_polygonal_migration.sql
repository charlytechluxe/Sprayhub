-- SPRAYHUB MIGRATION: POLYGONAL PRO STRUCTURE
-- Execute this in your Supabase SQL Editor

-- 1. Nettoyage des anciennes données
TRUNCATE TABLE routes RESTART IDENTITY CASCADE;

-- 2. Mise à jour de la structure pour SAM 2
-- Nous allons utiliser JSONB pour 'holds' car c'est le plus flexible pour stocker 
-- des milliers de polygones avec leurs métadonnées.

ALTER TABLE routes DROP COLUMN IF EXISTS holds;
ALTER TABLE routes ADD COLUMN holds jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Ajout d'une colonne spécifique pour les métadonnées de segmentation globale si besoin
ALTER TABLE walls ADD COLUMN IF NOT EXISTS detection_data jsonb DEFAULT '[]'::jsonb;

-- 3. Policy Update (Optionnel: garantir l'accès admin total sur les polygones)
DROP POLICY IF EXISTS "Admins have full access on routes" ON routes;
CREATE POLICY "Admins have full access on routes" ON routes FOR ALL USING (true);

COMMENT ON COLUMN routes.holds IS 'Array of objects: {id, type, contour: [[x,y],...], note}';
