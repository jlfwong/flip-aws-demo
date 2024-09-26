"use server";

import {
  CreateEnrollmentPayload,
  flipAdminApiClient,
  Site,
  FlipProgram,
} from "../../../lib/flip-api";
import { revalidatePath } from "next/cache";

export async function updateSite(
  siteId: string,
  siteUpdate: Partial<Site>
): Promise<void> {
  const siteClient = await flipAdminApiClient.getSiteClient(siteId);
  if (!siteClient) {
    throw new Error("Site not found");
  }

  await siteClient.updateSite(siteUpdate);
  revalidatePath(`/devices/[aws-thing-name]`);
}

export async function deleteEnrollment(
  siteId: string,
  enrollmentId: string
): Promise<void> {
  const siteClient = await flipAdminApiClient.getSiteClient(siteId);
  if (!siteClient) {
    throw new Error("Site not found");
  }

  await siteClient.deleteEnrollment(enrollmentId);
  revalidatePath(`/devices/[aws-thing-name]`);
}

export async function createEnrollment(siteId: string, formData: FormData) {
  const siteClient = await flipAdminApiClient.getSiteClient(siteId);
  if (!siteClient) {
    throw new Error("Site not found");
  }

  const programId = formData.get("programId") as string;
  const deviceId = formData.get("deviceId") as string;

  // Fetch the site to get the zip code
  const site = await siteClient.getSite();

  // Fetch the programs using the zip code from the site
  const programs = await siteClient.getPrograms(site.zip_code);
  const program = programs.find((p) => p.id === programId);
  if (!program) {
    throw new Error("Program not found");
  }

  const programSpecificAttributes: { name: string; value: string }[] = [];
  for (const field of program.enrollment_form) {
    if (field.name !== "programId" && field.name !== "deviceId") {
      const value = formData.get(field.name);
      if (value !== null) {
        let processedValue: string;
        switch (field.type) {
          case "boolean":
            processedValue = value === "on" ? "true" : "false";
            break;
          case "number":
            processedValue = parseFloat(value as string).toString();
            break;
          case "string":
          default:
            processedValue = value as string;
            break;
        }
        programSpecificAttributes.push({
          name: field.name,
          value: processedValue,
        });
      }
    }
  }

  const enrollmentData: CreateEnrollmentPayload = {
    device_ids: [deviceId],
    program_id: programId,
    enroll_method: "USER_ACTION",
    has_agreed_to_terms_and_conditions: true,
    program_specific_attributes: programSpecificAttributes,
  };

  await siteClient.createEnrollment(enrollmentData);
  revalidatePath(`/devices/[aws-thing-name]`);
}
