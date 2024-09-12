import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "../../../lib/supabase-service-client";

type EnrollmentWebhook = {
  event_type: "enrollment.created" | "enrollment.updated";
  event_object: {
    id: string;
    device_ids: string[];
    site_id: string;
    program_id: string;
    enrollment_method: string;
    status: "ACTIVE" | "NEEDS_ACTION" | "PENDING" | "REJECTED" | "UNENROLLED";
    status_reason: string | null;
    enrolled_at: string | null;
    unenrolled_at: string | null;
    program_specific_attributes: Record<string, any>[];
    has_agreed_to_terms_and_conditions: boolean | null;
    terms_and_conditions_version: string | null;
  };
};

type CommandWebhook = {
  event_type:
    | "command.created"
    | "command.updated"
    | "command.started"
    | "command.ended";
  event_object: {
    id: string;
    device_id: string;
    status: "CANCELED" | "OK" | "OPT_OUT";
    start_at: string;
    ends_at: string;
    duration_s: number | null;
    is_preparatory_action: boolean;
    battery_commands: {
      status: string;
      device_status: "FAILED" | "OK" | "PENDING";
    }[];
    created_at: string;
    updated_at: string;
  };
};

type EventWebhook = {
  event_type: "event.created" | "event.canceled";
  event_object: {
    id: string;
    program_id: string;
    site_id: string;
    starts_at: string;
    ends_at: string | null;
    duration_s: number;
    schedule: Array<{
      id: string;
      program_id: string;
      site_id: string;
      starts_at: string;
      ends_at: string | null;
      duration_s: number;
    }>;
    device_settings: Array<{
      status: "ACTIVE" | "CANCELED" | "COMPLETED" | "UPCOMING";
      is_participating: boolean;
      created_at: string;
      updated_at: string;
    }>;
  };
};

type WebhookPayload = EnrollmentWebhook | CommandWebhook | EventWebhook;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as WebhookPayload;
    console.log(
      "Received Flip webhook payload:",
      JSON.stringify(payload, null, 2)
    );

    switch (payload.event_type) {
      case "command.created":
      case "command.updated":
      case "command.ended":
      case "command.started": {
        const supabase = createSupabaseServiceRoleClient();

        // If there's an existing command with this ID, this will overwrite the payload
        // and clear the "device_acked_at" column
        const { data, error } = await supabase.from("flip_commands").upsert(
          {
            id: payload.event_object.id,
            flip_device_id: payload.event_object.device_id,
            event_payload: payload,
            created_at: new Date().toISOString(),
            device_acked_at: null,
          },
          { onConflict: "id" }
        );

        if (error) {
          console.error("Error inserting command into Supabase:", error);
          throw error;
        }

        console.log("Command inserted successfully:", data);
        break;
      }

      default: {
        console.log(`Ignoring event type: ${payload.event_type}`);
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error processing Flip webhook:", error);
    return new NextResponse("Error processing webhook", { status: 500 });
  }
}
