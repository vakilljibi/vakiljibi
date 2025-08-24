"use client";

import { useRef, useState, useEffect } from "react";
import { SignedIn, useUser } from "@clerk/nextjs";
import Hero from "@/components/Hero";
import Chat from "@/components/chat";

export default function Home() {
  const stepperRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"copywriting" | "chat">("copywriting");
  const [shouldScroll, setShouldScroll] = useState(false);
  const { isSignedIn } = useUser();

  // Handle scrolling after mode changes
  useEffect(() => {
    if (!shouldScroll) return;

    const scrollToComponent = () => {
      if (mode === "copywriting" && stepperRef.current) {
        stepperRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (mode === "chat" && chatRef.current) {
        chatRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };

    scrollToComponent();
    setShouldScroll(false); // Reset scroll trigger
  }, [mode, shouldScroll]);

  const handleCallToActionClick = () => {
    if (isSignedIn) {
      setMode("chat");
      setShouldScroll(true); // Trigger scroll after mode change
    }
    // If not signed in, the Hero component handles sign up
  };

  return (
    <>
      <Hero
        onCallToActionClick={handleCallToActionClick}
        mode={mode}
        setMode={setMode}
      />

      <SignedIn>
        <div ref={chatRef}>
          <Chat />
        </div>
      </SignedIn>
    </>
  );
}
