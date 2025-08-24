"use client";

import { useState, useEffect } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Box,
  Divider,
  Modal,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

import GavelIcon from "@mui/icons-material/Gavel";
import BalanceIcon from "@mui/icons-material/Balance";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CloseIcon from "@mui/icons-material/Close";

// Consistent brand colors
const brandColors = {
  primary: "rgb(252, 202, 71)",
  background: "rgb(18, 18, 32)",
  text: "rgb(236, 236, 236)",
  black: "#000000",
};

// Download links
const downloadLinks: { [key: string]: string } = {
  "دانلود فرم‌های حقوقی":
    "https://fra.cloud.appwrite.io/v1/storage/buckets/68a743600017fc012fc9/files/68a748ed00244ff357d1/download?project=68968643002bec4aa3b1&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbklkIjoiNjhhNzZlZDhlNGIyYzg5M2QzYjEiLCJyZXNvdXJjZUlkIjoiNjhhNzQzNjAwMDE3ZmMwMTJmYzk6NjhhNzQ4ZWQwMDI0NGZmMzU3ZDEiLCJyZXNvdXJjZVR5cGUiOiJmaWxlcyIsInJlc291cmNlSW50ZXJuYWxJZCI6IjM0NDA4OjQiLCJleHAiOjkuMjIzMzcyMDM4NjEwNThlKzE4fQ.5gARUSMSPPXLVzsQUr8Ca2m_AxAKb0nWp1lyeu6cfwc",
  "دانلود آراء وحدت رویه":
    "https://fra.cloud.appwrite.io/v1/storage/buckets/68a743600017fc012fc9/files/68a744da00226a39f2c5/download?project=68968643002bec4aa3b1&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbklkIjoiNjhhNzZmMDc5MjcwMjVlZTJlNTIiLCJyZXNvdXJjZUlkIjoiNjhhNzQzNjAwMDE3ZmMwMTJmYzk6NjhhNzQ0ZGEwMDIyNmEzOWYyYzUiLCJyZXNvdXJjZVR5cGUiOiJmaWxlcyIsInJlc291cmNlSW50ZXJuYWxJZCI6IjM0NDA4OjIiLCJleHAiOjkuMjIzMzcyMDM4NjEwNThlKzE4fQ.oYKeBqHuGxHrp7abc3fcD57T4bv7pdNdCdmSkUUOb9E",
  "دانلود قوانین کشور":
    "https://fra.cloud.appwrite.io/v1/storage/buckets/68a743600017fc012fc9/files/68a74877002e5c432fe0/download?project=68968643002bec4aa3b1&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbklkIjoiNjhhNzZlZWRjMWQyNzJkZDMwYWIiLCJyZXNvdXJjZUlkIjoiNjhhNzQzNjAwMDE3ZmMwMTJmYzk6NjhhNzQ4NzcwMDJlNWM0MzJmZTAiLCJyZXNvdXJjZVR5cGUiOiJmaWxlcyIsInJlc291cmNlSW50ZXJuYWxJZCI6IjM0NDA4OjMiLCJleHAiOjkuMjIzMzcyMDM4NjEwNThlKzE4fQ.761VW3u441NL6PGemM4gVcuCTnT-hDsFMXm1iqma3ts",
  "دانلود اصطلاحات حقوقی":
    "https://fra.cloud.appwrite.io/v1/storage/buckets/68a743600017fc012fc9/files/68a743c4001f4a37bf0e/download?project=68968643002bec4aa3b1&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbklkIjoiNjhhNzZmMTA1YWFhNGUzMTk2ZjEiLCJyZXNvdXJjZUlkIjoiNjhhNzQzNjAwMDE3ZmMwMTJmYzk6NjhhNzQzYzQwMDFmNGEzN2JmMGUiLCJyZXNvdXJjZVR5cGUiOiJmaWxlcyIsInJlc291cmNlSW50ZXJuYWxJZCI6IjM0NDA4OjEiLCJleHAiOjkuMjIzMzcyMDM4NjEwNThlKzE4fQ.pPvJ184_2A3HHMbwhy-GDu3-1qpm74qyZhuXvsPeeQg",
};

// Menu item type
interface MenuItem {
  text: string;
  icon: React.ReactNode;
}

