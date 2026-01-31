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

// --- GEOMETRY HELPERS ---

const dist = (p1, p2) => Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));

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

const getCentroid = (coords) => {
    let x = 0, y = 0, n = coords.length;
    for (let p of coords) {
        x += p[0];
        y += p[1];
    }
    return [x / n, y / n];
};

const getCoverageRatio = (polyA, polyB, bboxB) => {
    const bboxA = getBBox(polyA);
    if (bboxA.maxX < bboxB.minX || bboxA.minX > bboxB.maxX ||
        bboxA.maxY < bboxB.minY || bboxA.minY > bboxB.maxY) {
        return 0; // No overlap possible
    }

    let pointsInside = 0;
    const step = 1;

    for (let i = 0; i < polyA.length; i += step) {
        if (isPointInPolygon(polyA[i], polyB)) {
            pointsInside++;
        }
    }
    return pointsInside / polyA.length;
};

// --- ADVANCED PROCESSING ---

// 1. CLEANER: Removes nested / duplicate holds
const removeNestedPolygons = (polygons) => {
    console.log(`🧹 Démarrage du nettoyage AGRESSIF des inclusions...`);

    let candidates = polygons.map(p => {
        let coords = p.geometry || p.contour || p;
        return {
            original: p,
            coords: coords,
            area: getPolygonArea(coords),
            bbox: getBBox(coords),
            centroid: getCentroid(coords),
            keep: true
        };
    });

    // Sort by Area Descending
    candidates.sort((a, b) => b.area - a.area);

    let removedCount = 0;
    const COVERAGE_THRESHOLD = 0.50; // 50% overlap is suspicious

    for (let i = 0; i < candidates.length; i++) {
        if (!candidates[i].keep) continue;
        const outer = candidates[i];

        for (let j = i + 1; j < candidates.length; j++) {
            if (!candidates[j].keep) continue;
            const inner = candidates[j];

            // Criteria: Center Inside OR High Coverage
            const centerInside = isPointInPolygon(inner.centroid, outer.coords);
            const coverage = getCoverageRatio(inner.coords, outer.coords, outer.bbox);

            if (centerInside || coverage > COVERAGE_THRESHOLD) {
                candidates[j].keep = false;
                removedCount++;
            }
        }
    }

    console.log(`✨ Nettoyage terminé : ${removedCount} doublons persistants supprimés.`);
    return candidates.filter(c => c.keep).map(c => c.original);
};

// 2. SPLITTER: Cuts merged "Figure-8" holds
const splitMergedPolygons = (polygons) => {
    console.log(`✂️  Analyse CHIRURGICALE des fusions (Waist Splitter)...`);
    let newPolygons = [];
    let splitCount = 0;

    for (let poly of polygons) {
        let coords = poly.contour || poly.geometry;
        if (!coords || coords.length < 20) {
            newPolygons.push(poly);
            continue;
        }

        const area = getPolygonArea(coords);
        if (area < 0.001) {
            newPolygons.push(poly);
            continue;
        }

        // Find "Neck" candidates
        let bestCut = null;
        let minNeckWidth = Infinity;
        const n = coords.length;

        // We look for points far in index but close in space
        const minIndexDist = Math.floor(n * 0.15);
        const maxNeck = 0.05; // ~5% of wall width

        for (let i = 0; i < n; i += 2) {
            for (let j = i + minIndexDist; j < n - minIndexDist; j += 2) {

                const d = dist(coords[i], coords[j]);

                if (d < maxNeck) {
                    const mid = [(coords[i][0] + coords[j][0]) / 2, (coords[i][1] + coords[j][1]) / 2];

                    // Check if midpoint is inside (valid cut)
                    if (isPointInPolygon(mid, coords)) {
                        if (d < minNeckWidth) {
                            minNeckWidth = d;
                            bestCut = { i, j };
                        }
                    }
                }
            }
        }

        if (bestCut) {
            const idx1 = bestCut.i;
            const idx2 = bestCut.j;

            const contour1 = [
                ...coords.slice(0, idx1 + 1),
                ...coords.slice(idx2)
            ];

            const contour2 = coords.slice(idx1, idx2 + 1);

            // Validation: Keep split only if pieces are substantial
            if (getPolygonArea(contour1) > 0.0001 && getPolygonArea(contour2) > 0.0001) {
                newPolygons.push({ ...poly, contour: contour1, id: poly.id + "_A" });
                newPolygons.push({ ...poly, contour: contour2, id: poly.id + "_B" });
                splitCount++;
                continue;
            }
        }

        newPolygons.push(poly);
    }

    console.log(`✂️  Chirurgie terminée : ${splitCount} prises fusionnées ont été coupées en deux.`);
    return newPolygons;
};


