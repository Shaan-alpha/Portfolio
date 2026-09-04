"use client";

import { motion } from "framer-motion";
import { lookupTech, TechLogo } from "@/lib/techIcons";

type Status = "live" | "shipped" | "building";
type Tier = "flagship" | "lab";

type Project = {
  id: string;
  date: string;
  status: Status;
  tier: Tier;
  title: string;
  desc: string;
  tags: string[];
  bullets: string[];
  link?: string;
  liveLink?: string;
  /** Override when the raw host is too long to read as a button label. */
  liveLabel?: string;
};

/** Label a live button with the host the visitor will actually land on, derived
 *  from the href so the two can never drift apart. */
function hostOf(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "");
    return (u.host + path).replace(/^www\./, "");
  } catch {
    return "live";
  }
}

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
      id: "skill-issue",
      date: "Aug 2026",
      status: "live",
      tier: "flagship",
      title: "Skill Issue — GitHub Intelligence",
      desc: "An AI-powered GitHub intelligence platform on its own domain. Drop in a username and it turns repos, OSS contributions, and coding discipline into a deterministic 100-point engineering score and a shareable receipt. The score is computed; the model only narrates it.",
      tags: ["Next.js", "FastAPI", "Python", "Neon Postgres", "Upstash Redis", "Groq"],
      bullets: [
        "Deterministic 100-point score across repo quality, maturity, OSS, consistency & recruiter signal — every point traces to evidence, the LLM never touches a number",
        "FastAPI + Next.js on Neon Postgres with GitHub OAuth and four Upstash Redis cache layers; repeat analysis p95 ≤ 200 ms, and the cache fails open",
        "Survives GitHub GraphQL RESOURCE_LIMITS on whale accounts; shareable 1200×630 'GitHub Receipts' OG scorecards. Shipping at v1.0.12.",
      ],
      link: "https://github.com/Shaan-alpha/Skill-Issue",
      liveLink: "https://skillissue.tech",
    },
    {
      id: "atlas",
      date: "Aug 2026",
      status: "live",
      tier: "flagship",
      title: "Atlas — AI Financial Analyst on Telegram",
      desc: "An AI financial analyst that lives in Telegram: conversation only, no slash commands, no buttons. It learns you as you talk, and it stays quiet when nothing on your watchlist actually matters.",
      tags: ["Python", "Gemini", "PostgreSQL", "SQLAlchemy", "Telegram Bot API"],
      bullets: [
        "Gemini function calling drives the loop across 20 tools, each closure-bound to a single user id so the model cannot reach another person's data",
        "Eight-provider failover chain (five quote, three fundamentals); reads PDFs and spreadsheets natively with tables intact, and transcribes voice notes",
        "Morning briefings gated on a salience check that returns send: false and means it — silence is enforced control flow, not a prompt suggestion. 191 tests.",
        "Always-on under systemd with a polling watchdog that force-exits a bot that is up but no longer listening: back serving six seconds after kill -9",
      ],
      link: "https://github.com/Shaan-alpha/atlas-financial-assistant",
      liveLink: "https://t.me/AtlasAnalyst_bot",
    },
    {
      id: "syntrueno",
      date: "Aug 2026",
      status: "live",
      tier: "flagship",
      title: "Syntrueno — Zero-Trust Cloud-Ops Swarm",
      desc: "A zero-trust autonomous cloud-ops swarm on Google Cloud. Gemini agents diagnose live incidents, propose remediations, judge their own plans for safety, then execute real infrastructure changes — but only behind a single-use cryptographic human gate.",
      tags: ["Python", "Gemini", "Cloud Run", "Firestore", "Google Cloud"],
      bullets: [
        "A single-use SHA-256 gate bound to that exact action — approval for one change cannot be replayed against another",
        "Five guards that fail closed, evaluated cheapest-first; every refusal is audited into a hash-chained Firestore ledger, never silent",
        "After executing, it re-reads live Cloud Run state until it converges rather than trusting the API's acknowledgement that the change landed",
        "288 tests run offline in ~2.7 s with no credentials. Built for the Google Cloud 'All Things Agentic' hackathon.",
      ],
      link: "https://github.com/Shaan-alpha/syntrueno",
      liveLink: "https://syntrueno-18489510475.us-central1.run.app",
      liveLabel: "live on cloud run",
    },
    {
      id: "ai-reel-factory",
      date: "Sep 2026",
      status: "live",
      tier: "flagship",
      title: "AI Reel Factory — Autonomous Shorts",
      desc: "A near-$0/month autonomous content factory: it researches news, writes scripts, narrates in a near-human voice, generates AI B-roll, edits a captioned cinematic vertical video, and publishes 4–5 YouTube Shorts a day — on one human Telegram tap.",
      tags: ["Python", "Gemini", "Cloudflare Workers AI", "Supabase", "FFmpeg", "GitHub Actions"],
      bullets: [
        "Multi-stage agent pipeline (ideation → script → voice → AI B-roll → edit → publish) on GitHub Actions cron; one Telegram 'Morning Digest' approval per day",
        "A fact-check gate that cannot switch itself off, and ideation that may only cite URLs it actually retrieved — both hardened after a full audit",
        "Google Chirp 3 HD narration with edge-tts/Kokoro fallback, Flux B-roll on Workers AI, faster-whisper word-by-word captions",
        "Idempotent fail-soft run state in Supabase Postgres with safe retries; publishes daily to @butitmatters at roughly $0/month",
      ],
      link: "https://github.com/Shaan-alpha/AI-Reel-Factory",
      liveLink: "https://youtube.com/@butitmatters",
    },
    {
      id: "vouchrank",
      date: "Jul 2026",
      status: "live",
      tier: "flagship",
      title: "VouchRank — Reputation & AI-Search SaaS",
      desc: "A multi-tenant, white-label reputation platform for marketing agencies — helping local businesses get recommended by AI search engines, built compliant with 2026 review-gating regulations.",
      tags: ["React 19", "Vite", "Supabase", "Stripe", "Twilio", "Vercel"],
      bullets: [
        "AI-search (AIO/GEO) audit scoring how often ChatGPT / Gemini / Perplexity recommend a business for local-intent queries, with an optimization checklist",
        "Compliant review funnel (Google / video / text + private feedback) with in-browser video capture and built-in consent — no review gating by design",
        "Per-agency tenancy on Supabase Postgres row-level security with 12 Deno edge functions, Stripe billing, embeddable widgets & SMS/email campaigns",
      ],
      link: "https://github.com/Shaan-alpha/vouchrank",
      liveLink: "https://vouchrank.vercel.app",
    },
    {
      id: "think9-brain",
      date: "Aug 2026",
      status: "live",
      tier: "flagship",
      title: "Think9 Brain — Grounded Institutional Memory",
      desc: "A grounded institutional-memory assistant over a multi-brand corpus. It cites the exact source section, states a good-as-of date, and holds back superseded documents. Built to be trusted, which means built to say “I don’t know.”",
      tags: ["Python", "LangGraph", "FastAPI", "Groq", "Vercel"],
      bullets: [
        "Refusal recall of 1.000 on both eval sets — across 32 unanswerable questions (invented vendors, plausible-but-absent figures, out-of-scope functions) it never fabricated an answer",
        "Every response cites the exact source section and a good-as-of date, so a reader can check the claim rather than trust it",
        "Supersession-aware retrieval: a document that has been replaced is withheld rather than quietly cited alongside the version that replaced it",
      ],
      link: "https://github.com/Shaan-alpha/think9-brain",
      liveLink: "https://think9-brain.vercel.app",
    },
    {
      id: "telegram-mcp",
      date: "Jul 2026",
      status: "shipped",
      tier: "lab",
      title: "Telegram MCP — AI Agent Bridge",
      desc: "A local Model Context Protocol server that gives AI agents read/write access to your own Telegram account via MTProto — full user-account access, not the limited bot API.",
      tags: ["Python", "MCP", "Telethon", "Claude"],
      bullets: [
        "Exposes chats, message history, global search, and message sending to any MCP client as typed tools",
        "Runs locally over stdio with Claude Desktop / Claude Code — session and API credentials never leave your machine",
        "Built on Telethon (MTProto) with a one-time interactive login and a persistent local session",
      ],
      link: "https://github.com/Shaan-alpha/telegram-mcp",
    },
    {
      id: "jarvis",
      date: "Jun 2026",
      status: "shipped",
      tier: "lab",
      title: "JARVIS — Offline AI Assistant",
      desc: "A modular, privacy-first offline voice assistant — wake-word detection, local LLM inference via Ollama, semantic memory, and streaming TTS. No cloud APIs, no telemetry.",
      tags: ["Python", "Ollama", "RAG", "Wake-word Detection", "Streaming TTS"],
      bullets: [
        "Local LLM inference through Ollama with a modular tool-agent architecture for commands & automation",
        "Semantic memory with embedding-based retrieval (RAG) so context persists across conversations, plus threshold-gated PDF RAG",
        "openWakeWord hotword detection, offline speech recognition & streaming TTS in one integrated pipeline, warm-started to cut first-token latency",
      ],
      link: "https://github.com/Shaan-alpha/jarvis-py",
    },
    {
      id: "face-sort-studio",
      date: "Aug 2026",
      status: "shipped",
      tier: "lab",
      title: "Face Sort Studio — AI Photo Organizer",
      desc: "A local deep-learning photo organizer that detects, matches, and sorts photos by face — no cloud uploads, no API keys.",
      tags: ["Python", "Flask", "OpenCV", "SQLite", "SSE"],
      bullets: [
        "YuNet face detection + SFace 128-dimensional embeddings (ONNX) with cosine-similarity matching at a configurable threshold",
        "Caches pre-computed embeddings keyed on file hash to eliminate redundant inference",
        "Real-time progress streaming via Server-Sent Events; three-table SQLite schema for resumable runs",
      ],
      link: "https://github.com/Shaan-alpha/Face-Sort-Studio",
    },
    {
      id: "youtube-wrapped",
      date: "May 2025",
      status: "live",
      tier: "lab",
      title: "YouTube Wrapped — Data Pipeline",
      desc: "A personal 'Spotify Wrapped' for YouTube. An end-to-end pipeline that turns Google Takeout exports into a polished year-in-review analytics dashboard.",
      tags: ["Databricks", "Delta Lake", "FastAPI", "Next.js", "Neon Postgres"],
      bullets: [
        "Medallion lakehouse pipeline (Bronze → Silver → Gold) in Databricks with Delta Lake tables",
        "FastAPI backend serving analytics from Neon Postgres fact tables",
        "Next.js dashboard with animated cards, genre splits, binge sessions & viewing-rhythm charts",
      ],
      link: "https://github.com/Shaan-alpha/Youtube-Wrapped",
      liveLink: "https://youtube-wrapped-by-shaan.vercel.app",
    },
    {
      id: "sahara",
      date: "Feb 2025",
      status: "live",
      tier: "lab",
      title: "Sahaara — Women's Safety App",
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
    {
      id: "crm-sales",
      date: "Apr 2026",
      status: "shipped",
      tier: "lab",
      title: "CRM + Sales — Data Warehouse",
      desc: "An end-to-end data warehousing project on the Maven Analytics dataset: an ETL pipeline that cleans and transforms raw CRM data into a structured PostgreSQL warehouse.",
      tags: ["Python", "Apache Airflow", "PostgreSQL", "Power BI", "ETL"],
      bullets: [
        "Automated ETL pipeline orchestrated with Airflow to ingest and process 10k+ sales records",
        "Star-schema warehouse in PostgreSQL designed for analytical querying",
        "Sales-performance insights surfaced through a Power BI dashboard",
      ],
      link: "https://github.com/Shaan-alpha/CRM-Sales-Warehouse",
    },
    {
      id: "cog-and-cosmos",
      date: "Jun 2026",
      status: "live",
      tier: "lab",
      title: "Cog & Cosmos — Idle Game",
      desc: "A pixel-art interconnected incremental/idle game. Eight worlds feed one brass Fortune Engine — and unlike most idlers, every stage stays alive and feeds the others.",
      tags: ["Svelte 5", "TypeScript", "PixiJS", "Vite", "PWA"],
      bullets: [
        "Eight interconnected stages (Village → Multiverse) where labor, grain, ore, power, mana, chronons & shards compound across the chain",
        "5 prestige/meta layers, a global skill tree, achievements & relic collections, on break_eternity.js big-number math",
        "Installable offline-first PWA: PixiJS pixel scenes, IndexedDB autosave, optional Supabase cloud sync, synthesized Web-Audio SFX",
      ],
      link: "https://github.com/Shaan-alpha/Cog-and-Cosmos",
      liveLink: "https://shaan-alpha.github.io/Cog-and-Cosmos/",
    },
  ];

  // The accent means one thing only: you can reach this right now.
  const statusClass = (s: Status) =>
    s === "live"
      ? "border-accent text-accent bg-accent-dim"
      : s === "shipped"
        ? "border-border2 text-muted2"
        : "border-border text-muted";

  const flagship = projects.filter((p) => p.tier === "flagship");
  const lab = projects.filter((p) => p.tier === "lab");
  // Counted, not hand-typed, so the headline can't drift from the array below it.
  const reachable = projects.filter((p) => p.liveLink).length;

  return (
    <section id="projects" className="py-16 sm:py-[120px] relative z-10">
      <div className="max-w-[1200px] mx-auto px-[5vw]">
        {/* ── Section head ─────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }}>
          <motion.div variants={itemVariants} className="eyebrow mb-4.5">projects</motion.div>
          <motion.h2 variants={itemVariants} className="display-2 mb-5.5">
            Featured <span className="accent">work</span>
          </motion.h2>
          <motion.p variants={itemVariants} className="mono text-[13px] lg:text-[14px] leading-[1.75] text-muted2 max-w-[600px]">
            <span className="accent">{projects.length}</span> projects ·{" "}
            <span className="accent">{flagship.length}</span> running in production ·{" "}
            <span className="accent">{reachable}</span> you can open right now. Agentic AI systems,
            developer platforms, and the data pipelines behind them.
          </motion.p>
        </motion.div>

        {/* ── Tier 1: production ───────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className="mt-[60px]"
        >
          <motion.div variants={itemVariants} className="eyebrow mb-5">projects/production</motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {flagship.map((proj, i) => (
              <motion.div
                key={proj.id}
                variants={itemVariants}
                className="group bg-surface border border-border border-l-2 border-l-accent rounded-[var(--r)] p-5 sm:p-6 flex flex-col transition-colors duration-300 hover:border-accent/50 hover:border-l-accent"
              >
                {/* header strip */}
                <div className="flex items-center justify-between gap-2 mb-3.5 mono text-[10px]">
                  <span className="text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border ${statusClass(proj.status)}`}>
                      {proj.status === "live" && (
                        <span className="inline-block w-1.5 h-1.5 bg-accent animate-[pulse-dot_2.4s_ease-in-out_infinite]" aria-hidden />
                      )}
                      [ {proj.status} ]
                    </span>
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

                <h3 className="display-3 mb-2.5">{proj.title}</h3>
                <p className="text-[12.5px] sm:text-[13.5px] text-muted leading-[1.7] mb-5">{proj.desc}</p>

                <ul className="flex flex-col gap-2 mb-6 flex-1">
                  {proj.bullets.map((b, bi) => (
                    <li key={bi} className="text-[11.5px] sm:text-[12.5px] text-muted2 leading-[1.55] pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-accent">
                      {b}
                    </li>
                  ))}
                </ul>

                {/* The running thing leads; the repo is secondary. */}
                <div className="flex gap-2.5 mt-auto flex-wrap">
                  {proj.liveLink && (
                    <a
                      href={proj.liveLink}
                      target="_blank"
                      rel="noreferrer"
                      title={proj.liveLink}
                      className="mono text-[11.5px] px-4 py-2 border border-accent text-accent hover:bg-accent hover:text-background transition-colors duration-200 rounded-[var(--r)] max-w-full truncate"
                    >
                      [ {proj.liveLabel ?? hostOf(proj.liveLink)} ↗ ]
                    </a>
                  )}
                  {proj.link && (
                    <a href={proj.link} target="_blank" rel="noreferrer" className="mono text-[11.5px] px-4 py-2 border border-border2 text-muted2 hover:text-foreground hover:border-foreground/40 transition-colors duration-200 rounded-[var(--r)]">
                      [ source ↗ ]
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Tier 2: the long tail, as a terminal listing ─────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className="mt-16"
        >
          <motion.div variants={itemVariants} className="eyebrow mb-5">projects/archive</motion.div>
          <motion.div variants={itemVariants} className="bg-surface border border-border rounded-[var(--r)] px-5 sm:px-7">
            {lab.map((proj, i) => (
              <div
                key={proj.id}
                className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-x-5 gap-y-2 items-baseline py-4 border-b border-border last:border-0 -mx-5 px-5 sm:-mx-7 sm:px-7 hover:bg-bg2 transition-colors duration-200"
              >
                <span className="mono text-[11px] text-muted tabular-nums hidden sm:block">
                  {String(flagship.length + i + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <h3 className="font-display text-[14px] sm:text-[15px] font-bold">{proj.title}</h3>
                    {proj.status === "live" && (
                      <span className="mono text-[9px] px-1.5 py-0.5 border border-accent/60 text-accent">[ live ]</span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted leading-[1.6] mt-1">{proj.desc}</p>
                  <div className="mono text-[10px] text-muted mt-1.5">{proj.tags.slice(0, 4).join(" · ")}</div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {proj.liveLink && (
                    <a href={proj.liveLink} target="_blank" rel="noreferrer" className="mono text-[10.5px] px-2.5 py-1.5 border border-accent/60 text-accent hover:bg-accent hover:text-background transition-colors duration-200 rounded-[var(--r)]">
                      [ live ↗ ]
                    </a>
                  )}
                  {proj.link && (
                    <a href={proj.link} target="_blank" rel="noreferrer" className="mono text-[10.5px] px-2.5 py-1.5 border border-border2 text-muted2 hover:text-foreground hover:border-foreground/40 transition-colors duration-200 rounded-[var(--r)]">
                      [ src ↗ ]
                    </a>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
