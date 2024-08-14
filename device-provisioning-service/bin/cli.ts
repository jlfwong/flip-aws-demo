import { provisionBattery } from "../provision-device";

// Example usage
async function main() {
  try {
    const batteryState = await provisionBattery();
    console.log("Provisioned Battery State:", batteryState);
  } catch (error) {
    console.error("Failed to provision battery:", error);
  }
}

main();
