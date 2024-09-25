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
  const [site, setSite] = useState<Site>(initialSite);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSite((prevSite: Site) => ({ ...prevSite, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedSite = await updateSite(siteId, site);
      setSite(updatedSite);
      alert("Site information updated successfully!");
    } catch (error) {
      console.error("Error updating site:", error);
      alert("Failed to update site information. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="first_name">First Name:</label>
        <input
          type="text"
          id="first_name"
          name="first_name"
          value={site.first_name}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label htmlFor="last_name">Last Name:</label>
        <input
          type="text"
          id="last_name"
          name="last_name"
          value={site.last_name}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={site.email}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label htmlFor="state_code">State Code:</label>
        <input
          type="text"
          id="state_code"
          name="state_code"
          value={site.state_code}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label htmlFor="city">City:</label>
        <input
          type="text"
          id="city"
          name="city"
          value={site.city}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label htmlFor="zip_code">Zip Code:</label>
        <input
          type="text"
          id="zip_code"
          name="zip_code"
          value={site.zip_code}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label htmlFor="street_address">Street Address:</label>
        <input
          type="text"
          id="street_address"
          name="street_address"
          value={site.street_address}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label htmlFor="street_address2">Street Address 2:</label>
        <input
          type="text"
          id="street_address2"
          name="street_address2"
          value={site.street_address2}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label htmlFor="service_account_id">Service Account ID:</label>
        <input
          type="text"
          id="service_account_id"
          name="service_account_id"
          value={site.service_account_id}
          onChange={handleInputChange}
        />
      </div>
      <button type="submit">Update Site Information</button>
    </form>
  );
}
