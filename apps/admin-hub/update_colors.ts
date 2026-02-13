
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newColors = [
    { id: '1', name: 'Orange', hex: '#f97316', display_order: 1, is_active: true },
    { id: '2', name: 'Rose', hex: '#ec4899', display_order: 2, is_active: true },
    { id: '3', name: 'Vert', hex: '#22c55e', display_order: 3, is_active: true },
    { id: '4', name: 'Jaune', hex: '#eab308', display_order: 4, is_active: true },
    { id: '5', name: 'Bleu', hex: '#3b82f6', display_order: 5, is_active: true },
    { id: '6', name: 'Rouge', hex: '#ef4444', display_order: 6, is_active: true },
    { id: '7', name: 'Blanc', hex: '#ffffff', display_order: 7, is_active: true },
    { id: '8', name: 'Projet', hex: '#52525b', display_order: 8, is_active: true },
];

async function updateColors() {
    console.log("Updating grade colors in gym_config...");

    // Check if row exists
    const { data: existing } = await supabase
        .from('gym_config')
        .select('*')
        .eq('key', 'grade_colors')
        .single();

    let error;
    if (existing) {
        const { error: err } = await supabase
            .from('gym_config')
            .update({ value: newColors, updated_at: new Date() })
            .eq('key', 'grade_colors');
        error = err;
    } else {
        const { error: err } = await supabase
            .from('gym_config')
            .insert({ key: 'grade_colors', value: newColors });
        error = err;
    }

    if (error) {
        console.error("Error updating colors:", error);
    } else {
        console.log("✅ Successfully updated grade colors!");
    }
}

updateColors();
