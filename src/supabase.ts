import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config(); // Load .env before creating client

// Supabase client for server‑side operations (uses the service‑role key).
export const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
