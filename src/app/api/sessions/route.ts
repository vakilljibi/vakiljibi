import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

interface SessionRequest {
  clerkId: string;
  action?: "new_session" | "activate_session";
  sessionId?: string;
}

interface SessionResponse {
  sessionId?: string;
  activeSession?: { sessionId: string };
  sessions?: { sessionId: string; createdAt: string; isActive: boolean }[];
  error?: string;
}

interface SupabaseUser {
  id: string;
}

interface SupabaseSession {
  id: string;
  created_at: string;
  is_active: boolean;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<SessionResponse>> {
  try {
    // Authenticate user with Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SessionRequest = await req.json();

    if (!body.clerkId || body.clerkId !== user.id) {
      return NextResponse.json(
        { error: "Invalid or missing clerkId" },
        { status: 403 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_KEY || ""
    );

    // Get or create user
    let userResponse: SupabaseUser | null = null;

    // First try to get existing user
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerkId", body.clerkId)
      .single();

    if (userError || !existingUser) {
      // Create new user if not found
      const currentTime = new Date().toISOString();
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          telegram_id: null,
          is_answer_in_progress: null,
          usage_this_month: 0,
          usage_total: 0,
          is_blocked: false,
          clerkId: body.clerkId,
          created_at: currentTime,
          updated_at: currentTime,
        })
        .select("id")
        .single();

      if (createError || !newUser) {
        throw new Error(createError?.message || "Failed to create user");
      }
      userResponse = newUser;
    } else {
      userResponse = existingUser;
    }

    const userId = userResponse.id;

    if (body.action === "new_session") {
      // Deactivate existing active sessions
      const { error: deactivateError } = await supabase
        .from("chat_sessions")
        .update({ is_active: false })
        .eq("user_ref", userId)
        .eq("is_active", true);

      if (deactivateError) {
        throw new Error(deactivateError.message);
      }

      // Create new session
      const { data: newSession, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          user_ref: userId,
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (sessionError || !newSession) {
        throw new Error(sessionError?.message || "Failed to create session");
      }

      return NextResponse.json({ sessionId: newSession.id }, { status: 200 });
    } else if (body.action === "activate_session") {
      if (!body.sessionId) {
        return NextResponse.json(
          { error: "Missing sessionId" },
          { status: 400 }
        );
      }

      // Deactivate existing active sessions
      const { error: deactivateError } = await supabase
        .from("chat_sessions")
        .update({ is_active: false })
        .eq("user_ref", userId)
        .eq("is_active", true);

      if (deactivateError) {
        throw new Error(deactivateError.message);
      }

      // Activate the specified session
      const { error: activateError } = await supabase
        .from("chat_sessions")
        .update({ is_active: true })
        .eq("id", body.sessionId)
        .eq("user_ref", userId);

      if (activateError) {
        throw new Error(activateError.message || "Failed to activate session");
      }

      return NextResponse.json({ sessionId: body.sessionId }, { status: 200 });
    }

    // Fetch all sessions for the user
    const { data: sessions, error: sessionsError } = await supabase
      .from("chat_sessions")
      .select("id, created_at, is_active")
      .eq("user_ref", userId)
      .order("created_at", { ascending: false });

    if (sessionsError) {
      throw new Error(sessionsError.message || "Failed to fetch sessions");
    }

    // Map sessions to the expected format
    const formattedSessions = sessions.map((session: SupabaseSession) => ({
      sessionId: session.id,
      createdAt: session.created_at,
      isActive: session.is_active,
    }));

    // Find active session
    const activeSession = sessions.find(
      (session: SupabaseSession) => session.is_active
    );

    return NextResponse.json(
      {
        sessions: formattedSessions,
        activeSession: activeSession
          ? { sessionId: String(activeSession.id) }
          : undefined,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in sessions POST:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest
): Promise<NextResponse<SessionResponse>> {
  try {
    // Authenticate user with Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkId = req.nextUrl.searchParams.get("clerkId");
    if (!clerkId || clerkId !== user.id) {
      return NextResponse.json(
        { error: "Invalid or missing clerkId" },
        { status: 403 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_KEY || ""
    );

    // Check if user exists or create new user
    let userResponse: SupabaseUser | null = null;
    const currentTime = new Date().toISOString();

    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerkId", clerkId)
      .single();

    if (userError || !existingUser) {
      // Create new user with specified columns
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          telegram_id: null,
          is_answer_in_progress: null,
          usage_this_month: 0,
          usage_total: 0,
          is_blocked: false,
          clerkId: clerkId,
          updated_at: currentTime,
          created_at: currentTime,
        })
        .select("id")
        .single();

      if (createError || !newUser) {
        throw new Error(createError?.message || "Failed to create user");
      }
      userResponse = newUser;
    } else {
      userResponse = existingUser;
    }

    const userId = userResponse.id;

    // Fetch latest 4 sessions for the user
    const { data: sessions, error: sessionsError } = await supabase
      .from("chat_sessions")
      .select("id, created_at, is_active")
      .eq("user_ref", userId)
      .order("created_at", { ascending: false })
      .limit(4);

    if (sessionsError) {
      throw new Error(sessionsError.message || "Failed to fetch sessions");
    }

    // Create new session if none exists
    if (!sessions || sessions.length === 0) {
      const { data: newSession, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          user_ref: userId,
          is_active: true,
          created_at: currentTime,
        })
        .select("id, created_at, is_active")
        .single();

      if (sessionError || !newSession) {
        throw new Error(sessionError?.message || "Failed to create session");
      }
      sessions.push(newSession);
    }

    // Map sessions to the expected format
    const formattedSessions = sessions.map((session: SupabaseSession) => ({
      sessionId: session.id,
      createdAt: session.created_at,
      isActive: session.is_active,
    }));

    // Find active session
    const activeSession = sessions.find(
      (session: SupabaseSession) => session.is_active
    );

    return NextResponse.json(
      {
        sessions: formattedSessions,
        activeSession: activeSession
          ? { sessionId: String(activeSession.id) }
          : undefined,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in sessions GET:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
