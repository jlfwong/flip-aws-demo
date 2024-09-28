import { createSupabaseServerClient } from "../../../lib/supabase-server-client";
import { flipAdminApiClient } from "../../../lib/flip-api";
import { UpdateSiteForm } from "./UpdateSiteForm";
import { ProgramEnrollmentList } from "./ProgramEnrollmentList";
import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  const [enrollments, programs] = await Promise.all([
    siteClient.getEnrollments(),
    siteClient.getPrograms(site.zip_code),
  ]);

  return (
    <main className="p-6 space-y-8">
      <div className="space-y-2">
        <Typography variant="h1">Device: {params["aws-thing-name"]}</Typography>
        <Typography>Flip Device ID: {device.flip_device_id}</Typography>
        <Typography>Flip Site ID: {device.flip_site_id}</Typography>
      </div>

      <section className="space-y-4">
        <Typography variant="h2">Site Information</Typography>
        <UpdateSiteForm initialSite={site} siteId={device.flip_site_id} />
      </section>

      <section className="space-y-4">
        <Typography variant="h2">Programs</Typography>
        <ProgramEnrollmentList
          programs={programs}
          enrollments={enrollments}
          siteId={device.flip_site_id}
          deviceId={device.flip_device_id}
        />
      </section>

      <div className="mt-8">
        <Link href="/">
          <Button variant="outline">Back Home</Button>
        </Link>
      </div>
    </main>
  );
}
