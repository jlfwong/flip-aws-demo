import { NextResponse } from "next/server";
import {
  flipAdminApiClient,
  FlipSiteApiClient,
  FlipTelemetryPayload,
} from "../../../../lib/flip-api";

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

    const deviceIdMatch = body.mqtt_topic.match(
      /^devices\/([^/]+)\/telemetry$/
    );
    if (!deviceIdMatch) {
      throw new Error(`Invalid mqtt_topic format: ${body.mqtt_topic}`);
    }
    const deviceId = FlipSiteApiClient.deviceIdForThingName(deviceIdMatch[1]);

    const telemetry: FlipTelemetryPayload = {
      start_time: new Date(
        parseInt(payload.attributes.SentTimestamp, 10)
      ).toISOString(),

      // TODO(jlfwong): Unsure what this field is supposed to mean
      duration_s: 1,

      telemetry: [
        {
          device_id: deviceId,
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
