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

const SITE = "https://shaan-alpha.github.io/Portfolio";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Shaan Satsangi · Data Engineer",
  description:
    "Data engineer building bulletproof pipelines and shipping AI/ML + analytics projects. Airflow, Spark, dbt, FastAPI, and more.",
  keywords: ["Shaan Satsangi", "data engineer", "ML", "analytics", "Airflow", "dbt", "FastAPI", "portfolio"],
  authors: [{ name: "Shaan Satsangi", url: SITE }],
  creator: "Shaan Satsangi",
  alternates: { canonical: SITE },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Shaan Satsangi",
    title: "Shaan Satsangi · Data Engineer",
    description: "Bulletproof pipelines over flashy demos. Data engineering, ML, and analytics.",
    images: [{ url: "/Portfolio/og.png", width: 1200, height: 630, alt: "Shaan Satsangi — Data Engineer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shaan Satsangi · Data Engineer",
    description: "Bulletproof pipelines over flashy demos. Data engineering, ML, and analytics.",
    images: ["/Portfolio/og.png"],
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Shaan Satsangi",
  url: SITE,
  jobTitle: "Data Engineer",
  email: "mailto:shaansatsangi@gmail.com",
  address: { "@type": "PostalAddress", addressLocality: "Jaipur", addressRegion: "Rajasthan", addressCountry: "IN" },
  sameAs: ["https://github.com/Shaan-alpha", "https://linkedin.com/in/shaansatsangi"],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
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
