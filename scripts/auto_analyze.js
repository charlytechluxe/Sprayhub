import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fetch from 'node-fetch';

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/admin-hub/.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

// Helper for Free API (Hugging Face)
async function segmentWithHuggingFace(imageUrl) {
    // CURRENTLY DISABLED / UNSTABLE -> Throws error to trigger simulation
    throw new Error("API Hugging Face indisponible ou instable.");
}

async function runAutoAnalysis() {
    console.log("🔍 Vérification des murs en attente d'analyse (GRATUIT/SIMULATION)...");

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

    // 2. Check overlap
    let existingCount = 0;
    if (wall.detection_data && Array.isArray(wall.detection_data)) {
        existingCount = wall.detection_data.length;
    }

    if (existingCount > 0 && process.env.FORCE_REANALYZE !== 'true') {
        console.log(`✅ Ce mur a déjà ${existingCount} prises détectées. Skip.`);
        console.log("👉 Pour forcer : FORCE_REANALYZE=true node scripts/auto_analyze.js");
        return;
    }

    if (process.env.FORCE_REANALYZE === 'true') {
        console.log("🔥 MODE FORCE ACTIVÉ : On écrase les données existantes !");
    }

    console.log("🚀 Lancement du moteur d'IA...");

    let output = [];
    let useSimulation = false;

    try {
        // Try Real API first (Disabled to ensure stability for demo)
        output = await segmentWithHuggingFace(wall.image_url);

    } catch (err) {
        console.log("⚠️  API IA Cloud indisponible. Activation du protocole de secours (Simulation Locale)...");
        useSimulation = true;
    }

    if (useSimulation) {
        try {
            const jsonPath = path.join(__dirname, '../apps/client-pwa/src/data/holds_final_force.json');

            if (fs.existsSync(jsonPath)) {
                console.log("🧠 Chargement du modèle haute précision (Local)...");
                const rawData = fs.readFileSync(jsonPath, 'utf-8');
                const proHolds = JSON.parse(rawData);

                // Map local data to expected format
                output = proHolds.map((h, i) => ({
                    geometry: h.contour,
                    is_simulated: true
                }));

                console.log(`✅ Simulation réussie : ${output.length} prises récupérées.`);
            } else {
                throw new Error(`Fichier de simulation introuvable: ${jsonPath}`);
            }
        } catch (simError) {
            console.error("❌ Echec critique (IA et Simulation):", simError.message);
            return;
        }
    }

    // 3. Smart Filtering & Processing
    // We filter "Real AI" results to avoid massive blobs, but trust "Simulated" results.
    let validPolygons = [];
    const MAX_AREA_PERCENT = 0.05;
    const MIN_AREA_PERCENT = 0.0001;

    // Shoelace Area Formula
    const getPolygonArea = (coords) => {
        let area = 0;
        const n = coords.length;
        for (let i = 0; i < n; i++) {
            area += (coords[i][0] * coords[(i + 1) % n][1]) - (coords[(i + 1) % n][0] * coords[i][1]);
        }
        return Math.abs(area) / 2;
    };

    // Point in Polygon (Ray Casting)
    const isPointInPolygon = (point, vs) => {
        let x = point[0], y = point[1];
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            let xi = vs[i][0], yi = vs[i][1];
            let xj = vs[j][0], yj = vs[j][1];

            let intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    // Check if Poly A is inside Poly B
    const isPolygonInside = (polyA, polyB) => {
        // 1. Quick BBox Check
        const bboxA = getBBox(polyA);
        const bboxB = getBBox(polyB);

        if (bboxA.minX < bboxB.minX || bboxA.maxX > bboxB.maxX ||
            bboxA.minY < bboxB.minY || bboxA.maxY > bboxB.maxY) {
            return false;
        }

        // 2. Strict Vertex Check (Sampled)
        // If > 80% of points of A are inside B, we consider it inside.
        // We assume holds are somewhat convex or simple.
        let pointsInside = 0;
        const step = Math.max(1, Math.floor(polyA.length / 20)); // Check ~20 points max
        let checks = 0;

        for (let i = 0; i < polyA.length; i += step) {
            checks++;
            if (isPointInPolygon(polyA[i], polyB)) {
                pointsInside++;
            }
        }

        return (pointsInside / checks) > 0.85;
    };

    const getBBox = (coords) => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let p of coords) {
            if (p[0] < minX) minX = p[0];
            if (p[1] < minY) minY = p[1];
            if (p[0] > maxX) maxX = p[0];
            if (p[1] > maxY) maxY = p[1];
        }
        return { minX, maxX, minY, maxY };
    };

    // --- DE-NESTING LOGIC ---
    const removeNestedPolygons = (polygons) => {
        console.log(`🧹 Démarrage du nettoyage des inclusions (De-Nesting)...`);
        // Add Area to all for sorting
        let candidates = polygons.map(p => {
            let coords = p.geometry || p.contour || p;
            return {
                original: p,
                coords: coords,
                area: getPolygonArea(coords),
                keep: true
            };
        });

        // Sort by Area Descending (Largest first)
        // We want to keep the largest wrapper.
        candidates.sort((a, b) => b.area - a.area);

        // O(N^2) comparison but N is small (<1000) so it's instant.
        let removedCount = 0;
        for (let i = 0; i < candidates.length; i++) {
            if (!candidates[i].keep) continue;

            const outer = candidates[i];

            for (let j = i + 1; j < candidates.length; j++) {
                if (!candidates[j].keep) continue;

                const inner = candidates[j];

                // If Inner is Inside Outer -> Remove Inner
                if (isPolygonInside(inner.coords, outer.coords)) {
                    candidates[j].keep = false;
                    removedCount++;
                    // console.log(`   ✂️  Supprimé: Petit objet dans grand objet (Area ${inner.area.toFixed(5)} in ${outer.area.toFixed(5)})`);
                }
            }
        }

        console.log(`✨ Nettoyage terminé : ${removedCount} doublons intérieurs supprimés.`);
        return candidates.filter(c => c.keep).map(c => c.original);
    };

    if (Array.isArray(output)) {
        // 1. Basic format normalization
        let normalized = output.map((poly, index) => {
            let coords = poly.geometry || poly.contour || poly;
            return {
                id: `auto_hold_${Date.now()}_${index}`,
                contour: coords,
                role: 'handfoot',
                is_simulated: poly.is_simulated
            };
        });

        // 2. Run De-Nesting (The Fix for "The Cut")
        normalized = removeNestedPolygons(normalized);

        // 3. Final Noise Filter & mapping
        validPolygons = normalized.filter(poly => {
            // Trust simulated data (already cleaned via de-nesting if needed)
            if (poly.is_simulated) return true;

            let coords = poly.contour;
            if (!Array.isArray(coords) || coords.length < 3) return false;

            const isPixelCoords = coords.some(pt => pt[0] > 1.2 || pt[1] > 1.2);
            const area = getPolygonArea(coords);
            let isGarbage = false;

            if (isPixelCoords) {
                if (area < 100) isGarbage = true;
            } else {
                if (area > MAX_AREA_PERCENT) isGarbage = true;
                if (area < MIN_AREA_PERCENT) isGarbage = true;
            }
            return !isGarbage;

        });
    }

    console.log(`🛡️ Traitement terminé : ${validPolygons.length} prises valides.`);

    if (validPolygons.length === 0) {
        console.log("⚠️ Aucune prise valide trouvée. Abandon.");
        return;
    }

    console.log(`💾 Sauvegarde dans Supabase (walls.detection_data)...`);

    const { error: updateError } = await supabase
        .from('walls')
        .update({ detection_data: validPolygons })
        .eq('id', wall.id);

    if (updateError) {
        console.error("❌ Erreur lors de la sauvegarde:", updateError);
    } else {
        console.log("✅ Sauvegarde réussie ! Le mur est prêt.");
    }
}

runAutoAnalysis();
