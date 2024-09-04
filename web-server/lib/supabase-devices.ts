import { SupabaseClient } from "@supabase/supabase-js";
import { Tables } from "./supabase-types";

export namespace SupabaseDevices {
  export async function byAWSThingName(
    supabase: SupabaseClient,
    awsThingName: string
  ): Promise<Tables<"devices"> | null> {
    const { data, error } = await supabase
      .from("devices")
      .select<"*", Tables<"devices">>("*")
      .eq("aws_thing_name", awsThingName)
      .maybeSingle();

    if (error) {
      console.error("Error fetching device:", error);
      throw error;
    }

    return data;
  }

  export async function forUser(
    supabase: SupabaseClient,
    userId: string
  ): Promise<Tables<"devices">[]> {
    const { data, error } = await supabase
      .from("devices")
      .select<"*", Tables<"devices">>("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching devices for user:", error);
      throw error;
    }

    return data || [];
  }
}
