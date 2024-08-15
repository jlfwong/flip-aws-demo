import { provisionBattery } from "../provision-device";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // Check if both device ID and directory path are provided as command-line arguments
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error("Please provide two arguments: <device_id> <result_path>");
    console.error("Example: ts-node cli.ts my-device-001 ./device-artifacts");
    process.exit(1);
  }

  const [deviceId, resultPath] = args;

  try {
    const batteryState = await provisionBattery(deviceId);

    // Create the specified directory
    const deviceDir = path.resolve(process.cwd(), resultPath);
    fs.mkdirSync(deviceDir, { recursive: true });

    // Write JSON file with thing name, thing ARN, and certificate ARN
    const deviceInfo = {
      thingName: batteryState.thingName,
      thingArn: batteryState.thingArn,
      certificateArn: batteryState.certificateArn,
      iotEndpoint: batteryState.iotEndpoint,
    };
    fs.writeFileSync(
      path.join(deviceDir, "device-info.json"),
      JSON.stringify(deviceInfo, null, 2)
    );

    // Write certificate PEM file
    fs.writeFileSync(
      path.join(deviceDir, "certificate.pem"),
      batteryState.certificatePem
    );

    // Write private key file
    fs.writeFileSync(
      path.join(deviceDir, "private-key.pem"),
      batteryState.privateKey
    );

    fs.copyFileSync(
      path.join(
        __dirname,
        "..",
        "..",
        "terraform",
        "output",
        "AmazonRootCA1.pem"
      ),
      path.join(deviceDir, "AmazonRootCA1.pem")
    );

    console.log(`Device artifacts stored in: ${deviceDir}`);
  } catch (error) {
    console.error("Failed to provision battery:", error);
  }
}

main();
