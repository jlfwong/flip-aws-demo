"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase-server-client";

export async function login(formData: FormData) {
  const supabase = createSupabaseServerClient();

  const email = formData.get("email") as string;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.log(error);
    redirect("/auth/error");
  }

  // Redirect to a page informing the user to check their email
  redirect("/auth/check-email");
}

export async function logout() {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.log(error);
    redirect("/auth/error");
  }

  // Redirect to the home page after successful logout
  redirect("/");
}
