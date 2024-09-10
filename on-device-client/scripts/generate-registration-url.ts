import { AWSIoTClient } from "../lib/AWSIoTClient";
import { generateRegistrationUrl } from '../lib/registration';
import * as fs from 'fs';

async function main() {
  if (process.argv.length !== 4) {
    console.error("Usage: ts-node client.ts <path_to_device_artifacts> <registration_base_url>");
    process.exit(1);
  }

  const artifactsPath = process.argv[2];
  const registrationBaseUrl = process.argv[3];
  const client = new AWSIoTClient(artifactsPath);

  // Read private key and device info
  const privateKey = fs.readFileSync(client.privateKeyPath(), 'utf8')

  // Generate registration URL
  const registrationUrl = generateRegistrationUrl(registrationBaseUrl, client.deviceInfo.thingName, privateKey);

  console.log('Registration URL:', registrationUrl);
}

main();