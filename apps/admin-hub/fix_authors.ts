import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixAuthorNames() {
    console.log("🔍 Fetching all routes and profiles...");

    // 1. Fetch ALL routes
    const { data: routes, error: routeError } = await supabase
        .from('routes')
        .select(`id, name, author_id, author_username`);

    if (routeError) {
        console.error("Error fetching routes:", routeError);
        return;
    }

    // 2. Fetch ALL profiles (mapping id -> username)
    // Adjust if 'profiles' table name differs (e.g., 'users' view)
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username');

    if (profileError) {
        console.error("Error fetching profiles:", profileError);
        return;
    }

    // Create a map for fast lookup
    const profileMap = new Map();
    profiles.forEach(p => profileMap.set(p.id, p.username));

    console.log(`Routes: ${routes.length}, Profiles: ${profiles.length}`);
    console.log("Starting reconciliation...");

    let updates = 0;

    for (const route of routes) {
        const currentName = route.author_username;
        const correctUsername = profileMap.get(route.author_id);

        // Check if username is missing or "Inconnu" AND we have the correct username
        if ((!currentName || currentName === 'Inconnu') && correctUsername) {
            console.log(`🛠️ Fixing Route "${route.name}" (${route.id}): '${currentName}' -> '${correctUsername}'`);

            const { error: updateError } = await supabase
                .from('routes')
                .update({ author_username: correctUsername })
                .eq('id', route.id);

            if (updateError) {
                console.error(`❌ Failed to update route ${route.id}:`, updateError);
            } else {
                updates++;
            }
        }
    }

    console.log(`✅ Finished. Updated ${updates} routes.`);
}

fixAuthorNames();
