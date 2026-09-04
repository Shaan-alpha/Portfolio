# Shaan Satsangi — Portfolio

A terminal/data-themed developer portfolio built with **Next.js 16**, **React 19**, and **Tailwind CSS 4**. Monospace type, a single phosphor accent, flat surfaces, and a self-built generative hero — designed to read like an engineer made deliberate choices, not like a template.

> "The model is a component, not the architecture. I build systems, not demos."

## Design

- **Terminal / data identity** — JetBrains Mono display + labels, graph-paper grid, ASCII-style section prompts (`~/projects $`), monospace readouts, and one disciplined accent (phosphor `#3fb950` dark · deep green `#1a7f4b` on the "paper terminal" light mode). No gradients, no glassmorphism, no ambient blobs.
- **Self-built generative hero** — a real-time HTML5 `<canvas>` renders a node/edge pipeline graph with packets flowing source → bronze → silver → gold → sink, behind a live-typed terminal status line. No video assets; `prefers-reduced-motion` paints a static graph.
- **Smooth, accessible motion** — Lenis smooth scroll, restrained Framer Motion reveals, a custom cursor that never hides the caret in form fields, visible focus rings, and full reduced-motion support.
- **Two themes** — dark-first near-black terminal, plus an ink-on-paper light mode, with an animated view-transition theme toggle.

## Stack

- **Framework:** Next.js 16 (App Router, static export)
- **Runtime:** React 19
- **Styling:** Tailwind CSS 4
- **Animation:** Framer Motion 12 · Lenis
- **Fonts:** JetBrains Mono (display) · Outfit (body), via `next/font`
- **Hosting:** Cloudflare Workers static assets at [`shaansatsangi.com`](https://shaansatsangi.com) — Cloudflare DNS · WAF · CDN, security headers, an enforced CSP, HSTS, and an SSL Labs **A+** edge config.
- **Contact API:** a same-origin Cloudflare Worker route (`/api/contact`, see [`worker/index.ts`](worker/index.ts)) that emails via **Resend** — honeypot, required-field + length validation, and WAF rate limiting. No CORS, no cold start. *(Previously a Flask service on Render; now retired.)*

## Featured projects

**Live in production**

- **Skill Issue** — AI-powered GitHub intelligence platform: a deterministic 100-point engineering score and shareable receipts, live at [skillissue.tech](https://skillissue.tech). The score is computed; the model only narrates it. *Next.js · FastAPI · Neon Postgres · Upstash Redis · Groq.*
- **Atlas** — an AI financial analyst that lives in [Telegram](https://t.me/AtlasAnalyst_bot): conversation-only, 20 Gemini-function-calling tools each closure-bound to one user, an eight-provider failover chain, and briefings gated on a salience check that returns `send: false` and means it. *Python · Gemini · Postgres · SQLAlchemy.*
- **Syntrueno** — zero-trust autonomous cloud-ops swarm, [live on Cloud Run](https://syntrueno-18489510475.us-central1.run.app). Gemini agents diagnose incidents, judge their own remediation plans, and execute real infrastructure changes behind a single-use SHA-256 human gate, then re-read live state until it converges. *Python · Gemini · Cloud Run · Firestore.*
- **AI Reel Factory** — autonomous, near-$0/month content factory: researches news, writes scripts, narrates in a near-human voice, generates AI B-roll, renders captioned vertical video, and publishes 4–5 YouTube Shorts/day to [@butitmatters](https://youtube.com/@butitmatters) with one Telegram tap. *Python · Gemini · Cloudflare Workers AI · Supabase · FFmpeg · faster-whisper · GitHub Actions.*
- **VouchRank** — multi-tenant, white-label reputation & AI-search (AIO/GEO) SaaS for local businesses, [live](https://vouchrank.vercel.app). *React 19 · Vite · Supabase RLS · Stripe · Twilio.*
- **Think9 Brain** — grounded institutional-memory assistant, [live](https://think9-brain.vercel.app). Cites the exact source section, states a good-as-of date, withholds superseded documents; refusal recall 1.000 across 32 unanswerable questions. *Python · LangGraph · FastAPI · Groq.*

**Also shipped**

- **Telegram MCP** — local Model Context Protocol server giving AI agents read/write access to a Telegram account via MTProto. *Python · Telethon · MCP · Claude.*
- **JARVIS** — offline, privacy-first voice assistant: local LLM inference (Ollama), semantic memory, wake-word detection, streaming TTS.
- **Face Sort Studio** — local deep-learning photo organizer (OpenCV DNN: YuNet + SFace) with SQLite persistence and SSE progress.
- **YouTube Wrapped** — Databricks medallion lakehouse (Bronze → Silver → Gold) on Delta Lake, served via FastAPI + Next.js.
- **Sahaara** — mobile-first women's-safety app with gesture SOS, MapLibre live location, and Twilio alerts on Supabase.
- **CRM + Sales Warehouse** — Airflow ETL into a star-schema PostgreSQL warehouse, surfaced via Power BI.
- **Cog & Cosmos** — pixel-art interconnected incremental/idle game; eight worlds feed one brass Fortune Engine. *Svelte 5 · TypeScript · PixiJS · PWA.*

## Local development

```bash
git clone https://github.com/Shaan-alpha/Portfolio.git && cd Portfolio
npm install
npm run dev          # http://localhost:3000
npm run build        # static export to ./out
```

Regenerate the social card after editing it:

```bash
node scripts/make-og.mjs   # writes public/og.png (1200×630)
```

---
Built by **Shaan Satsangi** · Jaipur, Rajasthan
