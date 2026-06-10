import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Chybí VITE_SUPABASE_URL nebo VITE_SUPABASE_ANON_KEY — zkontroluj soubor .env',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
