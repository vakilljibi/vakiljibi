import { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Interface for messages fetched from /api/chats
interface ApiMessage {
  role: string;
  message: string;
}

// Interface for the response from /api/chats
interface MessagesResponse {
  messages: ApiMessage[];
}

// Interface for sessions fetched from /api/sessions
interface Session {
  sessionId: string;
  createdAt: string;
  isActive: boolean;
  firstPrompt: string;
}

// Interface for the response from /api/sessions
interface SessionResponse {
  sessions: {
    sessionId: string;
    createdAt: string;
    isActive: boolean;
  }[];
  activeSession?: { sessionId: string };
}

// 1. UPDATED PROPS: Added activeSessionId
interface ChatListProps {
  clerkId: string;
  onSessionSelect: (sessionId: string) => void;
  onActiveSession: (sessionId: string | null) => void;
  activeSessionId: string | null;
}

export default function ChatList({
  clerkId,
  onSessionSelect,
  onActiveSession,
  activeSessionId, // Destructure new prop
}: ChatListProps) {
  const theme = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!clerkId) {
        setError("شناسه کاربری یافت نشد.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/sessions?clerkId=${encodeURIComponent(clerkId)}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch sessions: HTTP ${response.status}`);
        }

        const data: SessionResponse = await response.json();
        if (!Array.isArray(data.sessions)) {
          throw new Error("Invalid response format: sessions is not an array");
        }

        const sessionsWithPrompts = await Promise.all(
          data.sessions.map(async (session) => {
            const messagesResponse = await fetch(
              `/api/chats?sessionId=${encodeURIComponent(
                session.sessionId
              )}&limit=1` // Only need the first message, so limit=1
            );
            if (!messagesResponse.ok) {
              return { ...session, firstPrompt: "بدون پیام اولیه" };
            }
            const messagesData: MessagesResponse =
              await messagesResponse.json();
            const firstMessage =
              messagesData.messages?.[0]?.message || "بدون پیام اولیه";

            return {
              ...session,
              firstPrompt:
                firstMessage.length > 50
                  ? firstMessage.substring(0, 47) + "..."
                  : firstMessage,
            };
          })
        );

        // Sort sessions by creation date, newest first
        sessionsWithPrompts.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setSessions(sessionsWithPrompts);
        if (!activeSessionId) {
          onActiveSession(
            data.activeSession ? data.activeSession.sessionId : null
          );
        }
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : "Unknown error occurred";
        console.error("Failed to fetch chat sessions:", errorMessage);
        setError(`خطا در بارگذاری تاریخچه چت‌ها: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [clerkId, onActiveSession, activeSessionId]);

  // 2. SIMPLIFIED LOGIC: No more API calls here
  const handleSessionClick = (sessionId: string) => {
    onSessionSelect(sessionId);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", color: "error.main", p: 2 }}>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.paper,
        borderRadius: "16px",
        border: `1px solid ${theme.palette.divider}`,
        maxHeight: "40vh",
        overflowY: "auto",
        p: 1,
        // 3. IMPROVED STYLING: Custom scrollbar for a professional look
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          borderRadius: "8px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: theme.palette.primary.main,
          borderRadius: "8px",
          border: "2px solid transparent",
          backgroundClip: "content-box",
        },
      }}
    >
      <Typography variant="h6" sx={{ p: 2, pb: 1, textAlign: "center" }}>
        تاریخچه چت‌ها
      </Typography>
      <List>
        {sessions.length === 0 ? (
          <Typography variant="body2" sx={{ textAlign: "center", p: 2 }}>
            هیچ چت‌ای یافت نشد.
          </Typography>
        ) : (
          sessions.map((session) => {
            const isActive = session.sessionId === activeSessionId;
            return (
              <ListItem
                key={session.sessionId}
                onClick={() => handleSessionClick(session.sessionId)}
                sx={{
                  cursor: "pointer",
                  borderRadius: "12px",
                  my: 0.5,
                  transition: "background-color 0.2s ease-in-out",
                  borderRight: isActive
                    ? `4px solid ${theme.palette.primary.main}`
                    : "4px solid transparent",
                  bgcolor: isActive ? "rgba(252, 202, 71, 0.1)" : "transparent",
                  "&:hover": {
                    bgcolor: "rgba(252, 202, 71, 0.2)",
                  },
                }}
              >
                <ListItemText
                  primary={session.firstPrompt}
                  secondary={new Date(session.createdAt).toLocaleString(
                    "fa-IR"
                  )}
                  primaryTypographyProps={{
                    fontWeight: "600",
                    color: theme.palette.text.primary,
                    fontSize: "1rem",
                  }}
                  secondaryTypographyProps={{
                    color: theme.palette.text.secondary,
                    fontSize: "0.8rem",
                  }}
                />
              </ListItem>
            );
          })
        )}
      </List>
    </Box>
  );
}
