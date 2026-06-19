import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let finalUrl = supabaseUrl;
if (!finalUrl || !finalUrl.startsWith('http')) {
  console.warn("Invalid Supabase URL. Using placeholder.");
  finalUrl = 'https://placeholder.supabase.co';
}

export const supabase = createClient(finalUrl, supabaseAnonKey || 'placeholder');
