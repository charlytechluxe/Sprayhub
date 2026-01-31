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

// New holds manually created (RE-ADJUSTED COORDINATES)
const NEW_HOLDS = [
    // Triangles Verts (Remontés de 0.95 -> 0.70)
    {
        "id": "bottom_triangle_green_center_1", // Triangle vert central (sous le bloc vert/rose)
        "contour": [[0.52, 0.68], [0.55, 0.68], [0.535, 0.73], [0.52, 0.72]],
        "role": "foot"
    },
    {
        "id": "bottom_triangle_green_right_1", // Triangle vert à droite
        "contour": [[0.85, 0.85], [0.88, 0.85], [0.865, 0.90], [0.85, 0.89]],
        "role": "foot"
    },
    // Ajout plus large de la zone du bas (toute la zone basse)
    {
        "id": "bottom_zone_fill",
        "contour": [[0.1, 0.80], [0.9, 0.80], [0.9, 0.98], [0.1, 0.98]],
        "role": "foot"
    }
];

async function restoreProQuality() {
    console.log("🚨 RESTAURATION QUALITÉ PRO (Pixel Perfect)...");

    try {
        // 1. Load the MASSIVE PRO JSON file
        const jsonPath = path.join(__dirname, '../apps/client-pwa/src/data/holds_final_force.json');

        console.log("Lecture du fichier haute définition (3.5 Mo)...");
        const proHoldsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        console.log(`📦 ${proHoldsData.length} prises haute définition chargées.`);

        // 2. Merge with NEW holds
        console.log(`➕ Ajout des ${NEW_HOLDS.length} nouvelles prises manuelles...`);
        const finalHolds = [...proHoldsData, ...NEW_HOLDS];

        console.log(`🎯 TOTAL FINAL: ${finalHolds.length} prises.`);

        // 3. Get Wall ID
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

        // 4. Update Supabase with the PRO dataset
        console.log("💾 Envoi des données vers Supabase (ça peut prendre quelques secondes)...");

        const { error: updateError } = await supabase
            .from('walls')
            .update({ detection_data: finalHolds })
            .eq('id', wallId);

        if (updateError) {
            console.error("❌ Erreur lors de la mise à jour:", updateError);
            return;
        }

        console.log("\n✅ RESTAURATION TERMINÉE !");
        console.log("✨ Le mur a retrouvé sa qualité Pixel Perfect + les nouvelles prises.");
        console.log("👉 Rafraîchissez l'application PWA.");

    } catch (err) {
        console.error("❌ Erreur:", err);
    }
}

restoreProQuality();
