import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let finalUrl = supabaseUrl;
if (!finalUrl || !finalUrl.startsWith('http')) {
  console.warn("Invalid or missing VITE_SUPABASE_URL environment variable. Using placeholder Supabase URL.");
  finalUrl = 'https://placeholder.supabase.co';
}

export const supabase = createClient(finalUrl, supabaseAnonKey || 'placeholder');

export const supabaseConfigured = finalUrl !== 'https://placeholder.supabase.co' && !!supabaseAnonKey && supabaseAnonKey !== 'placeholder';

if (!supabaseConfigured) {
  console.error(`\n[SUPABASE CONFIGURATION]\nSupabase scheint nicht konfiguriert zu sein. Bitte erstelle eine Datei ".env.local" im Projekt-Root mit zwei Variablen:\n  VITE_SUPABASE_URL=https://your-project.supabase.co\n  VITE_SUPABASE_ANON_KEY=your-anon-key\n\nFühre danach \`npm run dev\` neu aus. Ohne diese Variablen funktionieren Datenbank-Operationen nicht.\n`);
}

