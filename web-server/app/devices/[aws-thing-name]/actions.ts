"use server";

import {
  flipAdminApiClient,
  Site,
  FlipEnrollment,
  CreateEnrollmentPayload,
} from "../../../lib/flip-api";

export async function updateSite(
  siteId: string,
  siteUpdate: Partial<Site>
): Promise<Site> {
  const siteClient = await flipAdminApiClient.getSiteClient(siteId);
  if (!siteClient) {
    throw new Error("Site not found");
  }

  // Remove tariff_id if it's null or empty
  const updatedSiteData = { ...siteUpdate };
  if (!updatedSiteData.tariff_id) {
    delete updatedSiteData.tariff_id;
  }

  const updatedSite = await siteClient.updateSite(updatedSiteData);
  return updatedSite;
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
