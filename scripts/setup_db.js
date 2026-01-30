
const postgres = require('postgres');

// Configuration - Remplace [TON_MOT_DE_PASSE] par ton mot de passe de base de données Supabase
const DB_PASSWORD = process.argv[2];

if (!DB_PASSWORD) {
    console.error("❌ Erreur : Tu dois fournir ton mot de passe de base de données en argument.");
    console.log("Usage : node scripts/setup_db.js TON_MOT_DE_PASSE");
    process.exit(1);
}

const sql = postgres(`postgres://postgres:${DB_PASSWORD}@db.lvijsqxgrboolsxxlyir.supabase.co:5432/postgres`);

const migrationSql = `
-- SPRAYHUB MIGRATION: POLYGONAL PRO STRUCTURE
-- 1. Nettoyage des anciennes données
TRUNCATE TABLE routes RESTART IDENTITY CASCADE;

-- 2. Mise à jour de la structure pour SAM 2
ALTER TABLE routes DROP COLUMN IF EXISTS holds;
ALTER TABLE routes ADD COLUMN holds jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Ajout d'une colonne spécifique pour les métadonnées de segmentation globale
ALTER TABLE walls ADD COLUMN IF NOT EXISTS detection_data jsonb DEFAULT '[]'::jsonb;

-- 3. Policy Update
DROP POLICY IF EXISTS "Admins have full access on routes" ON routes;
CREATE POLICY "Admins have full access on routes" ON routes FOR ALL USING (true);

COMMENT ON COLUMN routes.holds IS 'Array of objects: {id, type, contour: [[x,y],...], note}';
`;

async function runMigration() {
    try {
        console.log("🚀 Connexion à Supabase (Postgres)...");
        await sql.unsafe(migrationSql);
        console.log("✅ Migration terminée avec succès ! La structure est Polygonale Pro.");
    } catch (err) {
        console.error("❌ Échec de la migration :", err.message);
    } finally {
        process.exit();
    }
}

runMigration();
