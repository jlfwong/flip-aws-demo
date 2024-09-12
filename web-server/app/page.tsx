import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase-server-client";
import { logout } from "./auth/actions";
import Link from "next/link";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("User is not logged in. Redirecting");
    redirect("/auth?redirect=/");
  }

  // Fetch devices for the current user
  const { data: devices, error } = await supabase
    .from("devices")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching devices:", error);
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <p>You are currently logged in.</p>
      <h2>Your Devices:</h2>
      {devices && devices.length > 0 ? (
        <ul>
          {devices.map((device) => (
            <li key={device.aws_thing_name}>
              <Link href={`/devices/${device.aws_thing_name}`}>
                {device.aws_thing_name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No devices registered.</p>
      )}
      <form action={logout}>
        <input type="submit" value="Logout" />
      </form>
    </div>
  );
}
