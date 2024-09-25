import { AWSThings } from "../../../lib/aws-things";
import { flipAdminApiClient, FlipSiteApiClient } from "../../../lib/flip-api";
import { SupabaseDevices } from "../../../lib/supabase-devices";
import { createSupabaseServerClient } from "../../../lib/supabase-server-client";
import { registerDevice } from "./actions";

interface PayloadData {
  thingName: string;
  nonce: string;
  timestamp: number;
  version: number;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { payload?: string; signature?: string };
}) {
  const { payload, signature } = searchParams;

  // Create Supabase client
  const supabase = createSupabaseServerClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!payload || !signature) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>Missing payload or signature</p>
      </div>
    );
  }

  let payloadData: PayloadData;
  try {
    payloadData = JSON.parse(decodeURIComponent(payload));
  } catch (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>Invalid payload format</p>
      </div>
    );
  }

  const { thingName, nonce, timestamp, version } = payloadData;
  const decodedTimestamp = new Date(timestamp * 1000);

  const flipSiteId = FlipSiteApiClient.siteIdForThingName(thingName);
  const flipDeviceId = FlipSiteApiClient.deviceIdForThingName(thingName);

  const [awsThing, supabaseDevice, flipDevice] = await Promise.all([
    AWSThings.getThingMetadata(thingName),
    SupabaseDevices.byAWSThingName(supabase, thingName),
    flipAdminApiClient
      .getSiteClient(flipSiteId)
      .then((siteClient) => siteClient?.getDeviceOrNull(flipDeviceId)),
  ]);

  let verificationStatus: string;
  try {
    await AWSThings.verifyDeviceSignature(payload, signature);
    verificationStatus = "success";
  } catch (err) {
    verificationStatus = `${err}`;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Device Registration Information
      </h1>
      <p className="mb-4">
        <strong>Logged in as:</strong> {user!.email}
      </p>
      {awsThing && (
        <div className="space-y-2">
          <p>
            <strong>AWS IoT Thing:</strong> {JSON.stringify(awsThing)}
          </p>
        </div>
      )}
      {supabaseDevice && (
        <div className="space-y-2">
          <p>
            <strong>Supabase DB Record:</strong>{" "}
            {JSON.stringify(supabaseDevice)}
          </p>
        </div>
      )}
      {flipDevice && (
        <div className="space-y-2">
          <p>
            <strong>Flip API Record:</strong> {JSON.stringify(flipDevice)}
          </p>
        </div>
      )}
      <div className="space-y-2">
        <p>
          <strong>Thing Name:</strong> {thingName}
        </p>
        <p>
          <strong>Timestamp:</strong> {decodedTimestamp.toLocaleString()}
        </p>
        <p>
          <strong>Nonce:</strong> {nonce}
        </p>
        <p>
          <strong>Version:</strong> {version}
        </p>
        <p>
          <strong>Signature:</strong> {signature}
        </p>
        <p>
          <strong>Verification Status:</strong> {verificationStatus}
        </p>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">Raw Payload:</h2>
        <pre className="bg-gray-100 p-2 rounded">
          {JSON.stringify(payloadData, null, 2)}
        </pre>
      </div>
      <DeviceRegistrationForm payload={payload} signature={signature} />
    </div>
  );
}

export function DeviceRegistrationForm({
  payload,
  signature,
}: {
  payload: string;
  signature: string;
}) {
  return (
    <form action={registerDevice} className="space-y-4 mt-8">
      <h2 className="text-xl font-bold">Register Device</h2>

      <input type="hidden" name="payload" value={payload} />
      <input type="hidden" name="signature" value={signature} />

      <div>
        <label htmlFor="firstName" className="block">
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          required
          className="w-full p-2 border rounded"
          defaultValue="John"
        />
      </div>

      <div>
        <label htmlFor="lastName" className="block">
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          required
          className="w-full p-2 border rounded"
          defaultValue="Doe"
        />
      </div>

      <div>
        <label htmlFor="stateCode" className="block">
          State Code
        </label>
        <input
          type="text"
          id="stateCode"
          name="stateCode"
          required
          className="w-full p-2 border rounded"
          defaultValue="CA"
        />
      </div>

      <div>
        <label htmlFor="city" className="block">
          City
        </label>
        <input
          type="text"
          id="city"
          name="city"
          required
          className="w-full p-2 border rounded"
          defaultValue="San Francisco"
        />
      </div>

      <div>
        <label htmlFor="zipCode" className="block">
          Zip Code
        </label>
        <input
          type="text"
          id="zipCode"
          name="zipCode"
          required
          className="w-full p-2 border rounded"
          defaultValue="88801"
        />
      </div>

      <div>
        <label htmlFor="streetAddress" className="block">
          Street Address
        </label>
        <input
          type="text"
          id="streetAddress"
          name="streetAddress"
          required
          className="w-full p-2 border rounded"
          defaultValue="123 Market St"
        />
      </div>

      <div>
        <label htmlFor="streetAddress2" className="block">
          Street Address 2
        </label>
        <input
          type="text"
          id="streetAddress2"
          name="streetAddress2"
          className="w-full p-2 border rounded"
          defaultValue="Apt 4B"
        />
      </div>

      <div>
        <label htmlFor="manufacturerName" className="block">
          Manufacturer Name
        </label>
        <input
          type="text"
          id="manufacturerName"
          name="manufacturerName"
          required
          className="w-full p-2 border rounded"
          defaultValue="Tesla"
        />
      </div>

      <div>
        <label htmlFor="productName" className="block">
          Product Name
        </label>
        <input
          type="text"
          id="productName"
          name="productName"
          required
          className="w-full p-2 border rounded"
          defaultValue="Powerwall"
        />
      </div>

      <div>
        <label htmlFor="serialNumber" className="block">
          Serial Number
        </label>
        <input
          type="text"
          id="serialNumber"
          name="serialNumber"
          required
          className="w-full p-2 border rounded"
          defaultValue="PW123456789"
        />
      </div>

      <div>
        <label htmlFor="batteryCapacity" className="block">
          Battery Capacity (Wh)
        </label>
        <input
          type="number"
          id="batteryCapacity"
          name="batteryCapacity"
          required
          className="w-full p-2 border rounded"
          defaultValue="13500"
        />
      </div>

      <div>
        <label htmlFor="batteryPowerInput" className="block">
          Battery Power Input (W)
        </label>
        <input
          type="number"
          id="batteryPowerInput"
          name="batteryPowerInput"
          required
          className="w-full p-2 border rounded"
          defaultValue="5000"
        />
      </div>

      <div>
        <label htmlFor="batteryPowerOutput" className="block">
          Battery Power Output (W)
        </label>
        <input
          type="number"
          id="batteryPowerOutput"
          name="batteryPowerOutput"
          required
          className="w-full p-2 border rounded"
          defaultValue="5000"
        />
      </div>

      <div>
        <label htmlFor="reservePercentage" className="block">
          Reserve Percentage
        </label>
        <input
          type="number"
          id="reservePercentage"
          name="reservePercentage"
          required
          className="w-full p-2 border rounded"
          defaultValue="20"
        />
      </div>

      <div>
        <label htmlFor="serviceAccountId">Service Account ID:</label>
        <input
          type="text"
          id="serviceAccountId"
          name="serviceAccountId"
          required
        />
      </div>

      <button
        type="submit"
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Register Device
      </button>
    </form>
  );
}
