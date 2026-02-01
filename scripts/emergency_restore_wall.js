
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Inject environment variables
dotenv.config({ path: './apps/client-pwa/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erreur: Clés Supabase manquantes dans .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function emergencyRestore() {
    console.log("🚑 Début de la restauration d'urgence...");

    // 1. Charger les données (Source: holds_final_force.json qui fait 3.3MB)
    const jsonPath = '/Users/charlypolley/.gemini/antigravity/scratch/sprayhub/apps/client-pwa/src/data/holds_final_force.json';
    if (!fs.existsSync(jsonPath)) {
        console.error("❌ Fichier de backup introuvable !");
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`📦 ${rawData.length} prises chargées.`);

    // 2. Trouver le mur actif
    const { data: wall, error: wallError } = await supabase
        .from('walls')
        .select('id, name')
        .eq('is_active', true)
        .maybeSingle();

    if (wallError || !wall) {
        console.log("⚠️ Aucun mur actif trouvé, recherche du premier mur disponible...");
        const { data: firstWall } = await supabase.from('walls').select('id, name').limit(1).single();
        if (!firstWall) {
            console.error("❌ Aucun mur n'existe en base !");
            return;
        }
        var targetWall = firstWall;
    } else {
        var targetWall = wall;
    }

    console.log(`🎯 Cible: Mur "${targetWall.name}" (ID: ${targetWall.id})`);

    // 3. Mise à jour de detection_data
    console.log("⏳ Envoi des données vers Supabase (Soyez patient, 3.3MB)...");

    // On reformate si besoin (s'assurer que contour est présent)
    const processedHolds = rawData.map(h => ({
        id: h.id || `h_${Math.random().toString(36).substr(2, 9)}`,
        contour: h.contour || h.geometry,
        type: h.type || 'handfoot'
    }));

    const { error: updateError } = await supabase
        .from('walls')
        .update({ detection_data: processedHolds })
        .eq('id', targetWall.id);

    if (updateError) {
        console.error("❌ Erreur lors de la mise à jour:", updateError.message);
    } else {
        console.log("✅ RESTAURATION RÉUSSIE ! Les prises sont de retour.");
    }
}

emergencyRestore().catch(console.error);
