"use client";

import { FlipProgram } from "../../../lib/flip-api";
import { createEnrollment } from "./actions";

export function ProgramList({
  programs,
  siteId,
  deviceId,
}: {
  programs: FlipProgram[];
  siteId: string;
  deviceId: string;
}) {
  const handleEnroll = async (programId: string) => {
    try {
      await createEnrollment(siteId, {
        device_ids: [deviceId],
        program_id: programId,
        enroll_method: "USER_ACTION",
        has_agreed_to_terms_and_conditions: true,
      });
      alert("Enrolled successfully!");
      // You might want to refresh the page or update the state here
    } catch (error) {
      console.error("Error enrolling:", error);
      alert("Failed to enroll. Please try again.");
    }
  };

  return (
    <ul>
      {programs.map((program) => (
        <li key={program.id}>
          {program.name}
          <button onClick={() => handleEnroll(program.id)}>Enroll</button>
        </li>
      ))}
    </ul>
  );
}
