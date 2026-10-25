import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { profile } from "@/content/profile";

// Variable on both axes: weight for hierarchy, width for voice. One file
// replaces the eight static cuts the previous design shipped.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const SITE = profile.site;
const TITLE = "Shaan Satsangi, AI Systems Engineer";
const OG_ALT = "Shaan Satsangi, AI systems engineer. The model is a component, not the architecture.";
const DESCRIPTION =
  "AI systems engineer and creator of Skill Issue. I build agents and retrieval systems with the guardrails designed in: deterministic scoring, fail-closed checks, and human approval where a mistake would be expensive.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["Shaan Satsangi", "AI systems engineer", "AI engineer", "LangChain", "LangGraph", "AI agents", "agentic AI", "LLM", "RAG", "Model Context Protocol", "Skill Issue", "data engineer", "Airflow", "dbt", "FastAPI", "Python", "SQL", "portfolio"],
  authors: [{ name: profile.name, url: SITE }],
  creator: profile.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: profile.name,
    title: TITLE,
    description: "Agents and retrieval systems where the model is one component, not the architecture. Creator of Skill Issue.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "Agents and retrieval systems where the model is one component, not the architecture. Creator of Skill Issue.",
    images: [{ url: "/og.png", alt: OG_ALT }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eceef1" },
    { media: "(prefers-color-scheme: dark)", color: "#131518" },
  ],
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  url: SITE,
  image: `${SITE}/me.jpg`,
  jobTitle: "AI Systems Engineer",
  description:
    "AI systems engineer and creator of Skill Issue, building multi-agent pipelines, RAG retrieval, and MCP tool-calling, with LangChain and LangGraph in the toolkit.",
  email: `mailto:${profile.email}`,
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
  sameAs: [profile.github, profile.linkedin],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={archivo.variable} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-3 z-[2000] rounded-lg bg-ink px-4 py-3 text-[15px] font-semibold text-ground"
        >
          Skip to content
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
