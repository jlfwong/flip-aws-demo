"use client";

import { FlipEnrollment, FlipProgram } from "../../../lib/flip-api";
import { deleteEnrollment, createEnrollment } from "./actions";
import { useState } from "react";

interface ProgramEnrollmentListProps {
  programs: FlipProgram[];
  enrollments: FlipEnrollment[];
  siteId: string;
  deviceId: string;
}

export function ProgramEnrollmentList({
  programs,
  enrollments,
  siteId,
  deviceId,
}: ProgramEnrollmentListProps) {
  const [localEnrollments, setLocalEnrollments] = useState(enrollments);

  const handleUnenroll = async (enrollmentId: string) => {
    try {
      await deleteEnrollment(siteId, enrollmentId);
      setLocalEnrollments(
        localEnrollments.filter((e) => e.id !== enrollmentId)
      );
      alert("Successfully unenrolled from the program.");
    } catch (error) {
      console.error("Error unenrolling:", error);
      alert("Failed to unenroll. Please try again.");
    }
  };

  const handleEnroll = async (programId: string) => {
    try {
      const newEnrollment = await createEnrollment(siteId, {
        device_ids: [deviceId],
        program_id: programId,
        enroll_method: "USER_ACTION",
        has_agreed_to_terms_and_conditions: true, // You might want to add a checkbox for this
      });
      setLocalEnrollments([...localEnrollments, newEnrollment]);
      alert("Successfully enrolled in the program.");
    } catch (error) {
      console.error("Error enrolling:", error);
      alert("Failed to enroll. Please try again.");
    }
  };

  const getEnrollmentForProgram = (programId: string) => {
    return localEnrollments.find(
      (e) => e.program_id === programId && e.status !== "UNENROLLED"
    );
  };

  return (
    <ul>
      {programs.map((program) => {
        const enrollment = getEnrollmentForProgram(program.id);
        return (
          <li key={program.id}>
            <h3>{program.name}</h3>
            <p>{program.description}</p>
            {enrollment ? (
              <>
                <p>Status: {enrollment.status}</p>
                {enrollment.status_reason && (
                  <p>Reason: {enrollment.status_reason}</p>
                )}
                <p>Enrolled: {enrollment.enrolled_at}</p>
                <button onClick={() => handleUnenroll(enrollment.id)}>
                  Unenroll
                </button>
              </>
            ) : (
              <button onClick={() => handleEnroll(program.id)}>Enroll</button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
