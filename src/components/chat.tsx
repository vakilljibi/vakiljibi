"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { handleFileUpload } from "../utils/handleFileUpload"; // Adjust path based on your project structure
import { useUser } from "@clerk/nextjs";
import {
  ThemeProvider,
  createTheme,
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Collapse,
  Input,
  LinearProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import MicIcon from "@mui/icons-material/Mic";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import MicRecorder from "mic-recorder-to-mp3";
import { keyframes } from "@mui/system";
import { Document, Packer, Paragraph, TextRun } from "docx";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import ChatList from "./ChatList";
import { parseMessageContent } from "../utils/parseMessage";

// Interface for messages in the UI
interface Message {
  role: string;
  content: string;
}

// Interface for word_document
interface WordDocument {
  title: string;
  content: string;
}

// Interface for messages from /api/chats
interface ChatMessage {
  id: string;
  role: string;
  message: string;
  word_document?: string | null;
  excel_file?: string | null;
  forms?: string[] | null;
  created_at: string;
}

// Interface for /api/check-response response
interface ChatResponse {
  status: "pending" | "completed" | "processing";
  message?: string;
  wordDocument?: string | null;
  excelFile?: string | null;
  forms?: string[] | null;
  error?: string;
}

// Interface for parsed excel_file
interface ExcelFile {
  laws: Array<{
    ID: string;
    Title: string;
    Subcategory: string;
    Content: string;
  }>;
  courtRulings: Array<{
    ID: string;
    Title: string;
    RulingGroup: string;
    Title1: string;
    Text1: string;
    Title2: string;
    Text2: string;
    SourceURL: string;
  }>;
  terms: Array<{ Term: string; Definition: string }>;
  forms: Array<{ Title: string; Content: string; URL: string }>;
}

const heartbeat = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

// Modern, professional theme
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "rgb(252, 202, 71)",
    },
    background: {
      default: "rgb(18, 18, 32)",
      paper: "rgb(47, 53, 70)",
    },
    text: {
      primary: "rgb(236, 236, 236)",
      secondary: "rgba(236, 236, 236, 0.7)",
    },
    divider: "rgba(236, 236, 236, 0.12)",
    userMessage: {
      main: "rgb(252, 202, 71)",
      contrastText: "rgb(18, 18, 32)",
    },
    assistantMessage: {
      main: "rgb(47, 53, 70)",
      contrastText: "rgb(236, 236, 236)",
    },
    error: {
      main: "rgb(255, 99, 71)", // Tomato color for errors
    },
    success: {
      main: "#4caf50", // Green color for success
    },
  },
  typography: {
    fontFamily: "'B Nazanin', Arial, sans-serif",
    fontSize: 16,
    h5: {
      fontWeight: 700,
      fontSize: "1.5rem",
      "@media (max-width:600px)": {
        fontSize: "1.25rem",
      },
    },
    body1: {
      lineHeight: 1.7,
      fontSize: "1rem",
      "@media (max-width:600px)": {
        fontSize: "0.95rem",
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 600,
          padding: "8px 22px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
            filter: "brightness(1.1)",
          },
          "&.Mui-disabled": {
            backgroundColor: "rgba(47, 53, 70, 0.7)",
            color: "rgba(236, 236, 236, 0.4)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "rgb(47, 53, 70)",
            "& fieldset": {
              border: "none",
            },
            "&:hover fieldset": {
              border: "none",
            },
            "&.Mui-focused fieldset": {
              border: "none",
            },
            "& input": {
              textAlign: "right",
              fontFamily: "'B Nazanin', Arial, sans-serif",
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: "50%", // Make all IconButtons circular by default
          "&:hover": {
            backgroundColor: "rgba(47, 53, 70, 0.8)",
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          height: "8px",
        },
      },
    },
  },
  direction: "rtl",
});

declare module "@mui/material/styles" {
  interface Palette {
    userMessage: Palette["primary"];
    assistantMessage: Palette["primary"];
    error: Palette["primary"];
  }
  interface PaletteOptions {
    userMessage?: PaletteOptions["primary"];
    assistantMessage?: PaletteOptions["primary"];
    error?: PaletteOptions["primary"];
  }
}