export default function Navbar() {
  const { isSignedIn } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleMenuItemClick = (text: string) => {
    if (text === "درباره پروژه") {
      setIsAboutOpen(true);
    } else if (downloadLinks[text]) {
      if (isSignedIn) {
        window.open(downloadLinks[text], "_blank");
      } else {
        setIsSignupModalOpen(true);
      }
    }
    setIsSidebarOpen(false);
  };

  const menuItems: MenuItem[] = [
    { text: "درباره پروژه", icon: <InfoIcon /> },
    { text: "دانلود قوانین کشور", icon: <GavelIcon /> },
    { text: "دانلود آراء وحدت رویه", icon: <BalanceIcon /> },
    { text: "دانلود اصطلاحات حقوقی", icon: <DescriptionIcon /> },
    { text: "دانلود فرم‌های حقوقی", icon: <AssignmentIcon /> },
  ];

  // Close sidebar or modal when clicking on backdrop
  useEffect(() => {
    const handleBackdropClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.classList.contains("sidebar-backdrop")) {
        setIsSidebarOpen(false);
      } else if (target.classList.contains("about-backdrop")) {
        setIsAboutOpen(false);
      } else if (target.classList.contains("signup-backdrop")) {
        setIsSignupModalOpen(false);
      }
    };

    document.addEventListener("click", handleBackdropClick);
    return () => document.removeEventListener("click", handleBackdropClick);
  }, [isSidebarOpen, isAboutOpen, isSignupModalOpen]);

  return (
    <>
      <AppBar
        position="static"
        sx={{
          backgroundColor: brandColors.black,
          boxShadow: "none",
          borderBottom: `1px solid ${brandColors.primary}33`,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* Custom Hamburger Icon */}
          <IconButton
            edge="end"
            onClick={toggleSidebar}
            sx={{ color: brandColors.primary }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                className="top-bar"
                y={isSidebarOpen ? "10" : "4"}
                width="24"
                height="2"
                rx="1"
                fill="white"
                style={{
                  transition: "all 0.3s ease",
                  transform: isSidebarOpen
                    ? "rotate(45deg) translate(5px, 5px)"
                    : "none",
                }}
              />
              <rect
                className="middle-bar"
                y="11"
                width="24"
                height="2"
                rx="1"
                fill="white"
                style={{
                  transition: "all 0.3s ease",
                  opacity: isSidebarOpen ? 0 : 1,
                }}
              />
              <rect
                className="bottom-bar"
                y={isSidebarOpen ? "10" : "18"}
                width="24"
                height="2"
                rx="1"
                fill="white"
                style={{
                  transition: "all 0.3s ease",
                  transform: isSidebarOpen
                    ? "rotate(-45deg) translate(5px, -5px)"
                    : "none",
                }}
              />
            </svg>
          </IconButton>
          {/* Clerk buttons */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: brandColors.primary,
                    color: brandColors.black,
                    fontFamily: "'B Nazanin', Arial, sans-serif",
                    fontWeight: "bold",
                    borderRadius: "8px",
                    px: 3,
                    "&:hover": {
                      backgroundColor: brandColors.primary,
                      filter: "brightness(1.1)",
                    },
                  }}
                >
                  ورود / ثبت نام
                </Button>
              </SignInButton>
            </SignedOut>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1299,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: isSidebarOpen ? 0 : "-320px",
          width: "320px",
          height: "100%",
          backgroundColor: brandColors.background,
          color: brandColors.text,
          direction: "rtl",
          borderLeft: `1px solid ${brandColors.primary}55`,
          transition: "right 0.3s ease-in-out",
          zIndex: 1300,
          overflowY: "auto",
        }}
      >
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: "'B Nazanin', Arial, sans-serif",
                fontWeight: "bold",
                color: brandColors.primary,
              }}
            >
              وکیل جیبی
            </Typography>
            <IconButton
              onClick={toggleSidebar}
              sx={{ color: brandColors.primary }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ borderColor: "rgba(252, 202, 71, 0.2)", my: 2 }} />
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                component="li"
                onClick={() => handleMenuItemClick(item.text)}
                sx={{
                  borderRadius: "8px",
                  color: brandColors.text,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: brandColors.primary,
                    color: brandColors.black,
                    "& .MuiListItemIcon-root": {
                      color: brandColors.black,
                    },
                  },
                  mb: 1,
                  transition: "background-color 0.2s, color 0.2s",
                  paddingRight: 2, // Adjusted for RTL alignment
                }}
              >
                <ListItemIcon
                  sx={{
                    color: brandColors.primary,
                    minWidth: 36, // Reduced to tighten spacing
                    transition: "color 0.2s",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontFamily: "'B Nazanin', Arial, sans-serif",
                    fontSize: "1.2rem",
                    fontWeight: "medium",
                    textAlign: "right", // Align Persian text to the right
                    marginLeft: 1, // Small margin for balanced spacing
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </div>

      {/* About Modal */}
      <Modal open={isAboutOpen} onClose={() => setIsAboutOpen(false)}>
        <Box
          className="about-backdrop"
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(5px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1400,
          }}
        >
          <Box
            sx={{
              backgroundColor: brandColors.background,
              color: brandColors.text,
              borderRadius: "12px",
              p: 4,
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              border: `1px solid ${brandColors.primary}33`,
              direction: "rtl",
              position: "relative",
              "&::-webkit-scrollbar": {
                width: "12px", // Wider for better usability
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                borderRadius: "8px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: brandColors.primary,
                borderRadius: "8px",
                border: "3px solid transparent",
                backgroundClip: "content-box",
                "&:hover": {
                  backgroundColor: "rgb(252, 202, 71, 0.8)", // Slightly transparent on hover for feedback
                },
              },
            }}
          >
            <IconButton
              onClick={() => setIsAboutOpen(false)}
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                color: brandColors.primary,
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "'B Nazanin', Arial, sans-serif",
                fontWeight: "bold",
                color: brandColors.primary,
                mb: 2,
              }}
            >
              درباره وکیل جی‌بی
            </Typography>
            <Typography
              sx={{
                fontFamily: "'B Nazanin', Arial, sans-serif",
                fontSize: "1.1rem",
                lineHeight: 1.8,
                color: brandColors.text,
              }}
            >
              سلام دوست عزیز! به ربات وکیل جی‌بی خوش اومدی! 😍💫
              <br />
              من یه ربات باحالم که با عشق و قلب برای کمک به تو در مسائل حقوقی
              ایران طراحی شدم! 💖 این برنامه کاملاً رایگانه و حتی کدش هم متن‌باز
              (open-source) هست، یعنی می‌تونی کد منو دانلود کنی و ببینی چطور کار
              می‌کنم! 🛠️📚
              <br />
              لطفاً سؤالت حقوقی رو با جزئیات و واضح بپرس، مثلاً نپرس «قوانین
              ملکی رو بلدی؟» چون خب، معلومه که بلدم! 😜 سؤالت رو دقیق بپرس،
              مثلاً «برای خرید خونه تو تهران چه مدارکی لازمه؟» اینجوری جوابمم
              دقیق‌تر و به‌دردبخورتر میشه! ✍️
              <br />
              پاسخ من معمولاً ۳ الی ۵ دقیقه طول می‌کشه، چون با کلی عشق و دقت
              برات جواب کامل آماده می‌کنم! 😊 لطفاً تا وقتی جوابت رو نگرفتی،
              پیام جدید نفرست، چون ممکنه سر منو شلوغ کنی و سیستم قاطی کنه! 😅 من
              از یه دیتابیس قوی و هوش مصنوعی پیشرفته استفاده می‌کنم که قوانین،
              احکام قضایی، و فرم‌های حقوقی رو بررسی می‌کنه تا بهترین جواب رو بهت
              بده. اگه پشت سر هم پیام بفرستی، ممکنه درخواست‌ها توی صف تلگرام گیر
              کنن و دیرتر جواب بگیری! ⏳
              <br />
              یه نکته مهم: لطفاً اطلاعات شخصی (مثل اسم، شماره، یا آدرس) رو به
              اشتراک نذار! 🚨 این ربات فقط برای مشاوره عمومیه و تو خودت مسئول
              استفاده از اطلاعات هستی. من فقط می‌خوام بهت کمک کنم که تو مسائل
              حقوقی سردرگم نشی! 💡
              <br />
              از ته قلبم آرزو می‌کنم که مشکلت حل بشه و همیشه لبخند بزنی! 😘 من
              به‌عنوان یه ربات که با کلی کد و عشق ساخته شدم، همیشه این‌جام تا
              بهت کمک کنم. حالا بگو، چه سؤالی داری؟ چطور می‌تونم برات یه ستاره
              تو آسمون حقوقی‌ها باشم؟ 🌟😊
            </Typography>
          </Box>
        </Box>
      </Modal>

      {/* Signup Prompt Modal */}
      <Modal
        open={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      >
        <Box
          className="signup-backdrop"
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(5px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1400,
          }}
        >
          <Box
            sx={{
              backgroundColor: brandColors.background,
              color: brandColors.text,
              borderRadius: "12px",
              p: 4,
              maxWidth: "400px",
              width: "90%",
              border: `1px solid ${brandColors.primary}33`,
              direction: "rtl",
              position: "relative",
              textAlign: "center",
            }}
          >
            <IconButton
              onClick={() => setIsSignupModalOpen(false)}
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                color: brandColors.primary,
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "'B Nazanin', Arial, sans-serif",
                fontWeight: "bold",
                color: brandColors.primary,
                mb: 2,
              }}
            >
              برای دانلود فایل‌ها باید وارد شوید
            </Typography>
            <Typography
              sx={{
                fontFamily: "'B Nazanin', Arial, sans-serif",
                fontSize: "1.1rem",
                lineHeight: 1.8,
                color: brandColors.text,
                mb: 3,
              }}
            >
              لطفاً برای دسترسی به دانلودها، وارد حساب کاربری خود شوید یا
              ثبت‌نام کنید.
            </Typography>
            <SignInButton mode="modal">
              <Button
                variant="contained"
                sx={{
                  backgroundColor: brandColors.primary,
                  color: brandColors.black,
                  fontFamily: "'B Nazanin', Arial, sans-serif",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  px: 4,
                  py: 1.5,
                  "&:hover": {
                    backgroundColor: brandColors.primary,
                    filter: "brightness(1.1)",
                  },
                }}
              >
                ورود / ثبت نام
              </Button>
            </SignInButton>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
