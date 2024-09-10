import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();

    // Log the request body
    console.log("Received telemetry data:", JSON.stringify(body, null, 2));

    // Process telemetry data
    // TODO: Implement your business logic here
    // For example, interacting with a third-party API

    // Return a 200 response
    return NextResponse.json(
      { message: "Telemetry processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    // Log any errors
    console.error("Error processing telemetry:", error);

    // Still return a 200 response to acknowledge receipt
    return NextResponse.json(
      { message: "Telemetry received" },
      { status: 200 }
    );
  }
}
