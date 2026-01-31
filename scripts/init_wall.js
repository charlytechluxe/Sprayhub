import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from client-pwa
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/client-pwa/.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function initWall() {
    console.log("🏗️  Initialisation du mur dans Supabase...");

    try {
        // Check if wall already exists
        const { data: existingWalls } = await supabase
            .from('walls')
            .select('id, name')
            .limit(1);

        if (existingWalls && existingWalls.length > 0) {
            console.log(`✅ Mur déjà existant: ${existingWalls[0].name} (${existingWalls[0].id})`);
            return;
        }

        // Create new wall
        const { data, error } = await supabase
            .from('walls')
            .insert({
                name: 'Art de la Grimpe - Mur Principal',
                image_url: 'https://sprayhub.vercel.app/wall_v1.jpg',
                version: 'v1',
                is_active: true,
                detection_data: []
            })
            .select()
            .single();

        if (error) {
            console.error("❌ Erreur lors de la création du mur:", error);
            return;
        }

        console.log("✅ Mur créé avec succès !");
        console.log(`   ID: ${data.id}`);
        console.log(`   Nom: ${data.name}`);
        console.log(`   Image: ${data.image_url}`);

    } catch (err) {
        console.error("❌ Erreur:", err);
    }
}

initWall();
