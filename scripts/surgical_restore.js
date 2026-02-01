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

// --- GEOMETRY HELPERS ---
const getPolygonArea = (coords) => {
    let area = 0;
    const n = coords.length;
    for (let i = 0; i < n; i++) {
        area += (coords[i][0] * coords[(i + 1) % n][1]) - (coords[(i + 1) % n][0] * coords[i][1]);
    }
    return Math.abs(area) / 2;
};

// Check if Point is in Polygon
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

// Check if inner is largely inside outer
const checkOverlap = (inner, outer) => {
    const bboxInner = getBBox(inner);
    const bboxOuter = getBBox(outer);

    // Fast fail: Bbox not potentially inside
    if (bboxInner.minX < bboxOuter.minX || bboxInner.maxX > bboxOuter.maxX ||
        bboxInner.minY < bboxOuter.minY || bboxInner.maxY > bboxOuter.maxY) {
        return false;
    }

    // Centroid check is usually enough for "complete containment" of ghost holds
    const centroid = getCentroid(inner);
    if (isPointInPolygon(centroid, outer)) return true;

    return false;
};


async function surgicalRestore() {
    console.log("👨‍⚕️ RESTAURATION CHIRURGICALE (Nettoyage des fantômes)...");

    try {
        // 1. Load the PRO Data
        const jsonPath = path.join(__dirname, '../apps/client-pwa/src/data/holds_final_force.json');
        console.log("Lecture du fichier haute définition...");
        let rawHolds = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        // Normalize
        let holds = rawHolds.map(h => ({
            ...h,
            contour: h.contour || h.geometry,
            area: getPolygonArea(h.contour || h.geometry)
        }));

        console.log(`📦 ${holds.length} prises chargées.`);

        // 2. FILTER DUPLICATES (Ghosts)
        // Sort by area descending so big holds come first
        holds.sort((a, b) => b.area - a.area);

        const keptHolds = [];
        let removedCount = 0;

        for (let i = 0; i < holds.length; i++) {
            const current = holds[i];
            let isGhost = false;

            // Check against all ALREADY KEPT holds (larger ones)
            for (const kept of keptHolds) {
                if (checkOverlap(current.contour, kept.contour)) {
                    isGhost = true;
                    // console.log(`👻 Prise fantôme supprimée (incluse dans ${kept.id})`);
                    break;
                }
            }

            if (!isGhost) {
                keptHolds.push(current);
            } else {
                removedCount++;
            }
        }

        console.log(`🧹 Nettoyage terminé :`);
        console.log(`   - Avant : ${holds.length}`);
        console.log(`   - Supprimés : ${removedCount}`);
        console.log(`   - Après : ${keptHolds.length}`);


        // 3. Update Supabase
        const { data: walls, error: wallError } = await supabase.from('walls').select('id').limit(1);
        if (wallError || !walls || walls.length === 0) { console.error("❌ Pas de mur !"); return; }

        const wallId = walls[0].id;

        const { error: updateError } = await supabase
            .from('walls')
            .update({ detection_data: keptHolds })
            .eq('id', wallId);

        if (updateError) console.error("❌ Erreur update:", updateError);
        else console.log("✅ SUCCÈS : Base de données mise à jour avec les prises PRO nettoyées.");

    } catch (err) {
        console.error("❌ Erreur:", err);
    }
}

surgicalRestore();
