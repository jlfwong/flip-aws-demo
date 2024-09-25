"use server";

import { flipAdminApiClient, Site } from "../../../lib/flip-api";
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
}

export async function createEnrollment(
  siteId: string,
  payload: CreateEnrollmentPayload
): Promise<FlipEnrollment> {
  const siteClient = await flipAdminApiClient.getSiteClient(siteId);
  if (!siteClient) {
    throw new Error("Site not found");
  }

  return await siteClient.createEnrollment(payload);
}
