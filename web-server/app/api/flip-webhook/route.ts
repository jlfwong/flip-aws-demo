import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log(
      "Received Flip webhook payload:",
      JSON.stringify(payload, null, 2)
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error processing Flip webhook:", error);
    return new NextResponse("Error processing webhook", { status: 500 });
  }
}
