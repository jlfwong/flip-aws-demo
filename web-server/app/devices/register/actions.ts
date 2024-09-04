"use server";

import { CommissionPayload, FlipClientApiClient } from "../../../lib/flip-api";
import safeEnv from "../../../lib/safe-env";
import { createSupabaseServerClient } from "../../../lib/supabase-server-client";
import { verifySignature } from "../../../lib/verify-signature";

export async function registerDevice(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const payload = formData.get("payload") as string;
  const signature = formData.get("signature") as string;

  if (!payload || !signature) {
    throw new Error("Missing payload or signature");
  }

  try {
    await verifySignature(payload, signature);
  } catch (err) {
    throw new Error(`Signature verification failed: ${err}`);
  }

  let payloadData;
  try {
    payloadData = JSON.parse(decodeURIComponent(payload));
  } catch (error) {
    throw new Error("Invalid payload format");
  }

  const { thingName } = payloadData;

  // You can now use thingName or other data from payloadData in your payload construction

  const client = new FlipClientApiClient(
    safeEnv.FLIP_API_URL,
    safeEnv.FLIP_API_KEY
  );

  const flipSiteId = `site-for-device::${thingName}`;
  const flipDeviceId = `device::${thingName}`;

  const commissionPayload: CommissionPayload = {
    site: {
      id: flipSiteId,
      first_name: formData.get("firstName") as string,
      last_name: formData.get("lastName") as string,
      email: user.email!,
      state_code: formData.get("stateCode") as string,
      city: formData.get("city") as string,
      zip_code: formData.get("zipCode") as string,
      street_address: formData.get("streetAddress") as string,
      street_address2: formData.get("streetAddress2") as string,
    },
    devices: [
      {
        id: flipDeviceId,
        manufacturer_name: formData.get("manufacturerName") as string,
        product_name: formData.get("productName") as string,
        type: "BATTERY",
        serial_number: formData.get("serialNumber") as string,
        attributes: {
          battery_capacity_wh: parseInt(
            formData.get("batteryCapacity") as string
          ),
          battery_power_input_w: parseInt(
            formData.get("batteryPowerInput") as string
          ),
          battery_power_output_w: parseInt(
            formData.get("batteryPowerOutput") as string
          ),
        },
        configuration: {
          reserve_percentage: parseInt(
            formData.get("reservePercentage") as string
          ),
        },
        install_date: new Date().toISOString(),
      },
    ],
    can_auto_enroll: true,
  };

  try {
    const result = await client.commission(commissionPayload);
    console.log("Commission result:", JSON.stringify(result, null, 2));
  } catch (error) {
    // TODO(jlfwong): Handle duplicate registration
    // This manifests as an HTTP 409 error from Flip.
    console.error("Error during commission:", error);
    throw error;
  }

  const { data: insertedDevice, error: insertError } = await supabase
    .from("devices")
    .insert({
      aws_thing_name: thingName,
      flip_device_id: flipDeviceId,
      flip_site_id: flipSiteId,
      user_id: user.id,
    });

  if (insertError) {
    console.error("Error inserting device into Supabase:", insertError);
    throw insertError;
  }

  console.log("Device inserted into Supabase:", insertedDevice);
}
