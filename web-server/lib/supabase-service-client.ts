import safeEnv from "./safe-env";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";

export function createSupabaseServiceRoleClient() {
  return createClient<Database>(
    safeEnv.NEXT_PUBLIC_SUPABASE_URL,
    safeEnv.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
