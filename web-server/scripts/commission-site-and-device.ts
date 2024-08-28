import * as dotenv from 'dotenv';
import { FlipClientApiClient } from '../lib/flip-api';

dotenv.config();

const FLIP_API_KEY = process.env.FLIP_API_KEY;
if (!FLIP_API_KEY) {
  console.error('FLIP_API_KEY is not set in the environment variables');
  process.exit(1);
}

const FLIP_API_URL = process.env.FLIP_API_URL;
if (!FLIP_API_URL) {
  console.error('FLIP_API_URL is not set in the environment variables');
  process.exit(1);
}

function generateRandomString(length: number): string {
  return Math.random().toString(36).substring(2, length + 2);
}

function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSanFranciscoPII() {
  return {
    id: `flip-aws-demo-site-${generateRandomString(8)}`,
    first_name: 'John',
    last_name: 'Doe',
    email: `john.doe${generateRandomString(4)}@example.com`,
    state_code: 'CA',
    city: 'San Francisco',
    zip_code: '8880' + generateRandomNumber(1, 3).toString(),
    street_address: `${generateRandomNumber(1, 9999)} Market St`,
    street_address2: `Apt ${generateRandomNumber(1, 999)}`,
  };
}

function generateFakeDevice() {
  return {
    id: `flip-aws-demo-device-${generateRandomString(8)}`,
    manufacturer_name: 'Generic',
    product_name: 'Battery System',
    type: 'BATTERY',
    serial_number: `GEN-${generateRandomString(8).toUpperCase()}`,
    attributes: {
      battery_capacity_wh: generateRandomNumber(3000, 10000),
      battery_power_input_w: generateRandomNumber(2000, 5000),
      battery_power_output_w: generateRandomNumber(2000, 5000),
    },
    configuration: {
      reserve_percentage: generateRandomNumber(10, 30),
    },
    install_date: new Date().toISOString(),
  };
}

async function main() {
  const client = new FlipClientApiClient(FLIP_API_URL, FLIP_API_KEY);

  const payload = {
    site: generateSanFranciscoPII(),
    devices: [generateFakeDevice()],
    can_auto_enroll: true,
  };

  try {
    const result = await client.commission(payload);
    console.log('Commission result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error during commission:', error);
  }
}

main().catch(console.error);