"use client";

import {
  Box,
  Typography,
  Button,
  Fade,
  Stack,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TelegramIcon from "@mui/icons-material/Telegram";
import GitHubIcon from "@mui/icons-material/GitHub";
import { useUser, useClerk } from "@clerk/nextjs";

interface HeroProps {
  onCallToActionClick: () => void;
  mode: "copywriting" | "chat";
  setMode: (mode: "copywriting" | "chat") => void;
}

// Theme colors for consistency
const brandColors = {
  primary: "rgb(252, 202, 71)",
  textPrimary: "rgb(236, 236, 236)",
  textSecondary: "rgba(236, 236, 236, 0.7)",
  black: "#000000",
};

export default function HeroProfessional({
  onCallToActionClick,
  setMode,
}: HeroProps) {
  const { isSignedIn } = useUser();
  const { openSignUp } = useClerk();

  const handleButtonClick = () => {
    if (isSignedIn) {
      setMode("chat");
      // Small delay to ensure state updates before scrolling
      setTimeout(() => {
        onCallToActionClick();
      }, 100);
    } else {
      openSignUp();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: brandColors.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: { xs: 2, sm: 4, md: 6 },
        direction: "rtl",
        overflow: "hidden",
        position: "relative",
      }}
      id="hero-section"
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column-reverse", md: "row" },
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 4, md: 2 },
          maxWidth: "1200px",
        }}
      >
        {/* Text Content Box */}
        <Box
          sx={{ flex: "1 1 50%", display: "flex", justifyContent: "center" }}
        >
          <Fade in timeout={1000}>
            <Stack
              spacing={3}
              sx={{
                textAlign: { xs: "center", md: "right" },
                maxWidth: "500px",
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "3rem", sm: "4rem", md: "5rem" },
                  fontWeight: 900,
                  color: brandColors.textPrimary,
                }}
              >
                وکیل جیبی
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: "1.5rem", sm: "1.75rem" },
                  fontWeight: "medium",
                  color: brandColors.primary,
                }}
              >
                وکیلت باید توی جیبت باشه
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                  color: brandColors.textSecondary,
                }}
              >
                لطفا سوال حقوقی خود را بپرسید هر چه سوال و ابعاد آن واضح تر باشد
                جواب دریافتی واضح تر است برای دریافت جواب لطفا صبور باشید حداقل
                یک دقیقه و حداکثر پنج دقیقه زمان خواهد برد تا جواب خود را دریافت
                کنید
              </Typography>

              {/* Social Media Icons */}
              <Box
                display={"flex"}
                flexDirection={"row"}
                gap={3}
                sx={{
                  pt: 1,
                  justifyContent: { xs: "center", md: "flex-start" },
                }}
              >
                <IconButton
                  href="https://t.me/vakil_jibi_bot"
                  target="_blank"
                  aria-label="Telegram"
                  sx={{
                    color: "white",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  <TelegramIcon sx={{ fontSize: "2.5rem" }} />
                </IconButton>
                <IconButton
                  href="https://www.youtube.com/@pishnahadebehtar"
                  target="_blank"
                  aria-label="YouTube"
                  sx={{
                    color: "white",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  <YouTubeIcon sx={{ fontSize: "2.5rem" }} />
                </IconButton>
                <IconButton
                  href="https://github.com/pishnahadebehtar/Lawyer_Ai_Agent"
                  target="_blank"
                  aria-label="GitHub"
                  sx={{
                    color: "white",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  <GitHubIcon sx={{ fontSize: "2.5rem" }} />
                </IconButton>
              </Box>

              <Box>
                <Button
                  variant="contained"
                  onClick={handleButtonClick}
                  endIcon={
                    <ArrowBackIcon sx={{ mr: 1.5, fontSize: "1.4rem" }} />
                  }
                  sx={{
                    backgroundColor: brandColors.primary,
                    color: brandColors.black,
                    padding: "12px 30px",
                    borderRadius: "12px",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    textTransform: "none",
                    boxShadow: `0 0 20px ${brandColors.primary}33`,
                    transition: "transform 0.2s ease-in-out",
                    "&:hover": {
                      backgroundColor: brandColors.primary,
                      transform: "scale(1.05)",
                      boxShadow: `0 0 30px ${brandColors.primary}55`,
                    },
                  }}
                >
                  شروع مشاوره
                </Button>
              </Box>
            </Stack>
          </Fade>
        </Box>

        {/* Image Box */}
        <Box
          sx={{
            flex: "1 1 50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Fade in timeout={1500} style={{ transitionDelay: "500ms" }}>
            <Box
              component="img"
              src="/hero2.png"
              alt="AI Legal Assistant Robot"
              sx={{
                width: "100%",
                maxWidth: { xs: "350px", sm: "450px", md: "750px" },
                height: "auto",
                filter: `drop-shadow(0 0 40px ${brandColors.primary}2A)`,
              }}
            />
          </Fade>
        </Box>
      </Box>
    </Box>
  );
}
