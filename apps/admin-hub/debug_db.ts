
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lvijsqxgrboolsxxlyir.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWpzcXhncmJvb2xzeHhseWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTQ2NjcsImV4cCI6MjA4NTM3MDY2N30.3d8MTy8otx28wri9L2qx0YB3KGg71lZcpE4HqcOqJLs'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkConfigData() {
    console.log("Checking gym_config...");
    const { data, error } = await supabase
        .from('gym_config')
        .select('*')
        .eq('key', 'grade_colors');

    if (error) {
        console.error("Error fetching config:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No config found for 'grade_colors'.");
    } else {
        console.log("Config found:", JSON.stringify(data[0].value, null, 2));
    }
}

checkConfigData();
