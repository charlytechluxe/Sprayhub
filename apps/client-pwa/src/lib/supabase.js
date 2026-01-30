import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    console.warn("Supabase credentials missing or using placeholders. App will run in demo mode.")
}

export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'))
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

