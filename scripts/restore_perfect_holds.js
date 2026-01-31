
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
    'https://lvijsqxgrboolsxxlyir.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWpzcXhncmJvb2xzeHhseWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTQ2NjcsImV4cCI6MjA4NTM3MDY2N30.3d8MTy8otx28wri9L2qx0YB3KGg71lZcpE4HqcOqJLs'
);

async function restoreData() {
    console.log("♻️ Restauration des données 'qui marchaient superbien'...");

    // 1. Charger le JSON
    const dataPath = '/Users/charlypolley/.gemini/antigravity/scratch/sprayhub/apps/client-pwa/src/data/holds_final_force.json';
    const holdsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`📦 ${holdsData.length} prises trouvées dans le fichier local.`);

    // 2. S'assurer qu'un mur existe
    let wallId;
    const { data: wall } = await supabase.from('walls').select('id').limit(1).maybeSingle();

    if (!wall) {
        console.log("📸 Création du mur par défaut (Schema User)...");
        const { data: newWall, error: wallError } = await supabase
            .from('walls')
            .insert({
                image_url: '/wall_v1.jpg',
                is_active: true,
                version: 'v1'
            })
            .select()
            .single();
        if (wallError) {
            console.error("❌ Erreur création mur:", wallError);
            return;
        }
        wallId = newWall.id;
    } else {
        wallId = wall.id;
    }

    // 3. Nettoyer les prises existantes
    console.log(`🧹 Nettoyage de la base pour le mur ${wallId}...`);
    await supabase.from('holds').delete().eq('wall_id', wallId);

    // 4. Importer par morceaux (chunks)
    console.log("🚀 Importation des prises vers Supabase Cloud...");
    const chunkSize = 50;
    for (let i = 0; i < holdsData.length; i += chunkSize) {
        const chunk = holdsData.slice(i, i + chunkSize).map(h => ({
            wall_id: wallId,
            contour: h.contour,
            area_px: h.area_px,
            x: h.contour[0][0],
            y: h.contour[0][1]
        }));

        const { error } = await supabase.from('holds').insert(chunk);
        if (error) {
            console.error(`❌ Erreur au chunk ${i}:`, error.message);
        } else {
            process.stdout.write(`.`);
        }
    }

    console.log("\n✅ TERMINÉ ! Ton scan 'qui marchait superbien' est de retour sur le Cloud.");
}

restoreData().catch(console.error);
