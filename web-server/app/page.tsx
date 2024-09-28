import { Metadata } from "next";
import { redirect } from "next/navigation";
import { logout } from "./auth/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase-server-client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { List, ListItem } from "@/components/ui/list";

export const metadata: Metadata = {
  title: "Home | Device Management",
};

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
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div>
        <Typography variant="h1">Welcome, {user.email}</Typography>
        <Typography variant="muted">You are currently logged in.</Typography>
      </div>
      <div className="space-y-4">
        <Typography variant="h2">Your Devices:</Typography>
        {devices && devices.length > 0 ? (
          <List>
            {devices.map((device) => (
              <ListItem key={device.aws_thing_name}>
                <Link
                  href={`/devices/${device.aws_thing_name}`}
                  className="text-blue-600 hover:underline"
                >
                  {device.aws_thing_name}
                </Link>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="muted">No devices registered.</Typography>
        )}
      </div>
      <div>
        <form action={logout}>
          <Button type="submit" variant="destructive">
            Logout
          </Button>
        </form>
      </div>
    </div>
  );
}
