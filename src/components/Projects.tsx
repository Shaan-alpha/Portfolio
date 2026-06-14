"use client";

import { motion } from "framer-motion";
import { lookupTech, TechLogo } from "@/lib/techIcons";

type Status = "live" | "shipped" | "building";

type Project = {
  id: string;
  date: string;
  status: Status;
  title: string;
  desc: string;
  tags: string[];
  bullets: string[];
  link?: string;
  liveLink?: string;
};

export default function Projects() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  const projects: Project[] = [
    {
      id: "ai-reel-factory",
      date: "Jun 2026",
      status: "shipped",
      title: "AI Reel Factory — Autonomous Shorts",
      desc: "A near-$0/month autonomous content factory: it researches news, writes scripts, narrates, renders captioned vertical video, and publishes 4–5 YouTube Shorts/day — with one human Telegram tap per day.",
      tags: ["Python", "Gemini", "Supabase", "FFmpeg", "faster-whisper", "edge-tts", "YouTube API", "GitHub Actions"],
      bullets: [
        "Idea→script→voice→captioned-video→publish pipeline orchestrated by GitHub Actions cron; one Telegram 'Morning Digest' approval per day",
        "Gemini (Groq failover) scripting, edge-tts narration, Pexels/Pixabay visuals, FFmpeg assembly, faster-whisper word-by-word captions",
        "Supabase Postgres state; publishes to YouTube @butitmatters at $0/month beyond an existing subscription",
      ],
      link: "https://github.com/Shaan-alpha/AI-Reel-Factory",
      liveLink: "https://youtube.com/@butitmatters",
    },
    {
      id: "skill-issue",
      date: "May 2026",
      status: "live",
      title: "Skill Issue — GitHub Intelligence",
      desc: "An AI-powered GitHub intelligence platform. Drop in a username and it turns repos, OSS contributions, and coding discipline into a deterministic engineering score and shareable receipts.",
      tags: ["Next.js", "FastAPI", "Python", "Neon Postgres", "Upstash Redis", "Groq LLM"],
      bullets: [
        "Deterministic 100-point engineering score across repo quality, maturity, OSS, consistency & recruiter signal — AI only narrates",
        "FastAPI + Next.js with Neon Postgres persistence, GitHub OAuth, and an Upstash Redis warm cache (repeat analysis p95 ≤ 200 ms)",
        "Groq llama-3.3-70b Roast + Mentor narration and shareable 1200×630 'GitHub Receipts' OG scorecards",
      ],
      link: "https://github.com/Shaan-alpha/Skill-Issue",
      liveLink: "https://skill-issue-tau.vercel.app",
    },
    {
      id: "crm-sales",
      date: "Apr 2026",
      status: "shipped",
      title: "CRM + Sales — Data Warehouse",
      desc: "An end-to-end data warehousing project using the Maven Analytics dataset. Built a robust ETL pipeline that cleans and transforms raw CRM data into a structured PostgreSQL warehouse.",
      tags: ["Python", "Apache Airflow", "PostgreSQL", "Power BI", "ETL"],
      bullets: [
        "Architected an automated ETL pipeline with Airflow to ingest and process 10k+ sales records",
        "Designed a star-schema warehouse in PostgreSQL for optimized analytical querying",
        "Surfaced actionable business insights via a dynamic Power BI dashboard focusing on sales performance",
      ],
      link: "https://github.com/Shaan-alpha/CRM-Sales-Warehouse",
    },
    {
      id: "youtube-wrapped",
      date: "May 2025",
      status: "live",
      title: "YouTube Wrapped — Data Pipeline",
      desc: "A personal 'Spotify Wrapped' for YouTube. End-to-end data pipeline that transforms Google Takeout exports into a polished year-in-review analytics dashboard.",
      tags: ["Databricks", "Delta Lake", "FastAPI", "Next.js", "Neon Postgres"],
      bullets: [
        "Medallion lakehouse pipeline (Bronze → Silver → Gold) in Databricks with Delta Lake tables",
        "FastAPI backend on Render serving analytics from Neon Postgres fact tables",
        "Next.js dashboard with animated cards, genre splits, binge sessions & listening rhythm charts",
      ],
      link: "https://github.com/Shaan-alpha/youtube-wrapped",
      liveLink: "https://youtube-wrapped-by-shaan.vercel.app",
    },
    {
      id: "jarvis",
      date: "Oct 2025",
      status: "shipped",
      title: "JARVIS — Offline AI Assistant",
      desc: "A modular, privacy-first AI voice bot built with local LLM inference and semantic memory. Operates entirely offline without external APIs.",
      tags: ["Python", "Local LLMs", "Semantic Memory", "Wake-word Detection", "TTS"],
      bullets: [
        "Deployed a locally trained ML model for intent classification without external AI APIs",
        "Implemented speech recognition, intent classification & system automation in one integrated pipeline",
        "Built on Python + TensorFlow + NLP for real-time command processing",
      ],
      link: "https://github.com/Shaan-alpha/jarvis-py",
    },
    {
      id: "facefilter",
      date: "2025",
      status: "shipped",
      title: "FaceFilter AI — Facial Recognition",
      desc: "A locally-run face-recognition platform that detects, matches, and organizes photos by face — no cloud uploads, no API keys.",
      tags: ["Python", "Flask", "OpenCV", "SQLite", "SSE"],
      bullets: [
        "YuNet face detection + SFace 128-dimensional embeddings (ONNX) with cosine-similarity matching at a configurable threshold",
        "Caches pre-computed embeddings keyed on file hash to eliminate redundant inference",
        "Real-time progress streaming via Server-Sent Events; three-table SQLite schema for resumable runs",
      ],
      link: "https://github.com/Shaan-alpha/face-sort-studio",
    },
    {
      id: "sahara",
      date: "Feb 2025",
      status: "live",
      title: "Sahara — Women Safety App",
      desc: "A mobile-first safety web app with gesture-based SOS, real-time location tracking, and Twilio-powered alerts to trusted contacts — all backed by Supabase.",
      tags: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS", "Twilio", "MapLibre"],
      bullets: [
        "Gesture-based SOS trigger with real-time location tracking via MapLibre GL",
        "Supabase (Postgres + auth) backend with row-level security and PLpgSQL functions",
        "Twilio-powered SMS alerts dispatched to saved trusted contacts on emergency",
      ],
      link: "https://github.com/Shaan-alpha/Sahaara_APP",
      liveLink: "https://sahaara-app.vercel.app",
    },
  ];

  const statusClass = (s: Status) =>
    s === "building" ? "border-border2 text-muted2" : "border-accent text-accent";

  return (
    <section id="projects" className="py-16 sm:py-[120px] relative z-10">
      <div className="max-w-[1200px] mx-auto px-[5vw]">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }}>
          <motion.div variants={itemVariants} className="eyebrow mb-4.5">projects</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5">
            Featured <span className="accent">work</span>
          </motion.h2>
          <motion.p variants={itemVariants} className="mono text-[13px] lg:text-[14px] leading-[1.75] text-muted2 max-w-[560px]">
            End-to-end projects spanning data engineering, AI/ML, and automation — all real, all shipped.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-[60px]">
            {projects.map((proj, i) => (
              <motion.div
                key={proj.id}
                variants={itemVariants}
                className="group bg-surface border border-border rounded-[var(--r2)] p-5 sm:p-6 flex flex-col transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-accent/50"
              >
                {/* header strip */}
                <div className="flex items-center justify-between gap-2 mb-3.5 mono text-[10px]">
                  <span className="text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 border ${statusClass(proj.status)}`}>[ {proj.status} ]</span>
                    <span className="text-muted">{proj.date}</span>
                  </div>
                </div>

                {/* tags */}
                <div className="flex gap-1.5 flex-wrap mb-3.5">
                  {proj.tags.map((t) => {
                    const logo = lookupTech(t);
                    return (
                      <span key={t} className="inline-flex items-center gap-1.5 mono text-[10px] px-2 py-1 rounded-[6px] bg-bg2 border border-border text-muted2">
                        {logo && <TechLogo file={logo.file} invert={logo.invert} alt={t} className="w-3 h-3" />}
                        {t}
                      </span>
                    );
                  })}
                </div>

                <h3 className="font-display text-[18px] sm:text-[21px] font-bold mb-2.5">{proj.title}</h3>
                <p className="text-[12.5px] sm:text-[13.5px] text-muted leading-[1.7] mb-5">{proj.desc}</p>

                <ul className="flex flex-col gap-2 mb-6 flex-1">
                  {proj.bullets.map((b, bi) => (
                    <li key={bi} className="text-[11.5px] sm:text-[12.5px] text-muted2 leading-[1.55] pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-accent">
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="flex gap-2.5 mt-auto flex-wrap">
                  {proj.link && (
                    <a href={proj.link} target="_blank" rel="noreferrer" className="mono text-[11.5px] px-4 py-2 border border-accent text-accent hover:bg-accent hover:text-background transition-colors duration-200 rounded-[var(--r)]">
                      [ github ↗ ]
                    </a>
                  )}
                  {proj.liveLink && (
                    <a href={proj.liveLink} target="_blank" rel="noreferrer" className="mono text-[11.5px] px-4 py-2 border border-border2 text-muted2 hover:text-foreground hover:border-foreground/40 transition-colors duration-200 rounded-[var(--r)]">
                      [ live ↗ ]
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
