import { createClient } from '@supabase/supabase-js';

// Grab the environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Throw an error if they are missing so it doesn't fail silently
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables in .env.local');
}

// Export the connected client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);