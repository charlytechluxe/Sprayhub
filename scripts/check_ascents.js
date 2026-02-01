const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from client-pwa
dotenv.config({ path: path.join(__dirname, '../apps/client-pwa/.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAscentsWithRoutes() {
    console.log('🔍 Vérification des ascensions avec détails des routes...\n');

    const { data: ascents, error } = await supabase
        .from('ascents')
        .select(`
            *,
            route:routes(id, name, grade, author_id)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Détails:', error);
        return;
    }

    console.log(`✅ Trouvé ${ascents.length} ascensions:\n`);
    ascents.forEach((ascent, i) => {
        console.log(`${i + 1}. Ascent ID: ${ascent.id}`);
        console.log(`   Route: ${ascent.route?.name || 'ROUTE NON TROUVÉE'}`);
        console.log(`   Grade Route: ${ascent.route?.grade || 'N/A'}`);
        console.log(`   Grade Suggéré: ${ascent.suggested_grade}`);
        console.log(`   Date: ${new Date(ascent.created_at).toLocaleString()}\n`);
    });
}

checkAscentsWithRoutes();
