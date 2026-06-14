import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Preloader from "@/components/Preloader";
import ScrollProgress from "@/components/ScrollProgress";
import CustomCursor from "@/components/CustomCursor";
import SmoothScroll from "@/components/SmoothScroll";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Shaan Satsangi · Portfolio",
  description: "A premium developer portfolio showcasing work in Data Engineering, AI/ML, and Full Stack Development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jetbrains.variable} h-full antialiased no-scrollbar`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <Preloader />
          <ScrollProgress />
          <CustomCursor />
          <SmoothScroll />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
