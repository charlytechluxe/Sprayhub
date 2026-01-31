import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
    'https://lvijsqxgrboolsxxlyir.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWpzcXhncmJvb2xzeHhseWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTQ2NjcsImV4cCI6MjA4NTM3MDY2N30.3d8MTy8otx28wri9L2qx0YB3KGg71lZcpE4HqcOqJLs'
);

async function fixRLSPolicies() {
    console.log("🔧 Fixing RLS Policies on Supabase Cloud...");

    const sqlMigration = fs.readFileSync(
        path.join(__dirname, '../supabase/migrations/20260131_fix_rls_policies.sql'),
        'utf8'
    );

    console.log("📜 SQL Migration loaded:");
    console.log(sqlMigration);
    console.log("\n⚠️  IMPORTANT: This SQL needs to be run manually in Supabase SQL Editor.");
    console.log("👉 Go to: https://supabase.com/dashboard/project/lvijsqxgrboolsxxlyir/sql/new");
    console.log("\n📋 Copy-paste the SQL above and click 'Run'.");
    console.log("\n✅ Once done, run: node scripts/create_demo_routes.js");
}

fixRLSPolicies().catch(console.error);
