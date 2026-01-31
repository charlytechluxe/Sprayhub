import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load env from client-pwa
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/client-pwa/.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function runMigration() {
    console.log("🚀 Exécution de la migration: add_detection_data...");

    try {
        const migrationPath = path.join(__dirname, '../supabase/migrations/20260131_add_detection_data.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log("📝 SQL à exécuter:");
        console.log(sql);
        console.log("\n");

        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error("❌ Erreur:", error);
            console.log("\n⚠️  La fonction exec_sql n'existe peut-être pas.");
            console.log("📋 Copiez le SQL ci-dessus et exécutez-le manuellement dans:");
            console.log("   Supabase Dashboard → SQL Editor");
            return;
        }

        console.log("✅ Migration exécutée avec succès !");
        console.log(data);

    } catch (err) {
        console.error("❌ Erreur:", err);
        console.log("\n📋 Veuillez exécuter manuellement la migration dans Supabase SQL Editor");
    }
}

runMigration();
