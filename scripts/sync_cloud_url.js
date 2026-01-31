
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://lvijsqxgrboolsxxlyir.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWpzcXhncmJvb2xzeHhseWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTQ2NjcsImV4cCI6MjA4NTM3MDY2N30.3d8MTy8otx28wri9L2qx0YB3KGg71lZcpE4HqcOqJLs'
);

async function syncCloudUrl() {
    console.log("🔍 Recherche de la photo sur le Storage Supabase...");

    const { data: files, error: listError } = await supabase.storage.from('walls').list();

    if (listError || !files || files.length === 0) {
        console.log("❌ Aucune photo trouvée dans le Storage.");
        return;
    }

    // Sort by name (which contains timestamp)
    files.sort((a, b) => b.name.localeCompare(a.name));
    const latestFile = files[0].name;

    const { data: { publicUrl } } = supabase.storage.from('walls').getPublicUrl(latestFile);
    console.log(`✅ Photo trouvée : ${publicUrl}`);

    // Update Walls table
    const { data: currentWall } = await supabase.from('walls').select('id').limit(1).maybeSingle();

    if (currentWall) {
        console.log(`🔄 Mise à jour du mur ${currentWall.id} avec l'URL Cloud...`);
        await supabase.from('walls').update({ image_url: publicUrl }).eq('id', currentWall.id);
        console.log("🚀 TERMINÉ ! Le lien vers la photo Cloud est rétabli.");
    } else {
        console.log("❌ Aucun mur trouvé dans la table 'walls'.");
    }
}

syncCloudUrl().catch(console.error);
