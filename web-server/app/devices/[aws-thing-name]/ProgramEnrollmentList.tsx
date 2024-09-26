import { FlipEnrollment, FlipProgram } from "../../../lib/flip-api";
import { deleteEnrollment, createEnrollment } from "./actions";

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
  const getEnrollmentForProgram = (programId: string) => {
    return enrollments.find(
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
                {program.enrollment_form && (
                  <div>
                    <h4>Program Specific Attributes:</h4>
                    {program.enrollment_form.map((field) => (
                      <p key={field.name}>
                        {field.label}:{" "}
                        {enrollment.program_specific_attributes.find(
                          (attr) => attr.name === field.name
                        )?.value || ""}
                      </p>
                    ))}
                  </div>
                )}
                <form
                  action={deleteEnrollment.bind(null, siteId, enrollment.id)}
                >
                  <button type="submit">Unenroll</button>
                </form>
              </>
            ) : (
              <form action={createEnrollment.bind(null, siteId)}>
                <input type="hidden" name="programId" value={program.id} />
                <input type="hidden" name="deviceId" value={deviceId} />
                {program.enrollment_form && (
                  <div>
                    <h4>Enrollment Form:</h4>
                    {program.enrollment_form.map((field) => (
                      <div key={field.name}>
                        <label htmlFor={`${program.id}-${field.name}`}>
                          {field.label}:
                        </label>
                        {field.type === "boolean" ? (
                          <input
                            type="checkbox"
                            id={`${program.id}-${field.name}`}
                            name={field.name}
                            required={true}
                          />
                        ) : field.type === "number" ? (
                          <input
                            type="number"
                            id={`${program.id}-${field.name}`}
                            name={field.name}
                            required={true}
                          />
                        ) : (
                          <input
                            type="text"
                            id={`${program.id}-${field.name}`}
                            name={field.name}
                            required={true}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button type="submit">Enroll</button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
