import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://lvijsqxgrboolsxxlyir.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWpzcXhncmJvb2xzeHhseWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTQ2NjcsImV4cCI6MjA4NTM3MDY2N30.3d8MTy8otx28wri9L2qx0YB3KGg71lZcpE4HqcOqJLs');

async function checkRoutes() {
    const { data, error } = await supabase.from('routes').select('count');
    if (error) {
        console.error("Error fetching routes:", error);
    } else {
        console.log("Routes count:", data);
    }
}

checkRoutes();