// --- MAIN FLOW ---

async function runAutoAnalysis() {
    console.log("🔍 Vérification des murs (GRATUIT/SIMULATION)...");

    const { data: wall, error: wallError } = await supabase.from('walls').select('*').limit(1).single();

    if (wallError || !wall) {
        console.error("❌ Aucun mur trouvé.");
        return;
    }

    console.log(`📸 Mur trouvé: ${wall.name}`);

    // Check overlap
    let existingCount = 0;
    if (wall.detection_data && Array.isArray(wall.detection_data)) {
        existingCount = wall.detection_data.length;
    }

    if (existingCount > 0 && process.env.FORCE_REANALYZE !== 'true') {
        console.log(`✅ Ce mur a déjà ${existingCount} prises. Skip. (FORCE_REANALYZE=true pour forcer)`);
        return;
    }

    if (process.env.FORCE_REANALYZE === 'true') {
        console.log("🔥 MODE FORCE ACTIVÉ");
    }

    let output = [];
    let useSimulation = true; // Force simulation since API is down

    if (useSimulation) {
        try {
            const jsonPath = path.join(__dirname, '../apps/client-pwa/src/data/holds_final_force.json');

            if (fs.existsSync(jsonPath)) {
                console.log("🧠 Chargement modèle 'Pro' Local...");
                const rawData = fs.readFileSync(jsonPath, 'utf-8');
                const proHolds = JSON.parse(rawData);

                output = proHolds.map((h, i) => ({
                    geometry: h.contour,
                    is_simulated: true
                }));

                console.log(`✅ ${output.length} prises brutes chargées.`);
            } else {
                throw new Error(`Fichier simulation introuvable`);
            }
        } catch (simError) {
            console.error("❌ Echec Simulation:", simError.message);
            return;
        }
    }

    // PROCESSING PIPELINE
    let validPolygons = [];

    if (Array.isArray(output)) {
        // 1. Normalize
        let normalized = output.map((poly, index) => {
            let coords = poly.geometry || poly.contour || poly;
            return {
                id: `auto_hold_${Date.now()}_${index}`,
                contour: coords,
                role: 'handfoot',
                is_simulated: poly.is_simulated
            };
        });

        // 2. De-Nesting (Clean inner ghosts)
        normalized = removeNestedPolygons(normalized);

        // 3. Split Logic (Cut fused holds)
        // 3. Split Logic (Cut fused holds) - DISABLED (Broke valid holds)
        // normalized = splitMergedPolygons(normalized);

        // 4. Final Noise Filter
        validPolygons = normalized.filter(poly => {
            let coords = poly.contour;
            if (!Array.isArray(coords) || coords.length < 3) return false;

            const isPixelCoords = coords.some(pt => pt[0] > 1.2 || pt[1] > 1.2);
            const area = getPolygonArea(coords);
            let isGarbage = false;

            // Updated Thresholds for "Missing Holds"
            const REFINED_MAX_AREA = 0.05;
            const REFINED_MIN_AREA = 0.00001; // Ultra low to catch everything

            if (isPixelCoords) {
                if (area < 20) isGarbage = true;  // 20px min
            } else {
                if (area > REFINED_MAX_AREA) isGarbage = true;
                if (area < REFINED_MIN_AREA) isGarbage = true;
            }
            return !isGarbage;
        });
    }

    console.log(`🛡️ Traitement terminé : ${validPolygons.length} prises valides.`);

    if (validPolygons.length > 0) {
        console.log(`💾 Sauvegarde...`);
        const { error: updateError } = await supabase
            .from('walls')
            .update({ detection_data: validPolygons })
            .eq('id', wall.id);

        if (updateError) console.error("❌ Erreur sauvegarde:", updateError);
        else console.log("✅ Sauvegarde réussie.");
    }
}

runAutoAnalysis();
