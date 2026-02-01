import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fetch from 'node-fetch';
import { Jimp } from 'jimp'; // Check if this import works with latest Jimp, otherwise use CommonJS style or default

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/admin-hub/.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

// --- GEOMETRY & COLOR HELPERS ---

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

// Color Distance (Euclidean in RGB is simple enough for this)
const colorDist = (c1, c2) => {
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
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

// 2. SMART SPLITTER: Uses both geometry and color
const smartSplit = async (polygons, image) => {
    console.log(`🧠 Analyse INTELLIGENTE (Couleur + Forme) pour les découpes...`);
    let newPolygons = [];
    let splitCount = 0;
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    for (let poly of polygons) {
        let coords = poly.contour || poly.geometry;
        if (!coords || coords.length < 20) { newPolygons.push(poly); continue; }
        if (getPolygonArea(coords) < 0.001) { newPolygons.push(poly); continue; }

        // 1. Color Check
        // We pick 5 diverse points inside the polygon bbox to check for variance
        const samples = [];
        // Just walk the perimeter for samples to be faster and likely hit different colored regions if merged
        for (let i = 0; i < coords.length; i += Math.floor(coords.length / 8)) {
            const p = coords[i];
            const px = Math.floor(p[0] * width);
            const py = Math.floor(p[1] * height);
            if (px >= 0 && px < width && py >= 0 && py < height) {
                // Modern Jimp (v1+) uses instance methods or has different static API
                // But for safety, let's use the instance method on 'image' if available or manual calc.
                // Standard jimp: Jimp.intToRGBA vs image.intToRGBA is tricky with versions.
                // Let's implement manually to be 100% safe.
                const val = image.getPixelColor(px, py);
                samples.push({
                    r: (val >>> 24) & 0xFF,
                    g: (val >>> 16) & 0xFF,
                    b: (val >>> 8) & 0xFF,
                    a: val & 0xFF
                });
            }
        }

        let maxD = 0;
        for (let i = 0; i < samples.length; i++) {
            for (let j = i + 1; j < samples.length; j++) {
                const d = colorDist(samples[i], samples[j]);
                if (d > maxD) maxD = d;
            }
        }

        // If simple perimeter sampling didn't find diff, check centroid too
        // (Just in case center is different, though unlikely for merged blobs)

        // Threshold: 60 is a significant color difference (e.g. Red vs Blue)
        if (maxD < 60) {
            // Uniform color -> No split needed, it's a single hold
            newPolygons.push(poly);
            continue;
        }

        // Has color variance -> Try to find a neck (Waist Splitter Logic)
        // We look for a narrow neck which is likely the junction
        let bestCut = null;
        let minNeckWidth = Infinity;
        const n = coords.length;
        const minIndexDist = Math.floor(n * 0.15);
        const maxNeck = 0.08; // More permissive neck because we know colors differ!

        for (let i = 0; i < n; i += 2) {
            for (let j = i + minIndexDist; j < n - minIndexDist; j += 2) {
                const d = dist(coords[i], coords[j]);
                if (d < maxNeck) {
                    const mid = [(coords[i][0] + coords[j][0]) / 2, (coords[i][1] + coords[j][1]) / 2];
                    if (isPointInPolygon(mid, coords)) {
                        // Check cut quality?
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
            const contour1 = [...coords.slice(0, idx1 + 1), ...coords.slice(idx2)];
            const contour2 = coords.slice(idx1, idx2 + 1);

            // Keep both parts if they are big enough
            if (getPolygonArea(contour1) > 0.00005 && getPolygonArea(contour2) > 0.00005) {
                newPolygons.push({ ...poly, contour: contour1, id: poly.id + "_A" });
                newPolygons.push({ ...poly, contour: contour2, id: poly.id + "_B" });
                splitCount++;
                // console.log(`   🎨✂️ Split confirmed (DeltaE: ${Math.floor(maxD)})`);
                continue;
            }
        }
        newPolygons.push(poly);
    }
    console.log(`🎨✂️  Découpes Intelligentes effectuées : ${splitCount}`);
    return newPolygons;
};


// --- MAIN FLOW ---

async function runAutoAnalysis() {
    console.log("🔍 Vérification des murs (GRATUIT/SIMULATION)...");

    const { data: wall, error: wallError } = await supabase.from('walls').select('*').limit(1).single();

    if (wallError || !wall) { console.error("❌ Mur introuvable."); return; }
    console.log(`📸 Mur trouvé: ${wall.name}`);

    // Check overlap
    if (wall.detection_data && wall.detection_data.length > 0 && process.env.FORCE_REANALYZE !== 'true') {
        console.log(`✅ Skip. (FORCE_REANALYZE=true)`);
        return;
    }

    // LOAD IMAGE FOR COLOR ANALYSIS - SKIPPED (Not needed if Smart Split is disabled)
    /*
    console.log(` Téléchargement image pour analyse couleur...`);
    let image = null;
    try {
        const imgRes = await fetch(wall.image_url);
        const imgBuffer = await imgRes.arrayBuffer();
        image = await Jimp.read(Buffer.from(imgBuffer));
        console.log(`✅ Image chargée: ${image.bitmap.width}x${image.bitmap.height}`);
    } catch (e) {
        console.error("❌ Erreur chargement image:", e);
        // return; // Don't abort, just continue without image
    }
    */

    let output = [];
    // Load Simulation Data
    try {
        const jsonPath = path.join(__dirname, '../apps/client-pwa/src/data/holds_final_force.json');
        if (fs.existsSync(jsonPath)) {
            const rawData = fs.readFileSync(jsonPath, 'utf-8');
            output = JSON.parse(rawData).map((h, i) => ({ geometry: h.contour, is_simulated: true }));
        } else { throw new Error("No sim data"); }
    } catch (e) {
        console.error("❌ Sim Error:", e);
        return;
    }

    // PIPELINE
    let validPolygons = [];
    if (Array.isArray(output)) {
        let normalized = output.map((poly, index) => ({
            id: `auto_hold_${Date.now()}_${index}`,
            contour: poly.geometry || poly.contour || poly,
            role: 'handfoot',
            is_simulated: poly.is_simulated
        }));

        // 2. De-Nesting
        normalized = removeNestedPolygons(normalized);

        // 3. Smart Color Split - DISABLED (Too risky without visual feedback)
        // normalized = await smartSplit(normalized, image);

        // 4. Final Noise Filter
        validPolygons = normalized.filter(poly => {
            let coords = poly.contour;
            if (!Array.isArray(coords) || coords.length < 3) return false;
            const area = getPolygonArea(coords);
            const isPixelCoords = coords.some(pt => pt[0] > 1.2 || pt[1] > 1.2);
            let isGarbage = false;
            // Low thresholds
            if (isPixelCoords) { if (area < 20) isGarbage = true; }
            else { if (area < 0.00001) isGarbage = true; }
            return !isGarbage;
        });
    }

    console.log(`🛡️ Traitement terminé : ${validPolygons.length} prises valides.`);

    if (validPolygons.length > 0) {
        const { error: updateError } = await supabase.from('walls').update({ detection_data: validPolygons }).eq('id', wall.id);
        if (updateError) console.error("❌ Erreur sauvegarde:", updateError);
        else console.log("✅ Sauvegarde réussie.");
    }
}

runAutoAnalysis();
