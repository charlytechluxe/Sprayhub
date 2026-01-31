
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load env vars from client-pwa .env
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../apps/client-pwa/.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in apps/client-pwa/.env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function initWall() {
    console.log("Initializing Wall in Database...")

    // 1. Check if wall exists
    const { data: existingWalls } = await supabase.from('walls').select('*')

    if (existingWalls && existingWalls.length > 0) {
        console.log("Wall already exists:", existingWalls[0])
        // Update it just in case
        const { error } = await supabase
            .from('walls')
            .update({
                image_url: 'http://localhost:5173/wall_v1.jpg',
                name: 'Mur Principal (SprayHub)'
            })
            .eq('id', existingWalls[0].id)

        if (error) console.error("Error updating wall:", error)
        else console.log("Wall updated to use localhost:5173 image.")
    } else {
        // Create it
        console.log("Creating new wall...")
        const { error } = await supabase
            .from('walls')
            .insert({
                image_url: 'http://localhost:5173/wall_v1.jpg', // Localhost link for cross-app dev
            })

        if (error) console.error("Error creating wall:", error)
        else console.log("Wall created successfully!")
    }
}

initWall()
