# Shaan Satsangi — Portfolio

The personal site of an AI systems engineer, built with **Next.js 16**, **React 19**, **Tailwind CSS 4** and **three.js**. It is organised around one idea, drawn the same way everywhere on the page:

> "The model is a component, not the architecture."

## Design

- **An interactive model in the hero.** A three.js model of the shape most of these systems share: interfaces, guards, orchestration, and memory and state as plates, with the model as one yellow block between them and no plate of its own. Drag to turn it, and select a layer to see which projects use it. The callouts and the caption read the same data as the scene, so the 3D object and the text cannot disagree.
- **Pipelines instead of paragraphs.** Each production project is drawn as the path work takes through it, in the same visual language: yellow where a model runs, a shield where a guard or check sits, a hand where a person approves. A system with two separate paths, such as Atlas's chat replies and its gated morning briefing, gets two diagrams rather than one invented sequence.
- **Type and colour.** Archivo at two widths: expanded for display, normal for reading. The neutrals are cool aluminium in light mode and graphite in dark, plus one signal colour that only ever means "a model runs here". Every text colour clears WCAG AA in both themes, and axe reports no violations.
- **3D as an enhancement.** The page first renders a flat isometric drawing of the model, projected with the same camera maths as the WebGL scene. three.js loads after first paint (as its own ~140 KB chunk) and the drawing resolves into the model. Without WebGL or with Save-Data on, the drawing and the layer buttons are the whole experience, and three.js is never downloaded. With reduced motion you get the model without the intro, inertia or scroll-linked turn.
- **Quiet everywhere else.** No scroll-jacking, no reveal-on-scroll, no custom cursor. Apart from one short intro as the model loads, motion only answers something you did: keys press down, layers lift, and the new theme grows out of the toggle.

## Stack

- **Framework:** Next.js 16 (App Router, static export), React 19
- **Styling:** Tailwind CSS 4, design tokens in [`globals.css`](src/app/globals.css)
- **3D:** three.js 0.186, lazy-loaded, rendered on demand (the loop stops when nothing moves)
- **Fonts:** Archivo (variable width and weight) via `next/font`
- **Hosting:** Cloudflare Workers static assets at [`shaansatsangi.com`](https://shaansatsangi.com) — Cloudflare DNS · WAF · CDN, security headers, an enforced CSP, HSTS, and an SSL Labs **A+** edge config.
- **Contact API:** a same-origin Cloudflare Worker route (`/api/contact`, see [`worker/index.ts`](worker/index.ts)) that emails via **Resend**. It has a honeypot, required-field and length validation, a streamed 24 KB body cap (room for a full-length message in a three-byte script such as Devanagari), type checks on every field, and refusal of cross-site browser requests. All of these are covered by a `node:test` suite. Rate limiting is a Cloudflare WAF rule in front of it. No CORS, no cold start.

## Layout of the code

```
src/content/            the content data: profile, projects (with their flows), skills, experience, the hero's layers
src/components/stack/   the hero model: geometry.ts (shared camera maths), scene.ts (three.js),
                        drawing.ts + StackDrawing.tsx (SVG stand-in), StackStage.tsx (callouts, caption, state)
src/app/og.png/         the social card, rendered at build time with next/og
worker/                 the Cloudflare Worker and its tests
```

## Featured projects

**Live in production**

- **Skill Issue** — AI-powered GitHub intelligence platform: a deterministic 100-point engineering score and shareable receipts, live at [skillissue.tech](https://skillissue.tech). The score is computed; the model only narrates it. *Next.js · FastAPI · Neon Postgres · Upstash Redis · Groq.*
- **Atlas** — an AI financial analyst that lives in [Telegram](https://t.me/AtlasAnalyst_bot): conversation-only, 20 Gemini-function-calling tools (the 10 that touch user data are closure-bound to one user), a four-provider quote failover chain, and briefings gated on a salience check that returns `send: false` and means it. *Python · Gemini · Postgres · SQLAlchemy.*
- **Syntrueno** — zero-trust autonomous cloud-ops swarm, [live on Cloud Run](https://syntrueno-18489510475.us-central1.run.app). Gemini agents diagnose incidents, judge their own remediation plans, and execute real infrastructure changes behind a single-use SHA-256 human gate, then re-read live state until it converges. *Python · Gemini · Cloud Run · Firestore.*
- **AI Reel Factory** — on-demand, low-cost content pipeline: researches news, writes scripts, narrates in a near-human voice, generates AI B-roll, renders captioned vertical video, and publishes YouTube Shorts to [@butitmatters](https://www.youtube.com/channel/UC5rDIoOPYLrHaf2IQ5hRlRw) after a `/makeshort` and an Approve tap in Telegram. *Python · Gemini · Cloudflare Workers AI · Supabase · FFmpeg · faster-whisper · GitHub Actions.*
- **VouchRank** — multi-tenant, white-label reputation & AI-search (AIO/GEO) SaaS for local businesses, [live](https://vouchrank.vercel.app). *React 19 · Vite · Supabase RLS · Stripe · Twilio.*
- **Think9 Brain** — grounded institutional-memory assistant, [live](https://think9-brain.vercel.app). Cites the exact source section, states a good-as-of date, withholds superseded documents; refusal recall 1.000 across 32 unanswerable questions. *Python · LangGraph · FastAPI · Groq.*

**Also shipped**

- **Telegram MCP** — local Model Context Protocol server giving AI agents read/write access to a Telegram account via MTProto. *Python · Telethon · MCP · Claude.*
- **JARVIS** — local-first voice assistant that still works offline: wake-word detection, local LLM inference (Ollama), long-term memory, streaming TTS.
- **Face Sort Studio** — local deep-learning photo organizer (OpenCV DNN: YuNet + SFace) with SQLite persistence and SSE progress.
- **YouTube Wrapped** — Databricks medallion lakehouse (Bronze → Silver → Gold) on Delta Lake, served via FastAPI + Next.js.
- **Sahaara** — mobile-first women's-safety app with one-tap SOS, MapLibre live location, and Supabase Realtime alerts to nearby users.
- **CRM + Sales Warehouse** — Airflow ETL into a star-schema PostgreSQL warehouse, surfaced via Power BI.
- **Cog & Cosmos** — pixel-art interconnected incremental/idle game; eight worlds feed one brass Fortune Engine. *Svelte 5 · TypeScript · PixiJS · PWA.*

## Local development

```bash
git clone https://github.com/Shaan-alpha/Portfolio.git && cd Portfolio
npm install
npm run dev          # http://localhost:3000
npm run build        # static export to ./out, including the social card at /og.png
npm test             # contact Worker tests (node:test)
npm run typecheck
npm run lint
```

`src/lib/buildInfo.ts` is generated from git by the `predev` / `prebuild` hooks and is not committed. The footer shows it; a build made from uncommitted changes reads `-dirty`, so commit before building a release.

---
Built by **Shaan Satsangi** · Jaipur, Rajasthan
