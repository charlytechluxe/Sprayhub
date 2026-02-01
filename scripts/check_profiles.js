import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }
    console.log("Found Profiles:", data.length);
    data.forEach(p => console.log(`- ${p.email} (${p.full_name || 'No Name'}) [role: ${p.role}]`));

    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    // Note: This needs service_role key to work, which might not be in .env
    if (authError) {
        console.log("Auth listing failed (expected if no service key):", authError.message);
    } else {
        console.log("Auth Users:", users.users.length);
    }
}

checkProfiles();
