import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
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
  title: "Shaan Satsangi · AI Systems Engineer",
  description:
    "AI systems engineer and creator of Skill Issue. I build multi-agent pipelines, RAG retrieval, and MCP tool-calling, plus the data pipelines behind them — Python, LangChain, LangGraph, FastAPI, Next.js.",
  keywords: ["Shaan Satsangi", "AI systems engineer", "AI engineer", "LangChain", "LangGraph", "AI agents", "agentic AI", "LLM", "RAG", "Model Context Protocol", "Skill Issue", "data engineer", "Airflow", "dbt", "FastAPI", "Python", "SQL", "portfolio"],
  authors: [{ name: "Shaan Satsangi", url: SITE }],
  creator: "Shaan Satsangi",
  alternates: { canonical: SITE },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Shaan Satsangi",
    title: "Shaan Satsangi · AI Systems Engineer",
    description: "Multi-agent pipelines, RAG retrieval, and MCP tool-calling. Creator of Skill Issue. I build systems, not demos.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Shaan Satsangi — AI Systems Engineer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shaan Satsangi · AI Systems Engineer",
    description: "Multi-agent pipelines, RAG retrieval, and MCP tool-calling. Creator of Skill Issue. I build systems, not demos.",
    images: ["/og.png"],
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Shaan Satsangi",
  url: SITE,
  image: `${SITE}/me.jpg`,
  jobTitle: "AI Systems Engineer",
  description:
    "AI systems engineer and creator of Skill Issue, building multi-agent pipelines, RAG retrieval, and MCP tool-calling, with LangChain and LangGraph in the toolkit.",
  email: "mailto:shaansatsangi@gmail.com",
  knowsAbout: [
    "Agentic AI",
    "LangChain",
    "LangGraph",
    "AI Agents",
    "RAG / LLM Systems",
    "Model Context Protocol",
    "System Design",
    "Machine Learning",
    "PyTorch",
    "FastAPI",
    "Data Engineering",
    "Apache Airflow",
    "Apache Spark",
    "dbt",
    "Data Analytics",
  ],
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Jaipur Engineering College and Research Centre",
    sameAs: "https://www.jecrcfoundation.com/",
  },
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
          <ScrollProgress />
          <CustomCursor />
          <SmoothScroll />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
