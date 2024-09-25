import { createSupabaseServerClient } from "../../../lib/supabase-server-client";
import {
  flipAdminApiClient,
  FlipProgram,
  FlipEnrollment,
} from "../../../lib/flip-api";
import { UpdateSiteForm } from "./UpdateSiteForm";
import { EnrollmentList } from "./EnrollmentList";
import { ProgramList } from "./ProgramList";

export default async function DevicePage({
  params,
}: {
  params: { "aws-thing-name": string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: device } = await supabase
    .from("devices")
    .select("*")
    .eq("aws_thing_name", params["aws-thing-name"])
    .single();

  if (!device) {
    return <div>Device not found</div>;
  }

  const siteClient = await flipAdminApiClient.getSiteClient(
    device.flip_site_id
  );
  if (!siteClient) {
    return <div>Site not found</div>;
  }

  const site = await siteClient.getSite();
  const enrollments = await siteClient.getEnrollments();
  const programs = await siteClient.getPrograms();

  return (
    <div>
      <h1>Device: {params["aws-thing-name"]}</h1>
      <p>Flip Device ID: {device.flip_device_id}</p>
      <p>Flip Site ID: {device.flip_site_id}</p>

      <h2>Site Information</h2>
      <UpdateSiteForm initialSite={site} siteId={device.flip_site_id} />

      <h2>Enrollments</h2>
      <EnrollmentList
        enrollments={enrollments}
        siteId={device.flip_site_id}
        deviceId={device.flip_device_id}
      />

      <h2>Available Programs</h2>
      <ProgramList
        programs={programs}
        siteId={device.flip_site_id}
        deviceId={device.flip_device_id}
      />
    </div>
  );
}
