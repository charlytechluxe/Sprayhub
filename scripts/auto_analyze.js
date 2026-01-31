
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from admin-hub
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/admin-hub/.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

const replicate = new Replicate({
    auth: process.env.VITE_REPLICATE_API_TOKEN,
});

async function runAutoAnalysis() {
    console.log("🔍 Vérification des murs en attente d'analyse...");

    // 1. Get the wall image
    // For now we assume there's one main wall or we use the default
    const { data: wall, error: wallError } = await supabase
        .from('walls')
        .select('*')
        .limit(1)
        .single();

    if (wallError || !wall) {
        console.error("❌ Aucun mur trouvé dans la base de données.");
        return;
    }

    console.log(`📸 Mur trouvé: ${wall.name} (${wall.image_url})`);

    // 2. Check if already has holds
    const { count, error: countError } = await supabase
        .from('holds')
        .select('*', { count: 'exact', head: true })
        .eq('wall_id', wall.id);

    if (count > 0) {
        console.log(`✅ Ce mur a déjà ${count} prises détectées. Skip.`);
        return;
    }

    console.log("🚀 Lancement de l'IA Replicate (SAM 2)...");

    try {
        const output = await replicate.run(
            "facebookresearch/segment-anything-2:40b462fb9a799052b653526131c7784013ea0156d95955034c5417830b561937",
            {
                input: {
                    image: wall.image_url,
                    points_per_side: 256,        // Increased for better coverage
                    pred_iou_thresh: 0.65,       // Slightly lowered for small holds
                    stability_score_thresh: 0.65, // Slightly lowered for small holds
                    min_mask_region_area: 25,    // REDUCED to detect small triangles
                    use_m2m: true,
                }
            }
        );

        console.log("✅ Analyse Replicate JSON reçue. Traitement des polygones...");

        // Simplified processing for the script
        const polygons = output; // Ideally we use the same logic as mask-processor

        console.log(`💾 Sauvegarde de ${polygons.length} prises dans Supabase...`);

        // ... Logique de sauvegarde ...
        // (On va l'implémenter plus en détail si besoin, mais le principe est là)

    } catch (err) {
        console.error("❌ Erreur pendant l'analyse automatique:", err);
    }
}

runAutoAnalysis();
