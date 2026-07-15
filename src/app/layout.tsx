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

const SITE = "https://shaansatsangi.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Shaan Satsangi · Data & AI Engineer",
  description:
    "Data & AI engineer building autonomous pipelines, lakehouses, and RAG/LLM systems — plus full-stack apps with Next.js and FastAPI. Airflow, Spark, dbt, MCP, and more.",
  keywords: ["Shaan Satsangi", "data engineer", "AI engineer", "LLM", "RAG", "Model Context Protocol", "ML", "analytics", "Airflow", "dbt", "FastAPI", "Python", "SQL", "portfolio"],
  authors: [{ name: "Shaan Satsangi", url: SITE }],
  creator: "Shaan Satsangi",
  alternates: { canonical: SITE },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Shaan Satsangi",
    title: "Shaan Satsangi · Data & AI Engineer",
    description: "Autonomous pipelines, lakehouses & RAG/LLM systems. Pipelines over flashy demos.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Shaan Satsangi — Data & AI Engineer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shaan Satsangi · Data & AI Engineer",
    description: "Autonomous pipelines, lakehouses & RAG/LLM systems. Pipelines over flashy demos.",
    images: ["/og.png"],
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Shaan Satsangi",
  url: SITE,
  image: `${SITE}/me.jpg`,
  jobTitle: "Data & AI Engineer",
  description:
    "Data & AI engineer building autonomous pipelines, lakehouses, and RAG/LLM systems.",
  email: "mailto:shaansatsangi@gmail.com",
  knowsAbout: [
    "Data Engineering",
    "Apache Airflow",
    "Apache Spark",
    "dbt",
    "FastAPI",
    "Machine Learning",
    "Data Analytics",
    "RAG / LLM Systems",
    "Model Context Protocol",
  ],
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
