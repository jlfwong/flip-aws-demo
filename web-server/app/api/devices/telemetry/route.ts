import { NextResponse } from "next/server";
import {
  flipAdminApiClient,
  FlipTelemetryPayload,
} from "../../../../lib/flip-api";
import { createSupabaseServiceRoleClient } from "../../../../lib/supabase-service-client";

import {
  IoTDataPlaneClient,
  PublishCommand,
} from "@aws-sdk/client-iot-data-plane";
import { SupabaseClient } from "@supabase/supabase-js";

// Create IoT Data Plane client
const iotClient = new IoTDataPlaneClient({
  region: process.env.AWS_REGION,
});

async function ackCommands(
  body: TelemetryBody,
  supabase: SupabaseClient,
  flipDeviceId: string
) {
  if (body.last_command_acked == null) {
    // Nothing to do
    return;
  }

  // Find commands that need updating
  const { data: commandsToUpdate, error: selectError } = await supabase
    .from("flip_commands")
    .select("id")
    .eq("flip_device_id", flipDeviceId)
    .lte("created_at", body.last_command_acked)
    .is("device_acked_at", null);

  if (selectError) {
    console.error("Error selecting commands to update:", selectError);
    throw new Error(
      `Error selecting commands to update: ${selectError.message}`
    );
  }

  if (commandsToUpdate.length === 0) {
    return;
  }

  // Update the commands in Flip
  await Promise.all(
    commandsToUpdate.map((c) =>
      flipAdminApiClient.updateCommandStatus(c.id, "OK")
    )
  );

  // Finally, mark the commands as ACK'd in the database
  const { data: updatedCommands, error: updateError } = await supabase
    .from("flip_commands")
    .update({ device_acked_at: new Date().toISOString() })
    .in(
      "id",
      commandsToUpdate.map((c) => c.id)
    )
    .select("id");

  if (updateError) {
    console.error("Error updating acked commands:", updateError);
  } else {
    console.log(
      `Updated acked commands for device ${flipDeviceId} up to ${body.last_command_acked}`
    );
  }
}

async function publishUnackedCommands(
  supabase: SupabaseClient,
  flipDeviceId: string,
  awsThingName: string
) {
  // Fetch unacked commands for the device
  const { data: commands, error: fetchError } = await supabase
    .from("flip_commands")
    .select("*")
    .eq("flip_device_id", flipDeviceId)
    .is("device_acked_at", null)
    .order("created_at", { ascending: true });

  if (fetchError) {
    console.error("Error fetching unacked commands:", fetchError);
    throw new Error(`Error fetching unacked commands: ${fetchError.message}`);
  }

  if (commands.length == 0) {
    return;
  }

  console.log(
    `Found ${commands.length} unacked commands for device ${flipDeviceId}`
  );

  // Publish unacked commands to MQTT
  const publishCommand = new PublishCommand({
    topic: `devices/${awsThingName}/commands`,
    payload: JSON.stringify({
      commands,
    }),
    qos: 1,
  });
  try {
    await iotClient.send(publishCommand);
    console.log(`Published command to ${publishCommand.input.topic}`);
  } catch (error) {
    console.error(`Error publishing command to IoT Core:`, error);
  }
}

interface TelemetryPayload {
  body: string;
  attributes: {
    SentTimestamp: string;
  };
}

interface TelemetryBody {
  mqtt_topic: string;
  last_command_acked: string;
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

    const supabase = createSupabaseServiceRoleClient();

    const { data, error } = await supabase
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
    await ackCommands(body, supabase, flipDeviceId);
    await publishUnackedCommands(supabase, flipDeviceId, awsThingName);

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