function Chat() {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [wordDocument, setWordDocument] = useState<WordDocument | null>(null);
  const [excelFile, setExcelFile] = useState<ExcelFile | null>(null);
  const [forms, setForms] = useState<string[]>([]);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MicRecorder | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const handleSendRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const handleVoiceUploadRef = useRef<
    ((file: File) => Promise<void>) | undefined
  >(undefined);
  console.log(forms);

  const isSystemMessage = (content: string) =>
    content.startsWith("📄") ||
    content.startsWith("📊") ||
    content.startsWith("📑") ||
    content.startsWith("🚫") ||
    content.includes("دانلود شد") ||
    content.includes("خطا:");

  const isValidUrl = (url: string) =>
    typeof url === "string" && url.startsWith("http");

  const sanitizeXmlContent = (content: string) => {
    return content
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
      .replace(/[^\u0020-\u007E\u00A0-\uFFFF]/g, "")
      .replace(/[\uD800-\uDFFF]/g, "");
  };

  const sanitizeFilename = (filename: string) => {
    return (
      filename
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, "_")
        .trim() || "فرم"
    );
  };

  useEffect(() => {
    recorderRef.current = new MicRecorder({ bitRate: 128 });
    return () => {
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (isLoading || isPolling) {
      timerRef.current = setInterval(() => {
        setLoadingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setLoadingSeconds(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, isPolling]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const fetchMessages = useCallback(async (sessId: string) => {
    try {
      const response = await fetch(
        `/api/chats?sessionId=${encodeURIComponent(sessId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch chats: HTTP ${response.status}`
        );
      }

      const data: { messages: ChatMessage[] } = await response.json();
      const uiMessages = data.messages.map((msg) => ({
        role: msg.role,
        content: msg.message,
      }));
      setMessages(uiMessages);

      const lastAssistantMessage = data.messages
        .filter(
          (msg) => msg.role === "assistant" && !isSystemMessage(msg.message)
        )
        .slice(-1)[0];
      if (lastAssistantMessage) {
        try {
          setWordDocument(
            lastAssistantMessage.word_document
              ? JSON.parse(lastAssistantMessage.word_document)
              : null
          );
          setExcelFile(
            lastAssistantMessage.excel_file
              ? JSON.parse(lastAssistantMessage.excel_file)
              : null
          );
          const rawForms = lastAssistantMessage.forms || [];
          const validForms = Array.isArray(rawForms)
            ? rawForms.filter(isValidUrl)
            : [];
          if (validForms.length < rawForms.length) {
            console.warn("Invalid forms filtered out:", rawForms);
          }
          setForms(validForms);
        } catch (e) {
          console.error("Error parsing JSON data:", e);
          setError("خطا در تجزیه داده‌های فایل از پایگاه داده.");
        }
      } else {
        setWordDocument(null);
        setExcelFile(null);
        setForms([]);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "خطای ناشناخته";
      console.error("Error fetching messages:", errorMessage);
      setError(`خطا در بارگذاری پیام‌ها: ${errorMessage}`);
    }
  }, []);

  const checkResponse = useCallback(async (sessId: string) => {
    try {
      const response = await fetch(
        `/api/check-response?sessionId=${encodeURIComponent(sessId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to check response: HTTP ${response.status}`
        );
      }

      const data: ChatResponse = await response.json();
      if (data.status === "completed") {
        const assistantMessage = {
          role: "assistant",
          content: data.message || "",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        try {
          setWordDocument(
            data.wordDocument ? JSON.parse(data.wordDocument) : null
          );
          setExcelFile(data.excelFile ? JSON.parse(data.excelFile) : null);
          const rawForms = data.forms || [];
          const validForms = Array.isArray(rawForms)
            ? rawForms.filter(isValidUrl)
            : [];
          if (validForms.length < rawForms.length) {
            console.warn("Invalid forms filtered out:", rawForms);
          }
          setForms(validForms);
        } catch (e) {
          console.error("Error parsing JSON data from check-response:", e);
          setError("خطا در تجزیه داده‌های پاسخ.");
        }
        setIsPolling(false);
        return true;
      }
      return false;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "خطای ناشناخته";
      console.error("Error checking response:", errorMessage);
      setError(`خطا در بررسی پاسخ: ${errorMessage}`);
      return false;
    }
  }, []);
  // --- NEW HELPER FUNCTION TO HANDLE API RESPONSE ---
  const handleApiResponse = useCallback(
    (data: ChatResponse) => {
      if (data.status === "completed") {
        // ... (logic for completed status)
        const assistantMessage = {
          role: "assistant",
          content: data.message || "",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        try {
          setWordDocument(
            data.wordDocument ? JSON.parse(data.wordDocument) : null
          );
          setExcelFile(data.excelFile ? JSON.parse(data.excelFile) : null);
          const rawForms = data.forms || [];
          const validForms = Array.isArray(rawForms)
            ? rawForms.filter(isValidUrl)
            : [];
          setForms(validForms);
        } catch (e) {
          console.error("Error parsing immediate JSON data:", e);
          setError("خطا در تجزیه داده‌های پاسخ.");
        }
      } else if (data.status === "processing") {
        // ... (logic for processing status)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "در حال پردازش درخواست شما... این فرآیند ممکن است تا ۱۰ دقیقه طول بکشد.",
          },
        ]);
        setIsPolling(true);

        let attempts = 0;
        const maxAttempts = 10;
        pollingRef.current = setInterval(async () => {
          if (!sessionId) return;
          attempts += 1;
          console.log(`Polling attempt ${attempts} for session ${sessionId}`);
          const responseReceived = await checkResponse(sessionId);
          if (responseReceived || attempts >= maxAttempts) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setIsPolling(false);
            if (!responseReceived && attempts >= maxAttempts) {
              setError("پاسخ در زمان مورد انتظار دریافت نشد.");
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: "🚫 خطا: پاسخ در زمان مورد انتظار دریافت نشد.",
                },
              ]);
            }
          }
        }, 60000);
      }
    },
    [sessionId, checkResponse]
  ); // Its dependencies are sessionId and checkResponse
  const createNewSession = useCallback(async (clerkId: string) => {
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId, action: "new_session" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create new session");
      }

      const data = await response.json();
      return data.sessionId;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "خطای ناشناخته";
      console.error("Error creating new session:", errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const activateSession = useCallback(
    async (clerkId: string, sessId: string) => {
      try {
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId,
            action: "activate_session",
            sessionId: sessId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to activate session");
        }

        const data = await response.json();
        return data.sessionId;
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "خطای ناشناخته";
        console.error("Error activating session:", errorMessage);
        throw new Error(errorMessage);
      }
    },
    []
  );

  const handleActiveSession = useCallback(
    (activeSessionId: string | null) => {
      setSessionId(activeSessionId);
      if (activeSessionId) {
        fetchMessages(activeSessionId);
      } else {
        setMessages([]);
        setWordDocument(null);
        setExcelFile(null);
        setForms([]);
        setInput("");
        setFileContent(null);
      }
    },
    [fetchMessages]
  );

  const handleStartRecording = useCallback(async () => {
    if (recorderRef.current) {
      try {
        setInput("");
        setFileContent(null);
        await recorderRef.current.start();
        setIsRecording(true);
        console.log("Recording started");
      } catch {
        setError("دسترسی به میکروفون رد شد یا خطایی رخ داد.");
      }
    }
  }, []);

  type StopRecordingHandler = (save: boolean) => Promise<void>;

  const handleVoiceUpload = useCallback(
    async (file: File) => {
      if (!user?.id || !sessionId) {
        setError("کاربر احراز هویت نشده است یا جلسه فعال یافت نشد.");
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "در حال پردازش فایل صوتی..." },
      ]);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

        if (file.size > 2 * 1024 * 1024) {
          throw new Error("فایل صوتی باید کمتر از ۲ مگابایت باشد.");
        }

        const response = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio: audioBase64,
            clerkId: user.id,
            sessionId,
            mimeType: file.type || "audio/mp3",
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to process audio");
        }

        const transcribedText = data.message;
        const userMessage = { role: "user", content: transcribedText };
        setMessages((prev) => [...prev, userMessage]);

        await activateSession(user.id, sessionId);

        const legalResponse = await fetch("/api/legal-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            text: transcribedText,
            sessionId,
          }),
        });

        const responseText = await legalResponse.text();
        console.log(
          `Legal query API response: ${responseText.substring(
            0,
            50
          )}..., status: ${legalResponse.status}`
        );

        if (!legalResponse.ok && legalResponse.status !== 202) {
          // Allow 202 to pass through
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            throw new Error(
              `Failed to initiate legal query: HTTP ${legalResponse.status}`
            );
          }
          throw new Error(
            errorData.error ||
              `Failed to initiate legal query: HTTP ${legalResponse.status}`
          );
        }

        const legalData: ChatResponse = JSON.parse(responseText);
        console.log("Parsed API response:", legalData);

        // Use the helper function to handle the response
        handleApiResponse(legalData);
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : "An unknown error occurred";
        console.error("Failed to process voice upload:", errorMessage);
        setError(`خطا در پردازش فایل صوتی: ${errorMessage}`);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `🚫 خطا: ${errorMessage}` },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [user, sessionId, activateSession, handleApiResponse] // Add the helper to dependencies
  );

  useEffect(() => {
    handleVoiceUploadRef.current = handleVoiceUpload;
  }, [handleVoiceUpload]);

  const handleStopRecording: StopRecordingHandler = useCallback(
    async (save: boolean) => {
      if (recorderRef.current) {
        try {
          const [, blob] = await recorderRef.current.stop().getMp3();
          console.log("Recording stopped, blob size:", blob.size);
          setIsRecording(false);
          if (save && handleVoiceUploadRef.current) {
            setIsProcessing(true);
            const audioFile = new File([blob], `recording_${Date.now()}.mp3`, {
              type: "audio/mp3",
            });
            console.log("Audio file created:", audioFile.name, audioFile.size);
            await handleVoiceUploadRef.current(audioFile);
          }
        } catch {
          setError("خطا در ضبط صدا.");
        } finally {
          setIsRecording(false);
          setIsProcessing(false);
        }
      }
    },
    []
  );

  type SendHandler = () => Promise<void>;

  const handleSend: SendHandler = useCallback(async () => {
    if (isRecording) {
      console.log("handleSend ignored: Recording in progress");
      await handleStopRecording(true);
      return;
    }
    if (!input.trim() && fileContent === null) {
      console.log("Validation failed: No input or file content");
      setError("لطفاً متن پرس‌وجو یا فایل را وارد کنید.");
      setIsProcessing(false);
      return;
    }
    if (!user?.id) {
      console.log("Validation failed: No user ID");
      setError("کاربر احراز هویت نشده است.");
      setIsProcessing(false);
      return;
    }
    if (!sessionId) {
      console.log("Validation failed: No session ID");
      setError("جلسه فعال یافت نشد. لطفاً یک جلسه جدید ایجاد کنید.");
      setIsProcessing(false);
      return;
    }
    if (isProcessing || isLoading || isPolling) {
      console.log("Send action ignored: Already processing");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const messageContent = input.trim()
      ? `${input}${fileContent ? `\n\nمحتوای فایل:\n${fileContent}` : ""}`
      : `محتوای فایل:\n${fileContent ?? ""}`;

    setMessages((prev) => [...prev, { role: "user", content: messageContent }]);
    // Clear input immediately for better UX
    setInput("");
    setFileContent(null);

    try {
      await activateSession(user.id, sessionId);

      const response = await fetch("/api/legal-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          text: messageContent,
          sessionId,
        }),
      });

      const responseText = await response.text();
      console.log(
        `Legal query API response: ${responseText.substring(
          0,
          50
        )}..., status: ${response.status}`
      );

      if (!response.ok && response.status !== 202) {
        // Allow 202 to pass through
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          throw new Error(
            `Failed to initiate legal query: HTTP ${response.status}`
          );
        }
        throw new Error(
          errorData.error ||
            `Failed to initiate legal query: HTTP ${response.status}`
        );
      }

      const data: ChatResponse = JSON.parse(responseText);
      console.log("Parsed API response:", data);

      // Use the helper function to handle the response
      handleApiResponse(data);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred";
      console.error("خطا در ارسال پیام:", errorMessage);
      setError(`خطا: ${errorMessage}`);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `🚫 خطا: ${errorMessage}` },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [
    user,
    sessionId,
    input,
    fileContent,
    isProcessing,
    isLoading,
    isPolling,
    isRecording,
    activateSession,
    handleStopRecording,
    handleApiResponse, // Add the helper to dependencies
  ]);

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  const handleNewChat = useCallback(async () => {
    if (!user?.id) {
      setError("کاربر احراز هویت نشده است.");
      return;
    }

    setIsLoading(true);
    try {
      const newSessionId = await createNewSession(user.id);
      setMessages([]);
      setSessionId(newSessionId);
      setWordDocument(null);
      setExcelFile(null);
      setForms([]);
      setInput("");
      setFileContent(null);
      setMessages([
        {
          role: "assistant",
          content:
            "جلسه جدید شروع شد! 🌟 لطفاً سؤال حقوقی خود را به صورت واضح مطرح کنید.",
        },
      ]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "خطای ناشناخته";
      console.error("خطا در ایجاد چت جدید:", errorMessage);
      setError(`خطا در ایجاد چت جدید: ${errorMessage}`);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `🚫 خطا: ${errorMessage}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [user, createNewSession]);

  const handleSessionSelect = useCallback(
    async (selectedSessionId: string) => {
      if (!user?.id) {
        setError("کاربر احراز هویت نشده است.");
        return;
      }

      setIsLoading(true);
      try {
        setMessages([]);
        setSessionId(selectedSessionId);
        setShowHistory(false);
        setInput("");
        setFileContent(null);
        await fetchMessages(selectedSessionId);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "خطای ناشناخته";
        console.error("خطا در دریافت تاریخچه جلسه:", errorMessage);
        setError(`خطا در بارگذاری تاریخچه چت: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    },
    [user, fetchMessages]
  );

  const handleExportToWord = useCallback(async () => {
    const latestAssistantMessage = messages
      .filter(
        (msg) => msg.role === "assistant" && !isSystemMessage(msg.content)
      )
      .slice(-1)[0];
    if (!latestAssistantMessage) {
      setError("پاسخ دستیار برای صدور به ورد در دسترس نیست.");
      return;
    }

    try {
      setIsDownloading(true);
      const sanitizedContent = sanitizeXmlContent(
        latestAssistantMessage.content
      );
      const { title, paragraphs, separator, footer } =
        parseMessageContent(sanitizedContent);

      const docParagraphs = [];

      if (title) {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 36,
                font: "B Nazanin",
                rightToLeft: true,
              }),
            ],
            heading: "Heading1",
            alignment: "center",
            spacing: { after: 200 },
          })
        );
      }

      paragraphs.forEach((para: string) => {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para,
                size: 24,
                font: "B Nazanin",
                rightToLeft: true,
              }),
            ],
            alignment: "right",
            spacing: { before: 100, after: 100 },
          })
        );
      });

      if (separator) {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: separator,
                size: 24,
                font: "B Nazanin",
                rightToLeft: true,
                color: "808080",
              }),
            ],
            alignment: "center",
            spacing: { before: 200, after: 200 },
          })
        );
      }

      if (footer) {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: footer,
                size: 24,
                font: "B Nazanin",
                rightToLeft: true,
                italics: true,
                color: "808080",
              }),
            ],
            alignment: "center",
            spacing: { before: 200 },
          })
        );
      }

      const doc = new Document({
        sections: [
          {
            properties: { page: { margin: { right: 720, left: 720 } } },
            children: docParagraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `پاسخ هوش مصنوعی_${Date.now()}.docx`);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "📄 پاسخ حقوقی به فایل ورد صادر شد. فایل را بررسی کنید.",
        },
      ]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "خطای ناشناخته";
      console.error("خطا در صدور فایل ورد:", errorMessage);
      setError(`خطا در صدور فایل ورد: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  }, [messages]);

  const handleExportToExcel = useCallback(async () => {
    if (!excelFile) {
      setError("فایل اکسل در دسترس نیست.");
      return;
    }

    try {
      setIsDownloading(true);
      const wb = XLSX.utils.book_new();

      const lawsData = excelFile.laws.map((law) => ({
        شناسه: law.ID,
        عنوان: law.Title,
        دسته‌بندی: law.Subcategory,
        محتوا: law.Content,
      }));
      const lawsSheet = XLSX.utils.json_to_sheet(lawsData);
      XLSX.utils.book_append_sheet(wb, lawsSheet, "قوانین");

      const courtRulingsData = excelFile.courtRulings.map((ruling) => ({
        شناسه: ruling.ID,
        عنوان: ruling.Title,
        "گروه حکمی": ruling.RulingGroup,
        "عنوان ۱": ruling.Title1,
        "متن ۱": ruling.Text1,
        "عنوان ۲": ruling.Title2,
        "متن ۲": ruling.Text2,
        منبع: ruling.SourceURL,
      }));
      const courtRulingsSheet = XLSX.utils.json_to_sheet(courtRulingsData);
      XLSX.utils.book_append_sheet(wb, courtRulingsSheet, "احکام قضایی");

      const termsData = excelFile.terms.map((term) => ({
        اصطلاح: term.Term,
        تعریف: term.Definition,
      }));
      const termsSheet = XLSX.utils.json_to_sheet(termsData);
      XLSX.utils.book_append_sheet(wb, termsSheet, "اصطلاحات");

      const formsData = excelFile.forms.map((form) => ({
        عنوان: form.Title,
        محتوا: form.Content,
        لینک: form.URL,
      }));
      const formsSheet = XLSX.utils.json_to_sheet(formsData);
      XLSX.utils.book_append_sheet(wb, formsSheet, "فرم‌ها");

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      saveAs(blob, `منابع استفاده شده_${Date.now()}.xlsx`);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "📊 منابع حقوقی به فایل اکسل صادر شد. فایل را بررسی کنید.",
        },
      ]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "خطای ناشناخته";
      console.error("خطا در صدور فایل اکسل:", errorMessage);
      setError(`خطا در صدور فایل اکسل: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  }, [excelFile]);

  const handleDownloadForms = useCallback(async () => {
    if (!excelFile?.forms?.length && !wordDocument) {
      setError("فرم‌های حقوقی یا فرم سفارشی در دسترس نیستند.");
      return;
    }

    try {
      setIsDownloading(true);
      let successfulDownloads = 0;
      const zip = new JSZip();
      const timestamp = Date.now();

      if (wordDocument) {
        const sanitizedContent = sanitizeXmlContent(wordDocument.content);
        const { title, paragraphs, separator, footer } =
          parseMessageContent(sanitizedContent);

        const docParagraphs = [];

        if (title) {
          docParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  size: 36,
                  font: "B Nazanin",
                  rightToLeft: true,
                }),
              ],
              heading: "Heading1",
              alignment: "center",
              spacing: { after: 200 },
            })
          );
        }

        paragraphs.forEach((para: string) => {
          docParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: para,
                  size: 24,
                  font: "B Nazanin",
                  rightToLeft: true,
                }),
              ],
              alignment: "right",
              spacing: { before: 100, after: 100 },
            })
          );
        });

        if (separator) {
          docParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: separator,
                  size: 24,
                  font: "B Nazanin",
                  rightToLeft: true,
                  color: "808080",
                }),
              ],
              alignment: "center",
              spacing: { before: 200, after: 200 },
            })
          );
        }

        if (footer) {
          docParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: footer,
                  size: 24,
                  font: "B Nazanin",
                  rightToLeft: true,
                  italics: true,
                  color: "808080",
                }),
              ],
              alignment: "center",
              spacing: { before: 200 },
            })
          );
        }

        const doc = new Document({
          sections: [
            {
              properties: { page: { margin: { right: 720, left: 720 } } },
              children: docParagraphs,
            },
          ],
        });

        const blob = await Packer.toBlob(doc);
        const sanitizedTitle = sanitizeFilename(
          wordDocument.title || "فرم سفارشی"
        );
        zip.file(`${sanitizedTitle}_${timestamp}.docx`, blob);
        successfulDownloads++;
      }

      if (excelFile?.forms?.length) {
        for (let i = 0; i < excelFile.forms.length; i++) {
          const form = excelFile.forms[i];
          const sanitizedTitle = sanitizeFilename(form.Title || `فرم_${i + 1}`);

          if (form.URL && isValidUrl(form.URL)) {
            try {
              console.log("Fetching form from URL:", form.URL);
              const response = await fetch(form.URL);
              if (!response.ok) {
                throw new Error(
                  `Failed to fetch form from ${form.URL}: ${response.statusText}`
                );
              }
              const blob = await response.blob();
              zip.file(`${sanitizedTitle}_${timestamp}.docx`, blob);
              successfulDownloads++;
            } catch (e) {
              console.warn(
                `Failed to fetch form ${form.Title} from URL, falling back to Content:`,
                e
              );
              if (form.Content) {
                const sanitizedContent = sanitizeXmlContent(form.Content);
                const { title, paragraphs, separator, footer } =
                  parseMessageContent(sanitizedContent);

                const docParagraphs = [];

                if (title) {
                  docParagraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: title,
                          bold: true,
                          size: 36,
                          font: "B Nazanin",
                          rightToLeft: true,
                        }),
                      ],
                      heading: "Heading1",
                      alignment: "center",
                      spacing: { after: 200 },
                    })
                  );
                }

                paragraphs.forEach((para: string) => {
                  docParagraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: para,
                          size: 24,
                          font: "B Nazanin",
                          rightToLeft: true,
                        }),
                      ],
                      alignment: "right",
                      spacing: { before: 100, after: 100 },
                    })
                  );
                });

                if (separator) {
                  docParagraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: separator,
                          size: 24,
                          font: "B Nazanin",
                          rightToLeft: true,
                          color: "808080",
                        }),
                      ],
                      alignment: "center",
                      spacing: { before: 200, after: 200 },
                    })
                  );
                }

                if (footer) {
                  docParagraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: footer,
                          size: 24,
                          font: "B Nazanin",
                          rightToLeft: true,
                          italics: true,
                          color: "808080",
                        }),
                      ],
                      alignment: "center",
                      spacing: { before: 200 },
                    })
                  );
                }

                const doc = new Document({
                  sections: [
                    {
                      properties: {
                        page: { margin: { right: 720, left: 720 } },
                      },
                      children: docParagraphs,
                    },
                  ],
                });

                const blob = await Packer.toBlob(doc);
                zip.file(`${sanitizedTitle}_${timestamp}.docx`, blob);
                successfulDownloads++;
              } else {
                console.warn(
                  `Form ${form.Title} has no valid Content, skipping.`
                );
              }
            }
          } else if (form.Content) {
            const sanitizedContent = sanitizeXmlContent(form.Content);
            const { title, paragraphs, separator, footer } =
              parseMessageContent(sanitizedContent);

            const docParagraphs = [];

            if (title) {
              docParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: title,
                      bold: true,
                      size: 36,
                      font: "B Nazanin",
                      rightToLeft: true,
                    }),
                  ],
                  heading: "Heading1",
                  alignment: "center",
                  spacing: { after: 200 },
                })
              );
            }

            paragraphs.forEach((para: string) => {
              docParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: para,
                      size: 24,
                      font: "B Nazanin",
                      rightToLeft: true,
                    }),
                  ],
                  alignment: "right",
                  spacing: { before: 100, after: 100 },
                })
              );
            });

            if (separator) {
              docParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: separator,
                      size: 24,
                      font: "B Nazanin",
                      rightToLeft: true,
                      color: "808080",
                    }),
                  ],
                  alignment: "center",
                  spacing: { before: 200, after: 200 },
                })
              );
            }

            if (footer) {
              docParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: footer,
                      size: 24,
                      font: "B Nazanin",
                      rightToLeft: true,
                      italics: true,
                      color: "808080",
                    }),
                  ],
                  alignment: "center",
                  spacing: { before: 200 },
                })
              );
            }

            const doc = new Document({
              sections: [
                {
                  properties: { page: { margin: { right: 720, left: 720 } } },
                  children: docParagraphs,
                },
              ],
            });

            const blob = await Packer.toBlob(doc);
            zip.file(`${sanitizedTitle}_${timestamp}.docx`, blob);
            successfulDownloads++;
          } else {
            console.warn(
              `Form ${form.Title} has no valid URL or Content, skipping.`
            );
          }
        }
      }

      if (successfulDownloads > 0) {
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, `فرم‌های حقوقی_${timestamp}.zip`);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            successfulDownloads > 0
              ? `📑 ${successfulDownloads} فرم حقوقی دانلود شد. فایل‌ها را بررسی کنید.`
              : "🚫 هیچ فرم حقوقی قابل دانلودی یافت نشد.",
        },
      ]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "خطای ناشناخته";
      console.error("خطا در دریافت فرم‌های حقوقی:", errorMessage);
      setError(`خطا در دریافت فرم‌های حقوقی: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  }, [excelFile, wordDocument]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const result = await handleFileUpload(event, setInput, setError);
      if (result) {
        setFileContent(result.text);
        if (event.target) {
          event.target.value = "";
        }
      }
    },
    [setError]
  );

  const handleFileIconClick = useCallback(() => {
    if (fileContent) {
      setFileContent(null);
      setInput("");
    } else {
      fileInputRef.current?.click();
    }
  }, [fileContent]);

  useEffect(() => {
    if (!user?.id) {
      setError("کاربر احراز هویت نشده است.");
      return;
    }

    const init = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/sessions?clerkId=${encodeURIComponent(user.id)}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch sessions");
        }
        const data = await response.json();
        let activeSessionId = data.activeSession
          ? data.activeSession.sessionId
          : null;

        if (!activeSessionId) {
          activeSessionId = await createNewSession(user.id);
          setMessages([
            {
              role: "assistant",
              content:
                "جلسه جدید شروع شد! 🌟 لطفاً سؤال حقوقی خود را به صورت واضح مطرح کنید.",
            },
          ]);
        }
        handleActiveSession(activeSessionId);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "خطای ناشناخته";
        console.error("خطا در راه‌اندازی چت:", errorMessage);
        setError(`خطا در راه‌اندازی چت: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [user, handleActiveSession, createNewSession]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  if (!user) {
    return (
      <Box sx={{ textAlign: "center", color: "text.primary", p: 2 }}>
        <Typography variant="h6">در حال بارگذاری اطلاعات کاربر...</Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          maxWidth: "1000px",
          margin: "20px auto",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#000000",
          borderRadius: "20px",
          p: { xs: 1, sm: 2 }, // Add some padding for mobile
          gap: 2,
          direction: "rtl",
        }}
      >
        {/* =============================================================== */}
        {/* ======================= MODIFIED HEADER ======================= */}
        {/* =============================================================== */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 1 },
          }}
        >
          <Typography variant="h5" color="text.primary">
            وکیل هوش مصنوعی ⚖️
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
              width: { xs: "100%", sm: "auto" },
              order: { xs: 1, sm: 0 }, // Ensure correct visual order on mobile
            }}
          >
            {(isLoading || isPolling) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {loadingSeconds} ثانیه
                </Typography>
                <LinearProgress sx={{ width: "100px" }} />
              </Box>
            )}
            <Button
              variant="contained"
              startIcon={<HistoryIcon sx={{ ml: 1.5, fontWeight: "bold" }} />}
              onClick={() => setShowHistory((prev) => !prev)}
              disabled={isLoading || isPolling || isProcessing || isRecording}
              sx={{
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {showHistory ? "مخفی کردن" : "تاریخچه"}
            </Button>
          </Box>
        </Box>

        <Collapse in={showHistory} sx={{ flexShrink: 0 }}>
          <ChatList
            clerkId={user.id}
            onSessionSelect={handleSessionSelect}
            onActiveSession={handleActiveSession}
            activeSessionId={sessionId}
          />
        </Collapse>

        <Box
          className="messages"
          ref={messagesContainerRef}
          sx={{
            flexGrow: 1,
            maxHeight: "60vh",
            overflowY: "auto",
            p: 2,
            bgcolor: "background.default",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
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
          {messages.length === 0 && (
            <Box sx={{ m: "auto", textAlign: "center" }}>
              <Typography variant="h6" color="text.primary">
                چگونه می‌توانم به شما کمک کنم؟
              </Typography>
              <Typography variant="body1" color="text.secondary">
                سؤال حقوقی خود را مطرح کنید یا فایل/پیام صوتی ارسال کنید!
              </Typography>
            </Box>
          )}
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            const isSystem = isSystemMessage(msg.content);
            const { title, paragraphs, separator, footer } = isSystem
              ? {
                  title: undefined,
                  paragraphs: [msg.content],
                  separator: undefined,
                  footer: undefined,
                }
              : parseMessageContent(msg.content);

            if (isSystem) {
              return (
                <Box
                  key={index}
                  sx={{
                    alignSelf: "center",
                    width: "fit-content",
                    maxWidth: "80%",
                    p: 1.5,
                    textAlign: "center",
                    color: "text.secondary",
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: "12px",
                    fontSize: "0.9rem",
                  }}
                >
                  <Typography variant="body2" component="span">
                    {paragraphs[0]}
                  </Typography>
                </Box>
              );
            }

            return (
              <Box
                key={index}
                sx={{
                  p: 2,
                  borderRadius: "16px",
                  bgcolor: isUser
                    ? "userMessage.main"
                    : "assistantMessage.main",
                  color: isUser
                    ? "userMessage.contrastText"
                    : "assistantMessage.contrastText",
                  maxWidth: "75%",
                  alignSelf: isUser ? "flex-start" : "flex-end",
                  textAlign: "right",
                  boxShadow: "none",
                  border: !isUser
                    ? `1px solid ${theme.palette.divider}`
                    : "none",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", mb: 1, opacity: 0.8 }}
                >
                  {isUser ? "شما" : "وکیل هوش مصنوعی"}:
                </Typography>
                {title && (
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      textAlign: "center",
                      mb: 1,
                      fontFamily: "'B Nazanin', Arial, sans-serif",
                    }}
                  >
                    {title}
                  </Typography>
                )}
                {paragraphs.map((para: string, i: number) => (
                  <Typography
                    key={i}
                    variant="body1"
                    sx={{
                      mb: 1,
                      lineHeight: 1.8,
                      fontFamily: "'B Nazanin', Arial, sans-serif",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {para}
                  </Typography>
                ))}
                {separator && (
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.6,
                      textAlign: "center",
                      my: 1,
                      fontFamily: "'B Nazanin', Arial, sans-serif",
                    }}
                  >
                    {separator}
                  </Typography>
                )}
                {footer && (
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.6,
                      fontStyle: "italic",
                      textAlign: "center",
                      mt: 1,
                      fontFamily: "'B Nazanin', Arial, sans-serif",
                    }}
                  >
                    {footer}
                  </Typography>
                )}
              </Box>
            );
          })}
          <Collapse in={!!error}>
            <Box
              sx={{
                alignSelf: "center",
                width: "fit-content",
                maxWidth: "80%",
                p: 1.5,
                textAlign: "center",
                color: "error.main",
                border: `1px solid ${theme.palette.error.main}`,
                borderRadius: "12px",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography variant="body2" component="span">
                {error}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setError(null)}
                sx={{ color: "error.main" }}
              >
                <CloseIcon fontSize="small" sx={{ fontWeight: "bold" }} />
              </IconButton>
            </Box>
          </Collapse>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
          }}
        >
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (
                e.key === "Enter" &&
                !isProcessing &&
                !isLoading &&
                !isPolling &&
                !isRecording &&
                (input.trim() || fileContent)
              ) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="سؤال خود را اینجا بنویسید..."
            disabled={isLoading || isPolling || isProcessing || isRecording}
            variant="outlined"
            InputProps={{
              sx: { borderRadius: "50px", paddingRight: 1 },
              startAdornment: (
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <IconButton
                    onClick={handleFileIconClick}
                    disabled={
                      isLoading || isPolling || isProcessing || isRecording
                    }
                    sx={{
                      bgcolor: "white",
                      width: 40,
                      height: 40,
                      "&:hover": { bgcolor: "#e0e0e0" },
                    }}
                  >
                    {fileContent ? (
                      <CloseIcon sx={{ color: "black" }} />
                    ) : (
                      <AddIcon sx={{ color: "black" }} />
                    )}
                  </IconButton>

                  {!isRecording ? (
                    <IconButton
                      onClick={handleStartRecording}
                      disabled={isLoading || isPolling || isProcessing}
                      sx={{
                        bgcolor: "white",
                        width: 40,
                        height: 40,
                        "&:hover": { bgcolor: "#e0e0e0" },
                      }}
                    >
                      <MicIcon sx={{ color: "black" }} />
                    </IconButton>
                  ) : (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        onClick={() => handleStopRecording(true)}
                        disabled={isProcessing || isLoading || isPolling}
                        sx={{
                          bgcolor: "success.main",
                          color: "white",
                          width: 40,
                          height: 40,
                          animation: `${heartbeat} 0.8s infinite`,
                          "&:hover": { bgcolor: "success.dark" },
                        }}
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleStopRecording(false)}
                        disabled={isProcessing || isLoading || isPolling}
                        sx={{
                          bgcolor: "error.main",
                          color: "white",
                          width: 40,
                          height: 40,
                          "&:hover": { bgcolor: "error.dark" },
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              ),
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={
              isProcessing ||
              isLoading ||
              isPolling ||
              isRecording ||
              (!input.trim() && fileContent === null)
            }
            color="primary"
            sx={{
              width: 56,
              height: 56,
              flexShrink: 0,
              bgcolor: "primary.main",
              color: "black",
              "&:hover": { bgcolor: "primary.dark" },
              "&.Mui-disabled": { bgcolor: "background.paper" },
            }}
          >
            {isProcessing || isLoading || isPolling ? (
              <CircularProgress size={24} sx={{ color: "text.primary" }} />
            ) : (
              <SendIcon
                sx={{ transform: "rotate(180deg)", fontWeight: "bold" }}
              />
            )}
          </IconButton>
          <Input
            type="file"
            inputRef={fileInputRef}
            sx={{ display: "none" }}
            onChange={handleFileChange}
            inputProps={{
              accept: ".txt,.doc,.docx,.xls,.xlsx",
            }}
          />
        </Box>
        {/* =============================================================== */}
        {/* ================= MODIFIED ACTION BUTTONS ===================== */}
        {/* =============================================================== */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            gap: "20px",
            flexShrink: 1,
            width: "100%",
            flexDirection: { xs: "column", sm: "row" },
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon sx={{ ml: 1.5, fontWeight: "bold" }} />}
            onClick={handleNewChat}
            disabled={
              isLoading ||
              isPolling ||
              isDownloading ||
              isProcessing ||
              isRecording
            }
            sx={{ width: { xs: "100%", sm: "calc(50% - 10px)" } }}
          >
            جلسه جدید
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon sx={{ ml: 1.5, fontWeight: "bold" }} />}
            onClick={handleExportToWord}
            disabled={
              isLoading ||
              isPolling ||
              isDownloading ||
              isProcessing ||
              isRecording ||
              !messages.some(
                (msg) =>
                  msg.role === "assistant" && !isSystemMessage(msg.content)
              )
            }
            sx={{ width: { xs: "100%", sm: "calc(50% - 10px)" } }}
          >
            دانلود پاسخ (Word)
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon sx={{ ml: 1.5, fontWeight: "bold" }} />}
            onClick={handleExportToExcel}
            disabled={
              isLoading ||
              isPolling ||
              isDownloading ||
              isProcessing ||
              isRecording ||
              !excelFile
            }
            sx={{ width: { xs: "100%", sm: "calc(50% - 10px)" } }}
          >
            دانلود منابع (Excel)
          </Button>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon sx={{ ml: 1.5, fontWeight: "bold" }} />}
            onClick={handleDownloadForms}
            disabled={
              isLoading ||
              isPolling ||
              isDownloading ||
              isProcessing ||
              isRecording ||
              (!excelFile?.forms?.length && !wordDocument)
            }
            sx={{ width: { xs: "100%", sm: "calc(50% - 10px)" } }}
          >
            دانلود فرم‌ها
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default memo(Chat);
