
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
    'https://lvijsqxgrboolsxxlyir.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWpzcXhncmJvb2xzeHhseWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTQ2NjcsImV4cCI6MjA4NTM3MDY2N30.3d8MTy8otx28wri9L2qx0YB3KGg71lZcpE4HqcOqJLs'
);

async function forceCloudAutoFix() {
    console.log("🛠 INITIALISATION AUTOMATIQUE DU CLOUD...");

    // 1. S'assurer que le bucket existe
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'walls')) {
        console.log("📁 Création du bucket 'walls'...");
        await supabase.storage.createBucket('walls', { public: true });
    }

    // 2. Upload la photo locale vers le cloud
    console.log("☁️ Envoi de la photo vers le Cloud...");
    const filePath = '/Users/charlypolley/.gemini/antigravity/scratch/sprayhub/apps/client-pwa/public/wall_v1.jpg';
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = `wall_master.jpg`;

    const { error: uploadError } = await supabase.storage
        .from('walls')
        .upload(fileName, fileBuffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) {
        console.error("❌ Erreur upload:", uploadError.message);
        return;
    }

    const { data: { publicUrl } } = supabase.storage.from('walls').getPublicUrl(fileName);
    console.log(`✅ Photo hébergée : ${publicUrl}`);

    // 3. Mettre à jour la base de données
    const { data: wall } = await supabase.from('walls').select('id').limit(1).maybeSingle();
    if (wall) {
        await supabase.from('walls').update({ image_url: publicUrl }).eq('id', wall.id);
        console.log("🔗 Lien DB mis à jour.");
    }

    console.log("\n🚀 C'EST PRÊT ! Le scan multi-pass peut maintenant être lancé sans changer de photo.");
}

forceCloudAutoFix().catch(console.error);
