import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail gracefully instead of crashing the whole app.
// This allows Guest Mode to function even if Supabase is misconfigured.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing. Cloud sync will be disabled.");
}

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : (null as any);
// We use casting because the app logic handles null user/auth anyway.
// Note: Most supabase methods will fail if called on null, but our UseCases
// check for 'user' first.
