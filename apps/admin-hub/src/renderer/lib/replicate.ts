import Replicate from "replicate";
import { processReplicateOutput, ProcessedHold } from './mask-processor';

const replicate = new Replicate({
    auth: import.meta.env.VITE_REPLICATE_API_TOKEN,
});

export async function segmentWallImage(imageUrl: string) {
    console.log("🚀 Lancement du Stratégie Multi-Pass IA (SAM 2)...");

    try {
        // PASS 1: MACRO SCAN (High Confidence, No Fragmentation)
        console.log("🔍 Pass 1: Detection des volumes et grosses prises...");
        const outputMacro = await replicate.run(
            "facebookresearch/segment-anything-2:40b462fb9a799052b653526131c7784013ea0156d95955034c5417830b561937",
            {
                input: {
                    image: imageUrl,
                    points_per_side: 64, // Sufficient for large objects
                    pred_iou_thresh: 0.85, // Only high quality
                    stability_score_thresh: 0.85,
                    box_nms_thresh: 0.5, // Help merge fragments
                    min_mask_region_area: 1000, // Only big things
                    use_m2m: true,
                }
            }
        );
        const macroHolds = await processReplicateOutput(outputMacro as any[]);
        console.log(`📦 Pass 1 terminé : ${macroHolds.length} macros détectées.`);

        // PASS 2: MICRO SCAN (High Sensitivity, Detail Focus)
        console.log("🔍 Pass 2: Detection des petites prises et pieds...");
        const outputMicro = await replicate.run(
            "facebookresearch/segment-anything-2:40b462fb9a799052b653526131c7784013ea0156d95955034c5417830b561937",
            {
                input: {
                    image: imageUrl,
                    points_per_side: 128, // High density for small things
                    pred_iou_thresh: 0.60, // Very sensitive
                    stability_score_thresh: 0.60,
                    min_mask_region_area: 50, // Keep tiny chips
                    use_m2m: true,
                }
            }
        );
        const microHolds = await processReplicateOutput(outputMicro as any[]);
        console.log(`📍 Pass 2 terminé : ${microHolds.length} candidats détectés.`);

        // MERGE & FILTER (No Regression Logic)
        const combined = mergeAndFilterHolds(macroHolds, microHolds);
        console.log(`✅ Fusion terminée ! Total final : ${combined.length} prises.`);

        return combined;
    } catch (error) {
        console.error("❌ Erreur Stratégie Multi-Pass:", error);
        throw error;
    }
}

/**
 * Intelligent filter to prevent Pass 2 from overriding/fragmenting Pass 1 detections.
 * Discards micro-holds that are redundant with macro-holds.
 */
function mergeAndFilterHolds(macro: ProcessedHold[], micro: ProcessedHold[]): ProcessedHold[] {
    const final: ProcessedHold[] = [...macro];

    for (const mic of micro) {
        let isRedundant = false;

        // Calculate micro centroid
        const [mx, my, mw, mh] = mic.bbox;
        const mcx = mx + mw / 2;
        const mcy = my + mh / 2;

        for (const mac of macro) {
            const [Mx, My, Mw, Mh] = mac.bbox;

            // 1. Centroid check: Is the micro hold's center inside the macro hold's bounding box?
            // (Padding added to be safe: 5%)
            if (mcx > Mx && mcx < Mx + Mw && mcy > My && mcy < My + Mh) {
                // Potential fragment or overlapping detection
                // If the macro is significantly larger, we trust the macro
                if (mac.area_px > mic.area_px * 2) {
                    isRedundant = true;
                    break;
                }
            }

            // 2. Simple overlap check (IoU on bounding boxes for performance)
            const overlapX = Math.max(0, Math.min(mx + mw, Mx + Mw) - Math.max(mx, Mx));
            const overlapY = Math.max(0, Math.min(my + mh, My + Mh) - Math.max(my, My));
            const overlapArea = overlapX * overlapY;
            const microArea = mw * mh;

            if (overlapArea > microArea * 0.7) { // 70% of micro is inside macro
                isRedundant = true;
                break;
            }
        }

        if (!isRedundant) {
            final.push(mic);
        }
    }

    return final;
}
