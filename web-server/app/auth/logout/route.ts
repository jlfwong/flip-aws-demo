import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase-server-client";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();

  // Sign out the user
  await supabase.auth.signOut();

  // Redirect to the home page after logout
  return NextResponse.redirect(new URL("/", request.url));
}
