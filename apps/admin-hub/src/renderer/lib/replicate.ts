import Replicate from "replicate";
import { processReplicateOutput } from './mask-processor';

const replicate = new Replicate({
    auth: import.meta.env.VITE_REPLICATE_API_TOKEN,
});

/**
 * Segmentation Robuste via Replicate Cloud (Zéro charge sur ton Mac)
 */
export async function segmentWallImage(imageUrl: string) {
    console.log("🚀 Lancement du scan IA Cloud (SAM 2)...");

    try {
        const output = await replicate.run(
            "meta/sam-2:fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83",
            {
                input: {
                    image: imageUrl,
                    points_per_side: 128,
                    pred_iou_thresh: 0.70,
                    stability_score_thresh: 0.70,
                    min_mask_region_area: 50,
                    use_m2m: true,
                }
            }
        );

        const polygons = await processReplicateOutput(output as any[]);
        console.log(`✅ Scan Cloud terminé ! ${polygons.length} prises détectées.`);
        return polygons;
    } catch (error) {
        console.error("❌ Erreur Replicate Cloud:", error);
        throw error;
    }
}
