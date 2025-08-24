import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

// Interface for chat messages, reflecting the chats table schema
interface ChatMessage {
  id: string;
  role: string;
  message: string;
  word_document?: string | null;
  excel_file?: string | null;
  forms?: string[];
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sessionId from query parameters
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const limitStr = req.nextUrl.searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr) : null;

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_KEY || ""
    );

    // Fetch user from Supabase using clerkId
    const { data: userResponse, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerkId", user.id)
      .single();

    if (userError || !userResponse) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the session exists and belongs to the user (no is_active check)
    const { data: sessionResponse, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_ref", userResponse.id)
      .single();

    if (sessionError || !sessionResponse) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    // Fetch chat messages, including new columns
    let query = supabase
      .from("chats")
      .select("id, role, message, word_document, excel_file, forms, created_at")
      .eq("chat_session_ref", sessionId);

    if (limit) {
      query = query.order("created_at", { ascending: false }).limit(limit);
    } else {
      query = query.order("created_at", { ascending: true });
    }

    const { data: chats, error: chatError } = await query;

    if (chatError) {
      throw new Error(chatError.message);
    }

    // Return messages in the response
    return NextResponse.json(
      { messages: (chats || []) as ChatMessage[] },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in chats route:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { sessionId, clerkId, role, content } = await req.json();

    // Validate required fields
    if (!sessionId || !clerkId || !role || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_KEY || ""
    );

    // Fetch user from Supabase using clerkId
    const { data: userResponse, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerkId", clerkId)
      .single();

    if (userError || !userResponse) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the session exists and is active
    const { data: sessionResponse, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_ref", userResponse.id)
      .eq("is_active", true)
      .single();

    if (sessionError || !sessionResponse) {
      return NextResponse.json(
        { error: "Invalid or inactive session" },
        { status: 400 }
      );
    }

    // Insert new chat message
    const { data, error: insertError } = await supabase
      .from("chats")
      .insert({
        chat_session_ref: sessionId,
        role,
        message: content,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Return the inserted message
    return NextResponse.json(data as ChatMessage, { status: 201 });
  } catch (error: unknown) {
    console.error("Error in chats route:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
