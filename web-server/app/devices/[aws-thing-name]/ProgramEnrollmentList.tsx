import { FlipEnrollment, FlipProgram } from "../../../lib/flip-api";
import { deleteEnrollment, createEnrollment } from "./actions";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
    <div className="space-y-6">
      {programs.map((program) => {
        const enrollment = getEnrollmentForProgram(program.id);
        return (
          <Card key={program.id}>
            <CardHeader>
              <CardTitle>{program.name}</CardTitle>
              <Typography variant="muted">{program.description}</Typography>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollment ? (
                <>
                  <Typography>Status: {enrollment.status}</Typography>
                  {enrollment.status_reason && (
                    <Typography>Reason: {enrollment.status_reason}</Typography>
                  )}
                  <Typography>Enrolled: {enrollment.enrolled_at}</Typography>
                  {program.enrollment_form && (
                    <div>
                      <Typography variant="h4">
                        Program Specific Attributes:
                      </Typography>
                      {program.enrollment_form.map((field) => {
                        const attribute =
                          enrollment.program_specific_attributes.find(
                            (attr) => attr.name === field.name
                          );
                        let displayValue = "";
                        if (attribute) {
                          if (field.type === "boolean") {
                            displayValue =
                              attribute.value === "true" ? "Yes" : "No";
                          } else {
                            displayValue = attribute.value;
                          }
                        }
                        return (
                          <Typography key={field.name}>
                            {field.label}: {displayValue}
                          </Typography>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <form
                  action={createEnrollment.bind(null, siteId)}
                  className="space-y-4"
                >
                  <Input type="hidden" name="programId" value={program.id} />
                  <Input type="hidden" name="deviceId" value={deviceId} />
                  {program.enrollment_form && (
                    <div className="space-y-4">
                      {program.enrollment_form.map((field) => (
                        <div
                          key={field.name}
                          className="grid grid-cols-[150px_1fr] items-center gap-4"
                        >
                          <Label htmlFor={`${program.id}-${field.name}`}>
                            {field.label}:
                          </Label>
                          {field.type === "boolean" ? (
                            <Checkbox
                              id={`${program.id}-${field.name}`}
                              name={field.name}
                            />
                          ) : field.type === "number" ? (
                            <Input
                              type="number"
                              id={`${program.id}-${field.name}`}
                              name={field.name}
                              required={true}
                            />
                          ) : (
                            <Input
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
                  <Button type="submit">Enroll</Button>
                </form>
              )}
            </CardContent>
            {enrollment && (
              <CardFooter>
                <form
                  action={deleteEnrollment.bind(null, siteId, enrollment.id)}
                >
                  <Button type="submit" variant="destructive">
                    Unenroll
                  </Button>
                </form>
              </CardFooter>
            )}
          </Card>
        );
      })}
    </div>
  );
}
