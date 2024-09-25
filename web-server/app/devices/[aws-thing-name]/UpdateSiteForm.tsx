"use client";

import { useState } from "react";
import { Site } from "../../../lib/flip-api";
import { updateSite } from "./actions";

export function UpdateSiteForm({
  initialSite,
  siteId,
}: {
  initialSite: Site;
  siteId: string;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);

    const formData = new FormData(e.currentTarget);
    const siteUpdate: Partial<Site> = Object.fromEntries(formData.entries());

    try {
      await updateSite(siteId, siteUpdate);
      alert("Site updated successfully!");
    } catch (error) {
      console.error("Error updating site:", error);
      alert("Failed to update site. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label htmlFor="first_name">First Name:</label>
        <input
          type="text"
          id="first_name"
          name="first_name"
          defaultValue={initialSite.first_name || ""}
        />
      </div>
      <div>
        <label htmlFor="last_name">Last Name:</label>
        <input
          type="text"
          id="last_name"
          name="last_name"
          defaultValue={initialSite.last_name || ""}
        />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          defaultValue={initialSite.email || ""}
        />
      </div>
      <div>
        <label htmlFor="state_code">State Code:</label>
        <input
          type="text"
          id="state_code"
          name="state_code"
          defaultValue={initialSite.state_code || ""}
        />
      </div>
      <div>
        <label htmlFor="city">City:</label>
        <input
          type="text"
          id="city"
          name="city"
          defaultValue={initialSite.city || ""}
        />
      </div>
      <div>
        <label htmlFor="zip_code">Zip Code:</label>
        <input
          type="text"
          id="zip_code"
          name="zip_code"
          defaultValue={initialSite.zip_code || ""}
        />
      </div>
      <div>
        <label htmlFor="street_address">Street Address:</label>
        <input
          type="text"
          id="street_address"
          name="street_address"
          defaultValue={initialSite.street_address || ""}
        />
      </div>
      <div>
        <label htmlFor="street_address2">Street Address 2:</label>
        <input
          type="text"
          id="street_address2"
          name="street_address2"
          defaultValue={initialSite.street_address2 || ""}
        />
      </div>
      <div>
        <label htmlFor="service_account_id">Service Account ID:</label>
        <input
          type="text"
          id="service_account_id"
          name="service_account_id"
          defaultValue={initialSite.service_account_id || ""}
        />
      </div>
      <button type="submit" disabled={isUpdating}>
        {isUpdating ? "Updating..." : "Update Site Information"}
      </button>
    </form>
  );
}
