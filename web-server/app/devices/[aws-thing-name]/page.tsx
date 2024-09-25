import Link from "next/link";
import { createSupabaseServerClient } from "../../../lib/supabase-server-client";
import { notFound } from "next/navigation";
import {
  flipAdminApiClient,
  FlipProgram,
  FlipEnrollment,
  CreateEnrollmentPayload,
} from "../../../lib/flip-api";
import { revalidatePath } from "next/cache";

// Server action to create enrollment
async function createEnrollment(formData: FormData) {
  "use server";
  const siteId = formData.get("siteId") as string;
  const programId = formData.get("programId") as string;
  const deviceId = formData.get("deviceId") as string;
  const awsThingName = formData.get("awsThingName") as string;

  const flipSiteClient = await flipAdminApiClient.getSiteClient(siteId);
  if (!flipSiteClient) {
    throw new Error("Failed to fetch site client");
  }

  const payload: CreateEnrollmentPayload = {
    device_ids: [deviceId],
    program_id: programId,
    enroll_method: "USER_ACTION",
    has_agreed_to_terms_and_conditions: true,
  };

  await flipSiteClient.createEnrollment(payload);
  revalidatePath(`/devices/${awsThingName}`);
}

// Server action to delete enrollment
async function deleteEnrollment(formData: FormData) {
  "use server";
  const siteId = formData.get("siteId") as string;
  const enrollmentId = formData.get("enrollmentId") as string;
  const awsThingName = formData.get("awsThingName") as string;

  const flipSiteClient = await flipAdminApiClient.getSiteClient(siteId);
  if (!flipSiteClient) {
    throw new Error("Failed to fetch site client");
  }

  await flipSiteClient.deleteEnrollment(enrollmentId);
  revalidatePath(`/devices/${awsThingName}`);
}

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
  let enrollments: FlipEnrollment[] = [];
  programs = await flipSiteClient.getPrograms();
  enrollments = await flipSiteClient.getEnrollments();
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
      <h2 className="text-xl font-bold mt-4 mb-2">Enrollments</h2>
      {enrollments.length > 0 ? (
        <ul>
          {enrollments.map((enrollment) => (
            <li key={enrollment.id}>
              <strong>Program ID:</strong> {enrollment.program_id},{" "}
              <strong>Status:</strong> {enrollment.status},{" "}
              <strong>Enrolled At:</strong> {enrollment.enrolled_at}
              <form action={deleteEnrollment}>
                <input
                  type="hidden"
                  name="siteId"
                  value={device.flip_site_id}
                />
                <input
                  type="hidden"
                  name="enrollmentId"
                  value={enrollment.id}
                />
                <input
                  type="hidden"
                  name="awsThingName"
                  value={params["aws-thing-name"]}
                />
                <button type="submit" className="ml-2 text-red-500">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p>No enrollments found.</p>
      )}
      <h2 className="text-xl font-bold mt-4 mb-2">Create Enrollment</h2>
      <form action={createEnrollment}>
        <input type="hidden" name="siteId" value={device.flip_site_id} />
        <input type="hidden" name="deviceId" value={device.flip_device_id} />
        <input
          type="hidden"
          name="awsThingName"
          value={params["aws-thing-name"]}
        />
        <select name="programId" required className="border p-2 mr-2">
          <option value="">Select a program</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Create Enrollment
        </button>
      </form>
      <Link href="/" className="block mt-4">
        Home
      </Link>
    </div>
  );
}
