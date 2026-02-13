import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.')
}

// Untyped client – Typisierung erfolgt über useSupabaseQuery<T> / useSupabaseSingle<T> Generics.
// Die Database-Typen in src/types/database.ts dienen als Interface-Referenz für die Hooks.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
