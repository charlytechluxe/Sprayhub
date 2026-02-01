import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Jimp } from 'jimp';

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/client-pwa/.env') });

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

const getCentroid = (coords) => {
    let x = 0, y = 0, n = coords.length;
    for (let p of coords) {
        x += p[0];
        y += p[1];
    }
    return [x / n, y / n];
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

const getCoverageRatio = (inner, outer, bboxOuter) => {
    const bboxInner = getBBox(inner);
    if (bboxInner.maxX < bboxOuter.minX || bboxInner.minX > bboxOuter.maxX ||
        bboxInner.maxY < bboxOuter.minY || bboxInner.minY > bboxOuter.maxY) {
        return 0;
    }
    let pointsInside = 0;
    for (const p of inner) {
        if (isPointInPolygon(p, outer)) pointsInside++;
    }
    return pointsInside / inner.length;
};

// --- COLOR SPLIT LOGIC ---
const colorDist = (c1, c2) => {
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
};

const smartSplit = (polygons, image) => {
    console.log(`🎨 Lancement de la découpe couleur...`);
    let newPolygons = [];
    let splitCount = 0;
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    for (let poly of polygons) {
        let coords = poly.contour || poly.geometry;
        if (!coords || coords.length < 20) { newPolygons.push(poly); continue; }
        if (getPolygonArea(coords) < 0.001) { newPolygons.push(poly); continue; }

        // Sample colors along the perimeter
        const samples = [];
        // Sample every Nth point to cover the shape
        const step = Math.max(5, Math.floor(coords.length / 12));

        for (let i = 0; i < coords.length; i += step) {
            const p = coords[i];
            const px = Math.floor(p[0] * width);
            const py = Math.floor(p[1] * height);

            if (px >= 0 && px < width && py >= 0 && py < height) {
                const val = image.getPixelColor(px, py);
                samples.push({
                    r: (val >>> 24) & 0xFF,
                    g: (val >>> 16) & 0xFF,
                    b: (val >>> 8) & 0xFF,
                });
            }
        }

        // Find Max Color Distance in samples
        let maxD = 0;
        for (let i = 0; i < samples.length; i++) {
            for (let j = i + 1; j < samples.length; j++) {
                const d = colorDist(samples[i], samples[j]);
                if (d > maxD) maxD = d;
            }
        }

        // THRESHOLD: 60 approx corresponds to distinct colors (e.g. Red vs Yellow)
        if (maxD < 60) {
            newPolygons.push(poly); // Uniform color
            continue;
        }

        // Color difference DETECTED -> Try to cut at "Neck"
        let bestCut = null;
        let minNeckWidth = Infinity;
        const n = coords.length;
        const minIndexDist = Math.floor(n * 0.15); // Don't cut adjacent points

        // Only consider cuts shorter than 8% of wall width
        const maxNeck = 0.08;

        for (let i = 0; i < n; i += 2) {
            for (let j = i + minIndexDist; j < n - minIndexDist; j += 2) {
                const d = dist(coords[i], coords[j]);

                if (d < maxNeck) {
                    const mid = [(coords[i][0] + coords[j][0]) / 2, (coords[i][1] + coords[j][1]) / 2];

                    // Critical: Midpoint must be INSIDE polygon to be a valid internal cut
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
            const contour1 = [...coords.slice(0, idx1 + 1), ...coords.slice(idx2)];
            const contour2 = coords.slice(idx1, idx2 + 1);

            // Valid splits must be substantial
            if (getPolygonArea(contour1) > 0.0001 && getPolygonArea(contour2) > 0.0001) {
                newPolygons.push({ ...poly, contour: contour1, id: poly.id + "_A" });
                newPolygons.push({ ...poly, contour: contour2, id: poly.id + "_B" });
                splitCount++;
                continue;
            }
        }
        newPolygons.push(poly);
    }
    console.log(`✂️  SPLIT RÉUSSI : ${splitCount} prises coupées en deux.`);
    return newPolygons;
};


async function runAnalysis() {
    console.log("🧬 ANALYSE COMBINÉE : Nettoyage 'V2' + Découpe Couleur...");

    try {
        // 1. DATA
        const jsonPath = path.join(__dirname, '../apps/client-pwa/src/data/holds_final_force.json');
        let holds = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        holds = holds.map(h => ({ ...h, contour: h.contour || h.geometry, area: getPolygonArea(h.contour || h.geometry) }));
        console.log(`📦 Prises chargées: ${holds.length}`);

        // 2. IMAGE (Local)
        const imgPath = path.join(__dirname, '../apps/client-pwa/public/wall_v1.jpg');
        console.log("📸 Chargement image locale...");
        const image = await Jimp.read(imgPath);

        // 3. STEP A: CLEANING (The Surgical V2 Logic)
        console.log("🧹 Étape 1 : Nettoyage des doublons/fantômes...");
        holds.sort((a, b) => b.area - a.area);

        let validHolds = [];
        let removedCount = 0;

        for (let i = 0; i < holds.length; i++) {
            const current = holds[i];
            let isGhost = false;
            for (const kept of validHolds) {
                const keptBBox = getBBox(kept.contour);
                const coverage = getCoverageRatio(current.contour, kept.contour, keptBBox);
                const centroid = getCentroid(current.contour);
                // Coverage > 60% OR Centroid Inside -> It's a ghost
                if (coverage > 0.60 || isPointInPolygon(centroid, kept.contour)) {
                    isGhost = true;
                    break;
                }
            }
            if (!isGhost) validHolds.push(current);
            else removedCount++;
        }
        console.log(`   - Supprimés : ${removedCount} | Restants : ${validHolds.length}`);

        // 4. STEP B: COLOR SPLITTING
        console.log("🎨 Étape 2 : Séparation des prises collées (Multi-couleurs)...");
        validHolds = smartSplit(validHolds, image);

        console.log(`✅ RÉSULTAT FINAL : ${validHolds.length} prises.`);

        // 5. UPLOAD
        const { data: walls } = await supabase.from('walls').select('id').limit(1);
        if (walls && walls.length > 0) {
            const { error } = await supabase.from('walls').update({ detection_data: validHolds }).eq('id', walls[0].id);
            if (!error) console.log("💾 Base de données mise à jour !");
            else console.error("❌ Erreur DB:", error);
        }

    } catch (err) {
        console.error("❌ Erreur:", err);
    }
}

runAnalysis();
