import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { audio, clerkId, sessionId } = await request.json();

    if (!audio || !clerkId || !sessionId) {
      return NextResponse.json(
        { message: "Missing audio, clerkId, or sessionId" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://68a8d1670036e6ca5dd0.fra.appwrite.run/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": process.env.APPWRITE_PROJECT_ID!,
          "X-Appwrite-Key": process.env.APPWRITE_API_KEY!,
        },
        body: JSON.stringify({ audio, clerkId, sessionId }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to process audio");
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Voice API error:", error);
    return NextResponse.json(
      { message: `Failed to process voice: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
