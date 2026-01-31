import Replicate from "replicate";
import { processReplicateOutput } from './mask-processor';

// Initialize Replicate with the API key
// In a real production app, this should be done on the server-side to protect the key.
// For this admin tool, we'll use it directly but ideally via a Netlify/Vercel function.
const replicate = new Replicate({
    auth: import.meta.env.VITE_REPLICATE_API_TOKEN,
});

export async function segmentWallImage(imageUrl: string) {
    console.log("🚀 Lancement du scan IA via Replicate Cloud...", imageUrl);

    try {
        const output = await replicate.run(
            "facebookresearch/segment-anything-2:40b462fb9a799052b653526131c7784013ea0156d95955034c5417830b561937", // Checkpoint SAM 2 Large
            {
                input: {
                    image: imageUrl,
                    points_per_side: 256, // ULTRA DENSITY: Nécessaire pour 550+ prises
                    pred_iou_thresh: 0.82, // Tuning fin pour éviter les doublons mais garder les prises difficiles
                    stability_score_thresh: 0.85,
                    crop_n_layers: 1, // Deep Zoom activé pour séparer les prises collées
                    crop_n_points_downscale_factor: 2,
                    min_mask_region_area: 50, // Garder même les puces (chips)
                    use_m2m: true, // Optimisation pour les masques multiples
                }
            }
        );

        const polygons = await processReplicateOutput(output as any[]);
        console.log(`✅ Scan terminé ! ${polygons.length} prises vectorisées.`);
        return polygons;
    } catch (error) {
        console.error("❌ Erreur Replicate:", error);
        throw error;
    }
}
