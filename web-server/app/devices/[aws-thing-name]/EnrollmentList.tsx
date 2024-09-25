"use client";

import { FlipEnrollment } from "../../../lib/flip-api";
import { deleteEnrollment } from "./actions";

export function EnrollmentList({
  enrollments,
  siteId,
  deviceId,
}: {
  enrollments: FlipEnrollment[];
  siteId: string;
  deviceId: string;
}) {
  const handleDelete = async (enrollmentId: string) => {
    try {
      await deleteEnrollment(siteId, enrollmentId);
      alert("Enrollment deleted successfully!");
      // You might want to refresh the page or update the state here
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      alert("Failed to delete enrollment. Please try again.");
    }
  };

  return (
    <ul>
      {enrollments.map((enrollment) => (
        <li key={enrollment.id}>
          Program ID: {enrollment.program_id}
          <button onClick={() => handleDelete(enrollment.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
