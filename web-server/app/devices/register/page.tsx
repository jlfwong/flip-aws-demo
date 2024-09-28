import { AWSThings } from "../../../lib/aws-things";
import { flipAdminApiClient, FlipSiteApiClient } from "../../../lib/flip-api";
import { SupabaseDevices } from "../../../lib/supabase-devices";
import { createSupabaseServerClient } from "../../../lib/supabase-server-client";
import { registerDevice } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

interface PayloadData {
  thingName: string;
  nonce: string;
  timestamp: number;
  version: number;
}

export const metadata: Metadata = {
  title: "Register Device | Device Management",
};

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
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <Typography>Missing payload or signature</Typography>
        </CardContent>
      </Card>
    );
  }

  let payloadData: PayloadData;
  try {
    payloadData = JSON.parse(decodeURIComponent(payload));
  } catch (error) {
    return (
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <Typography>Invalid payload format</Typography>
        </CardContent>
      </Card>
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
    <div className="space-y-6 p-6">
      <DeviceRegistrationForm payload={payload} signature={signature} />

      <Card>
        <CardHeader>
          <CardTitle>Device Registration Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Typography>
            <strong>Logged in as:</strong> {user!.email}
          </Typography>
          {awsThing && (
            <Typography>
              <strong>AWS IoT Thing:</strong> {JSON.stringify(awsThing)}
            </Typography>
          )}
          {supabaseDevice && (
            <Typography>
              <strong>Supabase DB Record:</strong>{" "}
              {JSON.stringify(supabaseDevice)}
            </Typography>
          )}
          {flipDevice && (
            <Typography>
              <strong>Flip API Record:</strong> {JSON.stringify(flipDevice)}
            </Typography>
          )}
          <Typography>
            <strong>Thing Name:</strong> {thingName}
          </Typography>
          <Typography>
            <strong>Timestamp:</strong> {decodedTimestamp.toLocaleString()}
          </Typography>
          <Typography>
            <strong>Nonce:</strong> {nonce}
          </Typography>
          <Typography>
            <strong>Version:</strong> {version}
          </Typography>
          <Typography>
            <strong>Signature:</strong> {signature}
          </Typography>
          <Typography>
            <strong>Verification Status:</strong> {verificationStatus}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Payload</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(payloadData, null, 2)}
          </pre>
        </CardContent>
      </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Register Device</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={registerDevice} className="space-y-4">
          <input type="hidden" name="payload" value={payload} />
          <input type="hidden" name="signature" value={signature} />

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              type="text"
              id="firstName"
              name="firstName"
              required
              defaultValue="John"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              type="text"
              id="lastName"
              name="lastName"
              required
              defaultValue="Doe"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="stateCode">State Code</Label>
            <Input
              type="text"
              id="stateCode"
              name="stateCode"
              required
              defaultValue="CA"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="city">City</Label>
            <Input
              type="text"
              id="city"
              name="city"
              required
              defaultValue="San Francisco"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="zipCode">Zip Code</Label>
            <Input
              type="text"
              id="zipCode"
              name="zipCode"
              required
              defaultValue="88801"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="streetAddress">Street Address</Label>
            <Input
              type="text"
              id="streetAddress"
              name="streetAddress"
              required
              defaultValue="123 Market St"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="streetAddress2">Street Address 2</Label>
            <Input
              type="text"
              id="streetAddress2"
              name="streetAddress2"
              defaultValue="Apt 4B"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="manufacturerName">Manufacturer Name</Label>
            <Input
              type="text"
              id="manufacturerName"
              name="manufacturerName"
              required
              defaultValue="Tesla"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              type="text"
              id="productName"
              name="productName"
              required
              defaultValue="Powerwall"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="serialNumber">Serial Number</Label>
            <Input
              type="text"
              id="serialNumber"
              name="serialNumber"
              required
              defaultValue="PW123456789"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="batteryCapacity">Battery Capacity (Wh)</Label>
            <Input
              type="number"
              id="batteryCapacity"
              name="batteryCapacity"
              required
              defaultValue="13500"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="batteryPowerInput">Battery Power Input (W)</Label>
            <Input
              type="number"
              id="batteryPowerInput"
              name="batteryPowerInput"
              required
              defaultValue="5000"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="batteryPowerOutput">Battery Power Output (W)</Label>
            <Input
              type="number"
              id="batteryPowerOutput"
              name="batteryPowerOutput"
              required
              defaultValue="5000"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="reservePercentage">Reserve Percentage</Label>
            <Input
              type="number"
              id="reservePercentage"
              name="reservePercentage"
              required
              defaultValue="20"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="serviceAccountId">Service Account ID</Label>
            <Input
              type="text"
              id="serviceAccountId"
              name="serviceAccountId"
              required
            />
          </div>

          <Button type="submit">Register Device</Button>
        </form>
      </CardContent>
    </Card>
  );
}
