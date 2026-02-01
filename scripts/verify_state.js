import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/client-pwa/.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDB() {
    console.log("🕵️ Checking DB State...");

    // Check Wall Data
    const { data: walls, error } = await supabase.from('walls').select('id, detection_data');
    if (error) { console.error("Error:", error); return; }

    if (walls.length === 0) { console.log("No walls."); return; }

    const wall = walls[0];
    const holds = wall.detection_data || [];

    console.log(`✅ Wall ID: ${wall.id}`);
    console.log(`📊 Hold Count: ${holds.length}`);

    if (holds.length > 0) {
        // Check for duplicates/ghosts in current data
        console.log("First 3 hold IDs:", holds.slice(0, 3).map(h => h.id));
    }

    // Try a dummy update to see if RLS blocks it
    /*
    const { error: updateError } = await supabase.from('walls').update({ version: 'v1' }).eq('id', wall.id);
    if (updateError) console.error("⚠️ RLS UPDATE CHECK FAILED:", updateError);
    else console.log("✅ RLS Update Check Passed.");
    */
}

checkDB();
