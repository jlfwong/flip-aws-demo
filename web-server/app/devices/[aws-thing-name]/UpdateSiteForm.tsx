"use client";

import { useState } from "react";
import { Site } from "../../../lib/flip-api";
import { updateSite } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

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
      <Card className="space-y-4 pt-4">
        <CardContent className="space-y-4">
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              type="text"
              id="first_name"
              name="first_name"
              defaultValue={initialSite.first_name || ""}
            />
          </div>
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              type="text"
              id="last_name"
              name="last_name"
              defaultValue={initialSite.last_name || ""}
            />
          </div>
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              defaultValue={initialSite.email || ""}
            />
          </div>
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="state_code">State Code</Label>
            <Input
              type="text"
              id="state_code"
              name="state_code"
              defaultValue={initialSite.state_code || ""}
            />
          </div>
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="city">City</Label>
            <Input
              type="text"
              id="city"
              name="city"
              defaultValue={initialSite.city || ""}
            />
          </div>
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="zip_code">Zip Code</Label>
            <Input
              type="text"
              id="zip_code"
              name="zip_code"
              defaultValue={initialSite.zip_code || ""}
            />
          </div>
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="street_address">Street Address</Label>
            <Input
              type="text"
              id="street_address"
              name="street_address"
              defaultValue={initialSite.street_address || ""}
            />
          </div>
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="street_address2">Street Address 2</Label>
            <Input
              type="text"
              id="street_address2"
              name="street_address2"
              defaultValue={initialSite.street_address2 || ""}
            />
          </div>
          <div className="grid grid-cols-[150px_1fr] items-center gap-4">
            <Label htmlFor="service_account_id">Service Account ID</Label>
            <Input
              type="text"
              id="service_account_id"
              name="service_account_id"
              defaultValue={initialSite.service_account_id || ""}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Site Information"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
