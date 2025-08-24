import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

interface CheckResponse {
  status: "pending" | "completed" | "error"; // Added "error" status
  message?: string;
  wordDocument?: string | null;
  excelFile?: string | null;
  forms?: Array<{ title: string; fileData: string }>;
  error?: string;
}

export async function GET(
  req: NextRequest
): Promise<NextResponse<CheckResponse>> {
  try {
    // Authenticate user with Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json(
        { status: "error", error: "Missing sessionId" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_KEY || ""
    );

    // Verify user
    const { data: userResponse, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerkId", user.id)
      .single();

    if (userError || !userResponse) {
      return NextResponse.json(
        { status: "error", error: "User not found" },
        { status: 404 }
      );
    }

    // Verify session
    const { data: sessionResponse, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_ref", userResponse.id)
      .eq("is_active", true)
      .single();

    if (sessionError || !sessionResponse) {
      return NextResponse.json(
        { status: "error", error: "Invalid or inactive session" },
        { status: 400 }
      );
    }

    // Check for assistant response
    const { data: chatMessages, error: chatError } = await supabase
      .from("chats")
      .select("id, role, message, word_document, excel_file, forms")
      .eq("chat_session_ref", sessionId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (chatError || !chatMessages) {
      return NextResponse.json({ status: "pending" }, { status: 200 });
    }

    return NextResponse.json(
      {
        status: "completed",
        message: chatMessages.message,
        wordDocument: chatMessages.word_document,
        excelFile: chatMessages.excel_file,
        forms: chatMessages.forms || [],
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in check-response:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", error: errorMessage },
      { status: 500 }
    );
  }
}
