import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Load env from admin-hub
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/admin-hub/.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Free SAM 2 Segmentation using Hugging Face Inference API
 * No API key needed for public models
 */
async function segmentWithHuggingFace(imageUrl) {
    console.log("🚀 Lancement de la segmentation gratuite (Hugging Face)...");

    try {
        // Use the free Hugging Face Inference API
        // Model: facebook/sam-vit-huge (Segment Anything Model)
        const response = await fetch(
            "https://api-inference.huggingface.co/models/facebook/sam-vit-huge",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: imageUrl,
                    parameters: {
                        points_per_side: 256,
                        pred_iou_thresh: 0.65,
                        stability_score_thresh: 0.65,
                        min_mask_region_area: 25,
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Hugging Face API error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("✅ Segmentation gratuite terminée !");
        return result;
    } catch (error) {
        console.error("❌ Erreur Hugging Face:", error);
        throw error;
    }
}

/**
 * Alternative: Use a public Gradio Space (completely free)
 */
async function segmentWithGradio(imageUrl) {
    console.log("🚀 Utilisation de Gradio Space gratuit...");

    try {
        // Use a public SAM 2 Gradio Space
        const response = await fetch(
            "https://facebook-sam2-image-predictor.hf.space/api/predict",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    data: [imageUrl]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gradio API error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("✅ Segmentation Gradio terminée !");
        return result.data;
    } catch (error) {
        console.error("❌ Erreur Gradio:", error);
        throw error;
    }
}

/**
 * Process segmentation output into polygon format
 */
function processSegmentationOutput(output) {
    console.log("🔄 Traitement des masques en polygones...");

    const polygons = [];

    // Process each mask into a polygon
    // This will depend on the output format from the API
    // For now, we'll return a placeholder structure

    if (Array.isArray(output)) {
        output.forEach((mask, index) => {
            // Convert mask to polygon coordinates
            // Simplified version - you'll need to adapt based on actual output
            polygons.push({
                id: `hold_${index}`,
                contour: mask.contour || [],
                role: "handfoot"
            });
        });
    }

    return polygons;
}

async function runFreeSegmentation() {
    console.log("🔍 Récupération du mur depuis Supabase...");

    // 1. Get the wall image
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
    const { count } = await supabase
        .from('holds')
        .select('*', { count: 'exact', head: true })
        .eq('wall_id', wall.id);

    if (count > 0) {
        console.log(`⚠️  Ce mur a déjà ${count} prises. Suppression pour re-segmenter...`);

        // Delete existing holds to re-segment
        await supabase
            .from('holds')
            .delete()
            .eq('wall_id', wall.id);
    }

    try {
        // Try Gradio first (most reliable free option)
        let output;
        try {
            output = await segmentWithGradio(wall.image_url);
        } catch (gradioError) {
            console.log("⚠️  Gradio failed, trying Hugging Face Inference API...");
            output = await segmentWithHuggingFace(wall.image_url);
        }

        const polygons = processSegmentationOutput(output);

        console.log(`💾 Sauvegarde de ${polygons.length} prises dans Supabase...`);

        // Save polygons to database
        for (const polygon of polygons) {
            await supabase
                .from('holds')
                .insert({
                    wall_id: wall.id,
                    hold_id: polygon.id,
                    polygon_coords: polygon.contour,
                    role: polygon.role
                });
        }

        console.log("✅ Segmentation gratuite terminée avec succès !");

    } catch (err) {
        console.error("❌ Erreur pendant la segmentation gratuite:", err);
        console.log("\n💡 Alternative: Utilisez l'outil manuel dans l'Admin Hub pour ajouter les prises manquantes.");
    }
}

runFreeSegmentation();
