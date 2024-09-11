import { NextResponse } from "next/server";
import {
  flipAdminApiClient,
  FlipSiteApiClient,
  FlipTelemetryPayload,
} from "../../../../lib/flip-api";
import { createSupabaseServiceRoleClient } from "../../../../lib/supabase-service-client";

interface TelemetryPayload {
  body: string;
  attributes: {
    SentTimestamp: string;
  };
}

interface TelemetryBody {
  mqtt_topic: string;
  telemetry: {
    last_mode: string;
    battery_last_power_charge_w: number;
    battery_last_power_discharge_w: number;
    battery_total_energy_charge_wh: number;
    battery_total_energy_discharge_wh: number;
    battery_last_stored_energy_wh: number;
    battery_last_capacity_energy_wh: number;
    battery_last_backup_reserve_percentage: number;
    last_is_grid_online: boolean;
    home_total_energy_wh: number;
    home_last_power_w: number;
    solar_total_energy_wh: number;
    solar_last_power_w: number;
  };
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const payload = (await request.json()) as TelemetryPayload;

    const body = JSON.parse(payload.body) as TelemetryBody;

    console.log("Received telemetry body:", JSON.stringify(body, null, 2));

    const awsThingNameMatch = body.mqtt_topic.match(
      /^devices\/([^/]+)\/telemetry$/
    );
    if (!awsThingNameMatch) {
      throw new Error(`Invalid mqtt_topic format: ${body.mqtt_topic}`);
    }
    const awsThingName = awsThingNameMatch[1];

    const { data, error } = await createSupabaseServiceRoleClient()
      .from("devices")
      .select("flip_device_id")
      .eq("aws_thing_name", awsThingName)
      .maybeSingle();

    if (error) {
      throw new Error(`Error fetching device from database: ${error.details}`);
    }

    if (!data) {
      console.log(`Device ${awsThingName} is not registered. Ignoring.`);

      // Device not registered, return early with a 200
      return NextResponse.json(
        { message: "Telemetry received for unregistered device" },
        { status: 200 }
      );
    }

    const flipDeviceId = data.flip_device_id;

    const telemetry: FlipTelemetryPayload = {
      start_time: new Date(
        parseInt(payload.attributes.SentTimestamp, 10)
      ).toISOString(),

      // TODO(jlfwong): Unsure what this field is supposed to mean
      duration_s: 1,

      telemetry: [
        {
          device_id: flipDeviceId,
          last_is_online: true,
          ...body.telemetry,
        },
      ],
    };

    await flipAdminApiClient.logBatteryTelemetry(telemetry);

    // Return a 200 response
    return NextResponse.json(
      { message: "Telemetry processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    // Log any errors
    console.error("Error processing telemetry:", error);

    return NextResponse.json(
      { message: "Telemetry received" },
      { status: 500 }
    );
  }
}
