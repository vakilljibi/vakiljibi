import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes"; // <-- 1. Import Clerk's dark theme
import { faIR } from "@clerk/localizations"; // <-- 2. Import Persian localization
import { FormProvider } from "@/context/FormContext";
import Navbar from "@/components/Navbar";
import ThemeProviderWrapper from "@/components/Themewraper";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "وکیل جیبی - مشاوره حقوقی هوشمند با هوش مصنوعی | ایران",
  description:
    "مشاوره حقوقی فوری با هوش مصنوعی پیشرفته. پاسخ سوالات حقوقی خود را مطابق با قوانین ایران دریافت کنید. وکیل هوشمند در دسترس شما 24/7",
  keywords:
    "مشاوره حقوقی, هوش مصنوعی, وکیل, قوانین ایران, سوالات حقوقی, وکیل جیبی, مشاور حقوقی",
  authors: [{ name: "وکیل جیبی" }],
  openGraph: {
    title: "وکیل جیبی - مشاوره حقوقی هوشمند",
    description:
      "مشاوره حقوقی فوری با هوش مصنوعی پیشرفته مطابق با قوانین ایران",
    type: "website",
    locale: "fa_IR",
    siteName: "وکیل جیبی",
  },
  twitter: {
    card: "summary_large_image",
    title: "وکیل جیبی - مشاوره حقوقی هوشمند",
    description:
      "مشاوره حقوقی فوری با هوش مصنوعی پیشرفته مطابق با قوانین ایران",
  },
  robots: "index, follow",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 3. Add the localization and appearance props to the provider
    <ClerkProvider
      localization={faIR}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "rgb(252, 202, 71)",
          colorText: "rgb(236, 236, 236)",
          colorBackground: "rgb(18, 18, 32)",
        },
        elements: {
          formButtonPrimary: {
            "&:hover": {
              backgroundColor: "rgb(252, 202, 71)",
              filter: "brightness(1.1)",
            },
          },
          userButtonPopoverCard: {
            backgroundColor: "rgb(18, 18, 32)",
            borderColor: "rgba(252, 202, 71, 0.3)",
          },
          userButtonPopoverActionButtonIcon: {
            color: "rgb(252, 202, 71)",
          },
        },
      }}
    >
      <FormProvider>
        <html lang="fa" dir="rtl">
          <head>
            <link rel="icon" href="/favicon.ico" />
            <link
              rel="apple-touch-icon"
              sizes="180x180"
              href="/apple-touch-icon.png"
            />
            <link
              rel="icon"
              type="image/png"
              sizes="32x32"
              href="/favicon-32x32.png"
            />
            <link
              rel="icon"
              type="image/png"
              sizes="16x16"
              href="/favicon-16x16.png"
            />
            <link rel="manifest" href="/site.webmanifest" />
            <meta name="theme-color" content="#000000" />
          </head>
          <body>
            <ThemeProviderWrapper>
              <Navbar />
              {children}
              <Footer />
            </ThemeProviderWrapper>
          </body>
        </html>
      </FormProvider>
    </ClerkProvider>
  );
}
