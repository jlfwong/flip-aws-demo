import Link from "next/link";
import { createSupabaseServerClient } from "../../../lib/supabase-server-client";
import { notFound } from "next/navigation";
import { flipAdminApiClient, FlipProgram } from "../../../lib/flip-api";

export default async function DevicePage({
  params,
}: {
  params: { "aws-thing-name": string };
}) {
  const supabase = createSupabaseServerClient();

  const { data: device, error } = await supabase
    .from("devices")
    .select("*")
    .eq("aws_thing_name", params["aws-thing-name"])
    .single();

  if (error || !device) {
    notFound();
  }

  const flipSiteClient = await flipAdminApiClient.getSiteClient(
    device.flip_site_id
  );

  if (!flipSiteClient) {
    throw new Error("Failed to fetch site client");
  }

  let programs: FlipProgram[] = [];
  programs = await flipSiteClient.getPrograms();
  const site = await flipSiteClient.getSite();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Device Details</h1>
      <p>
        <strong>AWS Thing Name:</strong> {device.aws_thing_name}
      </p>
      <p>
        <strong>Flip Device ID:</strong> {device.flip_device_id}
      </p>
      <p>
        <strong>Flip Site ID:</strong> {device.flip_site_id}
      </p>
      <h2 className="text-xl font-bold mt-4 mb-2">Site Information</h2>
      <p>
        <strong>Name:</strong> {site.first_name} {site.last_name}
      </p>
      <p>
        <strong>Email:</strong> {site.email}
      </p>
      <p>
        <strong>Address:</strong> {site.street_address}, {site.city},{" "}
        {site.state_code} {site.zip_code}
      </p>
      <h2 className="text-xl font-bold mt-4 mb-2">Associated Programs</h2>
      {programs.length > 0 ? (
        <ul>
          {programs.map((program) => (
            <li key={program.id}>
              <strong>{program.name}</strong>: {program.description}
            </li>
          ))}
        </ul>
      ) : (
        <p>No associated programs found.</p>
      )}
      <Link href="/">Home</Link>
    </div>
  );
}
