import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
    'https://lvijsqxgrboolsxxlyir.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWpzcXhncmJvb2xzeHhseWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTQ2NjcsImV4cCI6MjA4NTM3MDY2N30.3d8MTy8otx28wri9L2qx0YB3KGg71lZcpE4HqcOqJLs'
);

async function createDemoRoutes() {
    console.log("🎯 Création de routes de démo pour SprayHub...");

    // 1. Get wall ID
    const { data: wall } = await supabase.from('walls').select('id').limit(1).maybeSingle();

    if (!wall) {
        console.error("❌ Aucun mur trouvé. Exécute d'abord restore_perfect_holds.js");
        return;
    }

    const wallId = wall.id;
    console.log(`✅ Mur trouvé: ${wallId}`);

    // 2. Get some holds to use in routes
    const { data: holds } = await supabase
        .from('holds')
        .select('id, contour, x, y')
        .eq('wall_id', wallId)
        .limit(50);

    if (!holds || holds.length === 0) {
        console.error("❌ Aucune prise trouvée.");
        return;
    }

    console.log(`📦 ${holds.length} prises disponibles pour créer des routes.`);

    // 3. Create demo routes with random holds
    const demoRoutes = [
        {
            name: "Dyno de la Mort",
            grade: "7A+",
            description: "Un dyno explosif pour les courageux",
            holdCount: 8
        },
        {
            name: "Le Mur Jaune",
            grade: "6B",
            description: "Technique et endurance",
            holdCount: 12
        },
        {
            name: "Traversée Infernale",
            grade: "6C+",
            description: "Longue traversée technique",
            holdCount: 15
        },
        {
            name: "Réglette Royale",
            grade: "7B",
            description: "Que des réglettes, bon courage",
            holdCount: 6
        },
        {
            name: "Débutant Friendly",
            grade: "5A",
            description: "Parfait pour commencer",
            holdCount: 10
        }
    ];

    for (const route of demoRoutes) {
        // Select random holds
        const selectedHolds = [];
        const usedIndices = new Set();

        while (selectedHolds.length < Math.min(route.holdCount, holds.length)) {
            const randomIndex = Math.floor(Math.random() * holds.length);
            if (!usedIndices.has(randomIndex)) {
                usedIndices.add(randomIndex);
                const hold = holds[randomIndex];
                selectedHolds.push({
                    id: hold.id,
                    type: selectedHolds.length === 0 ? 'start' :
                        selectedHolds.length === route.holdCount - 1 ? 'top' : 'handfoot',
                    contour: hold.contour,
                    note: ''
                });
            }
        }

        const { error } = await supabase.from('routes').insert({
            name: route.name,
            grade: route.grade,
            description: route.description,
            holds: selectedHolds,
            wall_id: wallId
        });

        if (error) {
            console.error(`❌ Erreur création route "${route.name}":`, error.message);
        } else {
            console.log(`✅ Route créée: ${route.name} (${route.grade})`);
        }
    }

    console.log("\n🎉 TERMINÉ ! Routes de démo créées sur le Cloud.");
}

createDemoRoutes().catch(console.error);
