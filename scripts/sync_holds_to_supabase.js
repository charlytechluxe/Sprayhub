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
    process.env.VITE_SUPABASE_ANON_KEY
);

async function syncHoldsToSupabase() {
    console.log("🔄 Synchronisation des prises JSON → Supabase...");

    try {
        // 1. Load local JSON file
        const jsonPath = path.join(__dirname, '../apps/client-pwa/src/data/holds_segmentation.json');
        const holdsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        console.log(`📦 ${holdsData.length} prises trouvées dans le JSON local`);

        // 2. Get Wall ID
        const { data: walls, error: wallError } = await supabase
            .from('walls')
            .select('id')
            .limit(1);

        if (wallError || !walls || walls.length === 0) {
            console.error("❌ Aucun mur trouvé dans Supabase");
            return;
        }

        const wallId = walls[0].id;
        console.log(`🎯 Mur ID: ${wallId}`);

        // 3. Update wall's detection_data with all holds
        console.log("💾 Mise à jour de detection_data...");

        const { error: updateError } = await supabase
            .from('walls')
            .update({ detection_data: holdsData })
            .eq('id', wallId);

        if (updateError) {
            console.error("❌ Erreur lors de la mise à jour:", updateError);
            return;
        }

        console.log("\n🎉 Synchronisation terminée avec succès !");
        console.log(`✅ ${holdsData.length} prises maintenant dans Supabase (walls.detection_data)`);

    } catch (err) {
        console.error("❌ Erreur:", err);
    }
}

syncHoldsToSupabase();
