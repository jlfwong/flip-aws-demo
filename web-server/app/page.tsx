import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase-server-client";
import { logout } from "./auth/actions";

export default async function Page() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("User is not logged in. Redirecting");
    redirect("/auth?redirect=/");
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <p>You are currently logged in.</p>
      <form action={logout}>
        <input type="submit" value="Logout" />
      </form>
    </div>
  );
}
