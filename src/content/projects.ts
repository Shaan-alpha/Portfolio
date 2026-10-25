export type Status = "live" | "shipped" | "building";
export type Tier = "flagship" | "lab";

/** How a pipeline step is drawn. `model` is the only step that gets the signal
 *  colour: the whole site uses yellow to mean "an AI model runs here". */
export type StepKind = "io" | "step" | "model" | "guard" | "human";

export type Step = { label: string; note: string; kind: StepKind };

/** One path through a system. A project with two separate paths (a chat reply
 *  and a scheduled briefing, say) gets two flows rather than one invented
 *  sequence; `name` is shown only when there is more than one. */
export type Flow = { name?: string; steps: Step[] };

export type Project = {
  id: string;
  name: string;
  kicker: string;
  date: string;
  status: Status;
  tier: Tier;
  desc: string;
  tags: string[];
  bullets: string[];
  link?: string;
  liveLink?: string;
  /** Override when the raw host is too long to read as a button label. */
  liveLabel?: string;
  /** Flagship systems only: how work moves through the system, in order. Each
   *  note is a few words naming the mechanism, and must be backed by `desc`
   *  or `bullets`; the diagram adds no facts of its own. */
  flows?: Flow[];
};

export const projects: Project[] = [
  {
    id: "skill-issue",
    name: "Skill Issue",
    kicker: "GitHub intelligence",
    date: "Aug 2026",
    status: "live",
    tier: "flagship",
    desc: "An AI-powered GitHub intelligence platform on its own domain. Drop in a username and it turns repos, OSS contributions, and coding discipline into a deterministic 100-point engineering score and a shareable receipt. The score is computed; the model only narrates it.",
    tags: ["Next.js", "FastAPI", "Python", "Neon Postgres", "Upstash Redis", "Groq"],
    bullets: [
      "Deterministic 100-point score across repo quality, maturity, OSS, recruiter signal, consistency & trajectory — every point traces to evidence, the LLM never touches a number",
      "FastAPI + Next.js on Neon Postgres with GitHub OAuth and four Upstash Redis cache layers, designed for a sub-200 ms p95 on repeat analyses; the cache fails open",
      "Survives GitHub GraphQL RESOURCE_LIMITS on whale accounts; shareable 1200×630 'GitHub Receipts' OG scorecards. Shipping at v1.0.17.",
    ],
    link: "https://github.com/Shaan-alpha/Skill-Issue",
    liveLink: "https://skillissue.tech",
    flows: [
      {
        steps: [
          { kind: "io", label: "GitHub profile", note: "GraphQL, survives resource limits" },
          { kind: "step", label: "Cache", note: "Four Redis layers, fail open" },
          { kind: "step", label: "Score", note: "Deterministic, 100 points" },
          { kind: "model", label: "Narrate", note: "Explains the score, never edits it" },
          { kind: "io", label: "Receipt", note: "Shareable 1200×630 card" },
        ],
      },
    ],
  },
  {
    id: "atlas",
    name: "Atlas",
    kicker: "AI financial analyst on Telegram",
    date: "Aug 2026",
    status: "live",
    tier: "flagship",
    desc: "An AI financial analyst that lives in Telegram: conversation only, no slash commands, no buttons. It learns you as you talk, and it stays quiet when nothing on your watchlist actually matters.",
    tags: ["Python", "Gemini", "PostgreSQL", "SQLAlchemy", "Telegram Bot API"],
    bullets: [
      "Gemini function calling drives the loop across 20 tools; the 10 that touch user data are closure-bound to a single user id, so the model cannot reach another person's data",
      "Failover across four quote providers and three fundamentals providers; reads PDFs and spreadsheets natively with tables intact, and transcribes voice notes",
      "Morning briefings gated on a salience check that returns send: false and means it — silence is enforced control flow, not a prompt suggestion. 309 tests.",
      "Always-on under systemd with a polling watchdog that force-exits a bot that is up but no longer listening: back serving six seconds after kill -9",
    ],
    link: "https://github.com/Shaan-alpha/atlas-financial-assistant",
    liveLink: "https://t.me/AtlasAnalyst_bot",
    // Two paths, not one: a reply to a message, and the scheduled briefing
    // that the salience check gates. The quote and fundamentals chains fail
    // over separately (four and three providers); they are never one chain.
    flows: [
      {
        name: "A message",
        steps: [
          { kind: "io", label: "Telegram chat", note: "Conversation only" },
          { kind: "model", label: "Gemini loop", note: "Function calling, 20 tools" },
          { kind: "guard", label: "User-scoped tools", note: "Bound to one user id" },
          { kind: "step", label: "Market data", note: "Quote and fundamentals failover" },
          { kind: "io", label: "Reply", note: "Back in the chat" },
        ],
      },
      {
        name: "A morning briefing",
        steps: [
          { kind: "io", label: "Watchlist", note: "What you follow" },
          { kind: "guard", label: "Salience check", note: "Returns send: false when nothing matters" },
          { kind: "io", label: "Briefing", note: "Sent only when it passes" },
        ],
      },
    ],
  },
  {
    id: "syntrueno",
    name: "Syntrueno",
    kicker: "Zero-trust cloud-ops swarm",
    date: "Aug 2026",
    status: "live",
    tier: "flagship",
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
    liveLabel: "the Cloud Run app",
    flows: [
      {
        steps: [
          { kind: "io", label: "Live incident", note: "On Google Cloud" },
          { kind: "model", label: "Diagnose", note: "Gemini agents propose a fix" },
          { kind: "model", label: "Self-review", note: "Judges its own plan for safety" },
          { kind: "guard", label: "Five guards", note: "Fail closed, cheapest first" },
          { kind: "human", label: "Human gate", note: "Single-use SHA-256 approval" },
          { kind: "step", label: "Execute and verify", note: "Until live state converges" },
        ],
      },
    ],
  },
  {
    id: "ai-reel-factory",
    name: "AI Reel Factory",
    kicker: "On-demand Shorts",
    date: "Sep 2026",
    status: "live",
    tier: "flagship",
    desc: "A low-cost, on-demand content pipeline: send /makeshort in Telegram and it researches the news and pitches ideas; tap Approve on the ones worth making and it scripts, fact-checks, narrates in a near-human voice, generates AI B-roll, edits a captioned cinematic vertical video, and publishes each as a YouTube Short.",
    tags: ["Python", "Gemini", "Cloudflare Workers AI", "Supabase", "FFmpeg", "GitHub Actions"],
    bullets: [
      "Multi-stage agent pipeline (ideation → script → voice → AI B-roll → edit → publish) on GitHub Actions, started on demand; the Telegram Approve tap is the only human input, up to 3 ideas a run",
      "A fact-check gate that cannot switch itself off, and ideation that may only cite URLs it actually retrieved — both hardened after a full audit",
      "Gemini TTS narration in one fixed voice, falling back to Chirp 3 HD, edge-tts and Kokoro; Flux B-roll on Workers AI, faster-whisper word-by-word captions",
      "Idempotent fail-soft run state in Supabase Postgres with safe retries; publishes to @butitmatters on a cost target of $5/month or less",
    ],
    link: "https://github.com/Shaan-alpha/AI-Reel-Factory",
    // Linked by channel id: youtube.com/@butitmatters returns 404 even though
    // it is the channel's own canonical handle, and an id URL always resolves.
    liveLink: "https://www.youtube.com/channel/UC5rDIoOPYLrHaf2IQ5hRlRw",
    liveLabel: "the YouTube channel",
    flows: [
      {
        steps: [
          { kind: "io", label: "/makeshort", note: "Started from Telegram" },
          { kind: "model", label: "Research and pitch", note: "Cites only URLs it retrieved" },
          { kind: "human", label: "Approve", note: "Up to 3 ideas a run" },
          { kind: "model", label: "Script", note: "One per approved idea" },
          { kind: "guard", label: "Fact-check", note: "Cannot switch itself off" },
          { kind: "model", label: "Voice and B-roll", note: "Gemini TTS, Flux" },
          { kind: "io", label: "Edit and publish", note: "Captions, then YouTube" },
        ],
      },
    ],
  },
  {
    id: "vouchrank",
    name: "VouchRank",
    kicker: "Reputation and AI-search SaaS",
    date: "Jul 2026",
    status: "live",
    tier: "flagship",
    desc: "A multi-tenant, white-label reputation platform for marketing agencies — helping local businesses get recommended by AI search engines, built compliant with 2026 review-gating regulations.",
    tags: ["React 19", "Vite", "Supabase", "Stripe", "Twilio", "Vercel"],
    bullets: [
      "AI-search (AIO/GEO) audit scoring how often ChatGPT / Gemini / Perplexity recommend a business for local-intent queries, with an optimization checklist",
      "Compliant review funnel (Google / video / text + private feedback) with in-browser video capture and built-in consent — no review gating by design",
      "Per-agency tenancy on Supabase Postgres row-level security with 12 Deno edge functions, Stripe billing, embeddable widgets & SMS/email campaigns",
    ],
    link: "https://github.com/Shaan-alpha/vouchrank",
    liveLink: "https://vouchrank.vercel.app",
    // Two products in one platform, so two flows rather than one sequence.
    flows: [
      {
        name: "An AI-search audit",
        steps: [
          { kind: "guard", label: "Agency workspace", note: "Row-level security" },
          { kind: "model", label: "AI-search audit", note: "Do ChatGPT, Gemini and Perplexity recommend it?" },
          { kind: "io", label: "Checklist", note: "What to optimize" },
        ],
      },
      {
        name: "A review request",
        steps: [
          { kind: "io", label: "Campaign", note: "SMS or email" },
          { kind: "step", label: "Review funnel", note: "Google, video or text, or private feedback" },
          { kind: "guard", label: "Consent", note: "Built in; no review gating" },
        ],
      },
    ],
  },
  {
    id: "think9-brain",
    name: "Think9 Brain",
    kicker: "Grounded institutional memory",
    date: "Aug 2026",
    status: "live",
    tier: "flagship",
    desc: "A grounded institutional-memory assistant over a multi-brand corpus. It cites the exact source section, states a good-as-of date, and holds back superseded documents. Built to be trusted, which means built to say “I don’t know.”",
    tags: ["Python", "LangGraph", "FastAPI", "Groq", "Vercel"],
    bullets: [
      "Refusal recall of 1.000 on both eval sets — across 32 unanswerable questions (invented vendors, plausible-but-absent figures, out-of-scope functions) it never fabricated an answer",
      "Every response cites the exact source section and a good-as-of date, so a reader can check the claim rather than trust it",
      "Supersession-aware retrieval: a document that has been replaced is withheld rather than quietly cited alongside the version that replaced it",
    ],
    link: "https://github.com/Shaan-alpha/think9-brain",
    liveLink: "https://think9-brain.vercel.app",
    flows: [
      {
        steps: [
          { kind: "io", label: "Question", note: "Over a multi-brand corpus" },
          { kind: "guard", label: "Retrieve", note: "Superseded documents withheld" },
          { kind: "model", label: "Draft", note: "LangGraph on Groq" },
          { kind: "step", label: "Cite", note: "Exact section, good-as-of date" },
          { kind: "guard", label: "Answer or refuse", note: "Refusal recall 1.000" },
        ],
      },
    ],
  },
  {
    id: "telegram-mcp",
    name: "Telegram MCP",
    kicker: "AI agent bridge",
    date: "Jul 2026",
    status: "shipped",
    tier: "lab",
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
    name: "JARVIS",
    kicker: "Local-first voice assistant",
    date: "Jun 2026",
    status: "shipped",
    tier: "lab",
    desc: "A modular, local-first voice assistant that still works offline: wake-word detection, local LLM inference via Ollama, long-term memory, and streaming TTS. When online it uses Google speech recognition and free web lookups; no telemetry.",
    tags: ["Python", "Ollama", "RAG", "Wake-word Detection", "Streaming TTS"],
    bullets: [
      "Local LLM inference through Ollama with a modular tool-agent architecture for commands & automation",
      "Long-term memory of the facts you ask it to keep, deduplicated by meaning and recalled by embedding similarity, plus threshold-gated PDF RAG",
      "openWakeWord hotword detection, speech recognition (Google online, Vosk offline) and streaming TTS in one integrated pipeline, warm-started to cut first-token latency",
    ],
    link: "https://github.com/Shaan-alpha/jarvis-py",
  },
  {
    id: "face-sort-studio",
    name: "Face Sort Studio",
    kicker: "AI photo organizer",
    date: "Aug 2026",
    status: "shipped",
    tier: "lab",
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
    name: "YouTube Wrapped",
    kicker: "Data pipeline",
    date: "May 2025",
    status: "live",
    tier: "lab",
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
    name: "Sahaara",
    kicker: "Women's safety app",
    date: "Feb 2025",
    status: "shipped",
    tier: "lab",
    desc: "A mobile-first safety web app with one-tap SOS, real-time location tracking, and alerts to nearby users delivered over Supabase Realtime.",
    tags: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS", "MapLibre"],
    bullets: [
      "One-tap SOS trigger with real-time location tracking via MapLibre GL",
      "Supabase Postgres backend with row-level security and PLpgSQL functions",
      "Each SOS becomes a notification for every online user within a set radius, pushed live over Supabase Realtime",
    ],
    link: "https://github.com/Shaan-alpha/Sahaara_APP",
  },
  {
    id: "crm-sales",
    name: "CRM + Sales",
    kicker: "Data warehouse",
    date: "Apr 2026",
    status: "shipped",
    tier: "lab",
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
    name: "Cog & Cosmos",
    kicker: "Idle game",
    date: "Jun 2026",
    status: "live",
    tier: "lab",
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

export const flagship = projects.filter((p) => p.tier === "flagship");
export const lab = projects.filter((p) => p.tier === "lab");
// Counted, not hand-typed, so no headline can drift from the list below it.
export const liveCount = projects.filter((p) => p.liveLink).length;

/** Label a live link with the host the visitor will actually land on, derived
 *  from the href so the two can never drift apart. */
export function hostOf(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "");
    return (u.host + path).replace(/^www\./, "");
  } catch {
    return "live";
  }
}
