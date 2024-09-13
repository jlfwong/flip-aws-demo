import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "./lib/supabase-middleware";
import safeEnv from "./lib/safe-env";

function validateApiKey(request: NextRequest) {
  const authHeader =
    request.headers.get("Authorization") ??
    // This header is non-standard, but is current what Flip uses
    request.headers.get("Authentication");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  if (token !== safeEnv.WEB_SERVER_SHARED_SECRET) {
    console.log(`Received invalid auth token: ${token}`);
    return new Response("Forbidden", { status: 403 });
  }

  // If the token is valid, allow the request to proceed
  return NextResponse.next({ request });
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return validateApiKey(request);
  } else {
    return await updateSupabaseSession(request);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
