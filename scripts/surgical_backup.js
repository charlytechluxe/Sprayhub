
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

async function surgicalBackup() {
    console.log("💾 Lancement de la sauvegarde chirurgicale...");

    // 1. Trouver le mur actif
    const { data: wall, error: wallError } = await supabase
        .from('walls')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

    if (wallError || !wall) {
        console.error("❌ Aucun mur actif trouvé pour la sauvegarde.");
        return;
    }

    const holds = wall.detection_data || [];
    console.log(`📊 Mur trouvé: "${wall.name}" avec ${holds.length} prises.`);

    // 2. Préparer le dossier de backup
    const backupDir = './apps/client-pwa/src/data/backups';
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // 3. Créer le nom de fichier timestampé
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `holds_backup_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    // 4. Écrire le fichier
    fs.writeFileSync(filepath, JSON.stringify(holds, null, 2));

    // 5. Mettre à jour le fichier "latest" pour référence facile
    const latestPath = path.join(backupDir, 'holds_latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(holds, null, 2));

    console.log(`✅ Sauvegarde réussie dans: ${filepath}`);
    console.log(`🔗 Également copié dans: ${latestPath}`);
}

surgicalBackup().catch(console.error);
