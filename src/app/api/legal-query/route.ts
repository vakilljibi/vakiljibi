import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { currentUser } from "@clerk/nextjs/server";

interface LegalQueryRequest {
  clerkId: string;
  text: string;
  sessionId: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Main try/catch for handling server-level errors (e.g., auth, request parsing)
  try {
    // 1. Authenticate user with Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate the incoming request body
    const body: LegalQueryRequest = await req.json();

    if (!body.clerkId || !body.text || !body.sessionId) {
      return NextResponse.json(
        { error: "Missing clerkId, text, or sessionId" },
        { status: 400 }
      );
    }

    if (body.clerkId !== user.id) {
      return NextResponse.json({ error: "Clerk ID mismatch" }, { status: 403 });
    }

    // 3. Attempt to call the Appwrite function and await a response
    // This nested try/catch specifically handles the outcome of the Appwrite call
    try {
      const appwriteResponse = await axios.post(
        process.env.NEXT_PUBLIC_APPWRITE_FUNCTION_URL || "",
        {
          clerkId: body.clerkId,
          text: body.text,
          sessionId: body.sessionId,
        },
        {
          headers: { "Content-Type": "application/json" },
          // Set a timeout to prevent the API route from hanging too long
          timeout: 15000, // 15 seconds
        }
      );

      // SUCCESS PATH (Rare Case): If Appwrite responds quickly, forward the full data.
      return NextResponse.json(
        {
          status: "completed",
          message: appwriteResponse.data.message,
          wordDocument: appwriteResponse.data.wordDocument,
          excelFile: appwriteResponse.data.excelFile,
          forms: appwriteResponse.data.forms,
        },
        { status: 200 } // HTTP 200 OK
      );
    } catch (error: unknown) {
      // FAILURE PATH (Common Case): If Appwrite fails or times out, tell the frontend to start polling.
      if (error instanceof Error) {
        console.error(
          "Appwrite function error, initiating polling:",
          error.message
        );
      } else {
        console.error(
          "An unknown error occurred with the Appwrite function, initiating polling."
        );
      }

      return NextResponse.json(
        { status: "processing" },
        { status: 202 } // HTTP 202 Accepted
      );
    }
  } catch (error: unknown) {
    // This catches errors from authentication, JSON parsing, etc.
    console.error("Error in legal-query endpoint:", error);

    let errorMessage = "An internal server error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
