# Shaan Satsangi — Portfolio

A terminal/data-themed developer portfolio built with **Next.js 16**, **React 19**, and **Tailwind CSS 4**. Monospace type, a single phosphor accent, flat surfaces, and a self-built generative hero — designed to read like an engineer made deliberate choices, not like a template.

> "Clean data over clever models, and bulletproof pipelines over flashy demos."

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
- **Deploy:** GitHub Pages (`basePath: /Portfolio`) via GitHub Actions
- **Contact backend:** a small Flask service (separate repo `portfolio-backend`) with scoped CORS, per-IP rate limiting, a honeypot, and length caps.

## Featured projects

- **AI Reel Factory** — autonomous, near-$0/month content factory: researches news, writes scripts, narrates, renders captioned vertical video, and publishes 4–5 YouTube Shorts/day with one Telegram tap. *Python · Gemini · Supabase · FFmpeg · faster-whisper · edge-tts · YouTube API · GitHub Actions.*
- **Skill Issue** — AI-powered GitHub intelligence platform: a deterministic 100-point engineering score and shareable receipts. *Next.js · FastAPI · Neon Postgres · Upstash Redis · Groq.*
- **CRM + Sales Warehouse** — Airflow ETL into a star-schema PostgreSQL warehouse, surfaced via Power BI.
- **YouTube Wrapped** — Databricks medallion lakehouse (Bronze → Silver → Gold) on Delta Lake, served via FastAPI + Next.js.
- **JARVIS** — offline, privacy-first AI voice assistant with local LLM inference and semantic memory.
- **FaceFilter AI** — local face-recognition (OpenCV DNN: YuNet + SFace) with SQLite persistence and SSE progress.
- **Sahara** — mobile-first women's-safety app with gesture SOS, MapLibre live location, and Twilio alerts on Supabase.
- **Review Reader** — classical NLP sentiment pipeline (Scikit-learn + TF-IDF) in a Jupyter notebook.

## Local development

```bash
git clone https://github.com/Shaan-alpha/Portfolio.git && cd Portfolio
npm install
npm run dev          # http://localhost:3000/Portfolio
npm run build        # static export to ./out
```

Regenerate the social card after editing it:

```bash
node scripts/make-og.mjs   # writes public/og.png (1200×630)
```

---
Built by **Shaan Satsangi** · Jaipur, Rajasthan
