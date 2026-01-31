-- SPRAYHUB - FINAL FIX
-- Ce script corrige la structure pour utiliser walls.detection_data au lieu de la table holds

-- 1. Supprimer la table holds (on n'en a pas besoin)
DROP TABLE IF EXISTS holds CASCADE;

-- 2. S'assurer que walls a les bonnes colonnes
ALTER TABLE walls ADD COLUMN IF NOT EXISTS detection_data jsonb DEFAULT '[]'::jsonb;
ALTER TABLE walls ADD COLUMN IF NOT EXISTS name text DEFAULT 'Main Wall';

-- 3. Ajouter un commentaire pour documentation
COMMENT ON COLUMN walls.detection_data IS 'Array of hold objects from AI segmentation: {id, contour: [[x,y],...], role}';

-- 4. S'assurer que les policies walls sont correctes
DROP POLICY IF EXISTS "Walls public read" ON walls;
DROP POLICY IF EXISTS "Public can read walls" ON walls;
DROP POLICY IF EXISTS "Public can insert walls" ON walls;
DROP POLICY IF EXISTS "Public can update walls" ON walls;
DROP POLICY IF EXISTS "Public can delete walls" ON walls;

CREATE POLICY "Public can read walls" ON walls FOR SELECT USING (true);
CREATE POLICY "Public can modify walls" ON walls FOR ALL USING (true);

-- 5. Vérification
SELECT 'Migration terminée ! Table holds supprimée, walls.detection_data prêt.' as status;
