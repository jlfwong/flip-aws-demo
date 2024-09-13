import { AWSIoTClient } from "../lib/AWSIoTClient";

type BatteryCommand = {
  status: string;
  device_status: "FAILED" | "OK" | "PENDING";
  mode:
    | "BACKUP"
    | "CHARGE"
    | "DISCHARGE"
    | "SAVINGS"
    | "SELF_CONSUMPTION"
    | "STANDBY";
  power_mode: "FOLLOW_LOAD" | "SETPOINT" | null;
  setpoint_w: number | null;
  enable_grid_import: boolean | null;
  enable_grid_export: boolean | null;
  backup_reserve_percentage: number | null;
  maximum_charge_percentage: number | null;
};

type FlipCommand = {
  id: string;
  device_id: string;
  status: "CANCELED" | "OK" | "OPT_OUT";
  start_at: string;
  ends_at: string;
  duration_s: number | null;
  is_preparatory_action: boolean;
  battery_commands: BatteryCommand[];
  created_at: string;
  updated_at: string;
};

type CommandsMessage = {
  commands: {
    created_at: string;
    command_json: FlipCommand;
  }[];
};

import * as fs from "fs";
import * as path from "path";

let latestCommandAcked: string | null = null;
let artifactsPath: string;

function loadLatestCommandAcked() {
  const filePath = path.join(artifactsPath, "latestCommandAcked.txt");
  if (fs.existsSync(filePath)) {
    latestCommandAcked = fs.readFileSync(filePath, "utf-8").trim() || null;
  }
}

function saveLatestCommandAcked() {
  const filePath = path.join(artifactsPath, "latestCommandAcked.txt");
  fs.writeFileSync(filePath, latestCommandAcked || "");
}

function processCommand(created_at: string, command_json: FlipCommand) {
  // Ignore this command if we've already acked it
  if (
    latestCommandAcked != null &&
    new Date(latestCommandAcked) >= new Date(created_at)
  ) {
    console.log(`Ignoring already acked command: ${command_json.id}`);
    return;
  }

  // TODO(jlfwong): pretend to actuate the battery based on the command
  console.log("Processing command", command_json);

  if (
    latestCommandAcked == null ||
    new Date(latestCommandAcked) < new Date(created_at)
  ) {
    saveLatestCommandAcked();
    latestCommandAcked = created_at;
  }
}

function initializeDevice(deviceArtifactsPath: string) {
  artifactsPath = deviceArtifactsPath;
  loadLatestCommandAcked();
}

async function main() {
  if (process.argv.length !== 3) {
    console.error("Usage: ts-node client.ts <path_to_device_artifacts>");
    process.exit(1);
  }

  const artifactsPath = process.argv[2];
  const client = new AWSIoTClient(artifactsPath);
  initializeDevice(artifactsPath);

  await client.connect();

  // Subscribe to the commands channel
  const commandsTopic = `devices/${client.deviceInfo.thingName}/commands`;
  await client.subscribe(commandsTopic, (topic, message) => {
    try {
      const parsed = JSON.parse(message) as CommandsMessage;
      for (let command of parsed.commands) {
        processCommand(command.created_at, command.command_json);
      }
    } catch (error) {
      console.log(`Error in subscribe callback: ${error}`);
    }
  });

  while (true) {
    try {
      const telemetryTopic = `devices/${client.deviceInfo.thingName}/telemetry`;
      await client.publish(
        telemetryTopic,

        // See https://docs.flip.energy/api-6088548
        JSON.stringify({
          last_command_acked: latestCommandAcked,
          telemetry: {
            last_mode: "BACKUP",
            battery_last_power_charge_w: 0,
            battery_last_power_discharge_w: 0,
            battery_total_energy_charge_wh: 0,
            battery_total_energy_discharge_wh: 0,
            battery_last_stored_energy_wh: 0,
            battery_last_capacity_energy_wh: 0,
            battery_last_backup_reserve_percentage: 0,
            last_is_grid_online: true,
            home_total_energy_wh: 0,
            home_last_power_w: 0,
            solar_total_energy_wh: 0,
            solar_last_power_w: 0,
          },
        })
      );

      // Sleep for a bit
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      // TODO(jlfwong): Resiliency to lost connectivity. Deal with re-connect
      // Need to re-subscribe.
      console.error("Error:", error);
    }
  }
}

main();
