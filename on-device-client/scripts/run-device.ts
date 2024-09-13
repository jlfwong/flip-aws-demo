import { AWSIoTClient } from "../lib/AWSIoTClient";

async function main() {
  if (process.argv.length !== 3) {
    console.error("Usage: ts-node client.ts <path_to_device_artifacts>");
    process.exit(1);
  }

  const artifactsPath = process.argv[2];
  const client = new AWSIoTClient(artifactsPath);

  await client.connect();

  // Subscribe to the commands channel
  const commandsTopic = `devices/${client.deviceInfo.thingName}/commands`;
  await client.subscribe(commandsTopic, (topic, message) => {
    try {
      const parsed = JSON.parse(message);
      console.log(`Received message on ${topic}:`, parsed);
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

      // Sleep for a second
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      // TODO(jlfwong): Resiliency to lost connectivity. Deal with re-connect
      console.error("Error:", error);
    }
  }
}

main();
