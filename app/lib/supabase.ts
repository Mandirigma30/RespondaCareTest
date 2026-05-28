import { createClient } from '@supabase/supabase-js';

// Enforce safe fallbacks so the app is stable and never crashes in dev/offline environments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIn0.signature';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isPlaceholderUrl = supabaseUrl.includes('placeholder-project-url');
