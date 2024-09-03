import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import safeEnv from "./safe-env";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    safeEnv.NEXT_PUBLIC_SUPABASE_URL,
    safeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
