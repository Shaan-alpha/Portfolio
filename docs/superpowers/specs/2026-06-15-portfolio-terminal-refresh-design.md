# Portfolio Refresh — "Terminal / Data" Identity

**Date:** 2026-06-15
**Owner:** Shaan Satsangi
**Status:** Approved design — ready for implementation plan

## Goal

Three outcomes, in one coordinated pass on the existing Next.js 16 portfolio:

1. **Sync with GitHub** — add the new **AI Reel Factory** project and correct stale content.
2. **Remove the "AI-slop" signals** — the current design is, ironically, a near-textbook
   example of the AI-generated aesthetic. Shift it to a distinctive **terminal / data**
   identity that reads as deliberate human craft.
3. **Deep audit fixes** — SEO/metadata, accessibility, performance, and backend security.

**Guiding principle:** every change should read as *"a data engineer made deliberate
choices,"* never *"an AI filled in a template."*

## Locked decisions

| Decision | Choice |
|---|---|
| De-slop ambition | **Targeted refinement** — keep the bones (Lenis scroll, section structure, theme system), replace the AI-tell skin |
| Visual identity | **Terminal / data** — monospace, grid rules, one phosphor accent, flat surfaces |
| Hero | **Self-built generative canvas** — terminal-typed text in front + subtle particle network-graph behind; replaces the 14 MB watermarked Veo video |
| Light mode | **Keep**, reworked as "paper terminal" (ink on paper) |
| Deliverable | Write implementation plan, **then build it** with review checkpoints |

## Background: why this is needed

### Current stack (unchanged)
Next.js 16 (App Router, `output: "export"`, `basePath: /Portfolio`) · React 19 · Tailwind 4 ·
Framer Motion 12 · Lenis · next-themes. Deployed to **GitHub Pages** via `.github/workflows/deploy.yml`
at `https://shaan-alpha.github.io/Portfolio/` (no custom domain / CNAME).

### The AI-slop problem (research-backed)
Documented "this was built by AI" tells — blue→purple gradients, glassmorphism, blurry purple
ambient glow, floating glass cards with 3D illustrations, sparkles, side-tab accent borders,
skill-percentage bars, stat counters — and the current site hits **nearly all of them**:

- Palette is entirely indigo/purple/violet (`#5B46E0`, `#7C3AED`, `#8B5CF6`, `#6366F1`) plus a
  teal→blue→purple→pink shimmer heading gradient (`.grad-blue`).
- Glassmorphism on every surface (`bg-glass`, backdrop blur).
- `AmbientBackground` drifting `blur(90px)` blobs in blue/purple/pink.
- Hero: four floating glass cards + 3D Fluent emoji icons + a `Sparkles` twinkle layer.
- `Skills` percentage bars with invented precision (82%, 88%…); About stat counters.

### Specific defects found in the audit
- **Hero asset:** the 240-frame scroll sequence is a **Google Veo AI-generated video** — the
  `Veo` watermark is visible in the bottom-right of every frame — of a generic `</>` bracket
  (web-dev cliché; off-brand for a data engineer). ~14 MB total, ~5 MB critical before reveal.
- **SEO:** `layout.tsx` metadata has only `title` + `description`. No Open Graph, Twitter card,
  `og:image`, `metadataBase`, canonical, JSON-LD, sitemap, or robots → blank link previews.
- **A11y:** `globals.css` sets `* { cursor: none !important }` for fine pointers, which hides the
  **text caret inside the contact-form inputs**. No `focus-visible` styles. Green-on-black body
  text would fail WCAG contrast if used.
- **Content:** Review Reader's "View on GitHub" links to the profile, not a repo. About says
  "7+ Projects Shipped" — needs to reflect the new project honestly.
- **Backend security** (`portfolio-backend`, Flask on Render): `CORS(app)` is wide-open (any
  origin); `/contact` has **no rate-limiting, honeypot, or length caps** (inbox-spam / Resend-quota
  abuse vector); `/health` discloses masked owner email + config. Already fine: HTML is escaped
  via `html.escape`, secrets are in env vars, SQL uses parameterized queries.

## Design

### 1. Design system (`src/app/globals.css`)

Replace the indigo/purple-glass token set wholesale.

**Dark mode (primary)**
- `--background: #0b0d0e`; surfaces `#111417` / `#15191c`; `--foreground: #e6e8e6`; muted grays.
- Borders are hairlines: `rgba(230,232,230,0.10)` / `0.18`.
- **One** accent — phosphor green `#3fb950` (`--accent`), with an optional sparing amber
  `#d29922` for "warning/highlight" only. Remove the entire `--color-blue/purple/pink/teal/...`
  multi-accent system.
- Body text stays light-gray; green is reserved for accents, large type, and interactive states
  (green body text fails contrast).

**Light mode ("paper terminal")**
- Paper `#f4f2ec`; ink `#14171a`; deep-green accent `#1a7f4b`. Flat, no glass, no blur.

**Typography**
- Display / headings / labels / metrics → **monospace** (JetBrains Mono or IBM Plex Mono via
  `next/font`). Body prose → a clean sans (keep Outfit or switch to IBM Plex Sans).
- **Remove** `.grad-blue/.grad-purple/.grad-green` shimmer. Accent words get a solid color,
  underline, or a `█` block treatment instead.

**Surface / motif language (replaces the slop)**
- Faint graph-paper grid background (deliberate "data grid," not ambient glow).
- Box-drawing / ASCII section rules and numbered labels: `// 02 — projects ──────┼──────`.
- Section eyebrow labels as terminal prompts: `~/projects $`.
- Numeric values rendered as monospace readouts.

**Deleted components / layers**
- `Sparkles.tsx`, `AmbientBackground.tsx`, all glass/blur utilities, gradient-text utilities,
  the 3D Fluent emoji icon usage (`fluent()` / `public/fluent3d/`). Devicon brand logos stay.

### 2. Hero — self-built generative canvas

Replaces `CanvasScrollSequence` + `FrameLoaderProvider` + the 240 webp frames.

- A new real-time `<canvas>` component renders a **subtle particle network-graph**: nodes
  connected by edges with packets flowing left→right (evokes a Bronze→Silver→Gold data pipeline).
  Scroll-reactive via the existing `useScroll` wiring. Phosphor particles on near-black, a few
  hundred particles max, `requestAnimationFrame`, throttled; `prefers-reduced-motion` → render a
  static graph (no animation).
- **Foreground (in front of the graph):** mono name lockup + a live-typed status line
  (`> data engineer · ml · analytics_` with a blinking caret). CTAs become terminal/ghost
  buttons (`[ view projects ]`, `[ say hello ]`, `[ github ]`).
- Drop the four floating glass cards (optionally replace with one compact mono status row).
- `page.tsx` reworked: the 600vh sticky-canvas stage is removed; hero becomes a normal/short
  sticky section driven by the generative canvas.
- **Preloader:** replace the frame-gated preloader with a fast terminal "boot log"
  (`loading modules… ok`) that does not block on heavy assets.

### 3. Content / GitHub sync (`src/components/Projects.tsx`, `About.tsx`, `Skills.tsx`)

- **Add AI Reel Factory** as a project card:
  - Status tag `[ building ]` (its `STATUS.md` is pre-MVP — do not claim "shipped/live").
  - Description: autonomous, near-$0/month content pipeline that researches, scripts, narrates,
    renders captioned vertical video, and publishes 4–5 YouTube Shorts/day with one Telegram tap.
  - Tags: Python · Gemini · Supabase · FFmpeg · faster-whisper · edge-tts · YouTube API · GitHub Actions.
  - Link: `https://github.com/Shaan-alpha/AI-Reel-Factory`.
- **Per-project status tag system**: `[ live ]` / `[ shipped ]` / `[ building ]`, alongside the
  existing date. Replaces the bare date pill with an honest, "data-readout" status.
- **Fix Review Reader** link (point to a real repo or drop the GitHub button / label it a notebook).
- **About stats:** correct counts honestly (e.g. "8 Projects," accurate shipped-vs-building split).
- **Skills:** replace invented percentages with monospace tier tags (`core` / `strong` /
  `working`) — removes a cliché and the false precision. Tech-logo grid stays.
- New tech logos to source as needed (gemini, supabase, ffmpeg) into `public/devicon/` or an
  equivalent set; fall back to a text tag if no clean logo exists.

### 4. Technical audit fixes

**SEO / metadata (`src/app/layout.tsx` + new files)**
- `metadataBase: new URL("https://shaan-alpha.github.io/Portfolio/")`.
- Open Graph (`title`, `description`, `url`, `siteName`, `type`, `images` 1200×630), Twitter
  `summary_large_image`, `alternates.canonical`, `keywords`, `authors`.
- A generated **1200×630 OG image** (on-brand terminal card) committed under `public/`.
- JSON-LD `Person` structured data injected in the layout.
- Static-export-friendly `sitemap` and `robots`.

**Accessibility**
- Stop hiding the caret in form fields: scope `cursor: none` to exclude `input`, `textarea`, and
  `[contenteditable]` (or gate the whole custom-cursor behavior behind a setting). Keep the
  custom cursor for non-text surfaces only.
- Add visible `:focus-visible` styles across interactive elements.
- Verify WCAG AA contrast for all text/accent pairings in both themes.
- `prefers-reduced-motion` honored by the new hero canvas and any new motion.

**Performance**
- Headline win: deleting ~14 MB of frames + the loader. Re-run Lighthouse afterward; confirm
  no regressions; keep `next/font` swap and lazy-loading below the fold.

**Backend security (`portfolio-backend` repo — separate)**
- Restrict `CORS` to the portfolio origin(s) only (no `*`).
- Add a **honeypot field** + **server-side rate-limiting** (per-IP) + **length caps** on
  `/contact`; add the matching hidden honeypot input on the client form.
- Trim `/health` so it does not echo owner-email hint / config in production.
- Note (reliability, not security): SQLite on Render's ephemeral FS loses data on redeploy —
  flag for the owner; out of scope to migrate unless requested.

### 5. Cleanup
- Remove dead components and unused assets after the swap (`Sparkles`, `AmbientBackground`,
  `FrameLoaderProvider`, `CanvasScrollSequence`, `public/frames-webp/`, `public/fluent3d/` if
  fully unused).
- Update `README.md` — its "Apple-like glassmorphic / vibrant gradients / Data Unicorn" copy now
  contradicts the terminal identity; rewrite to match.

## What we deliberately keep
Lenis smooth scroll · theme toggle (restyled, both modes) · scroll progress · custom cursor
(accessibility-fixed) · Framer Motion (toned down — less stagger drama) · the overall section
structure (Hero, About, Skills, Projects, Experience, Certifications, Contact, Footer) · devicon
brand logos.

## Build sequence (detail goes in the implementation plan)
1. Design tokens + typography + remove slop layers (`globals.css`, delete `Sparkles`/`AmbientBackground`).
2. Generative hero canvas + remove the 240-frame system + rework `page.tsx` + new preloader.
3. Content: AI Reel Factory card, status-tag system, Review Reader fix, About stats, Skills tiers.
4. SEO: metadata, OG image, JSON-LD, sitemap/robots.
5. A11y + cursor fix + perf/Lighthouse pass.
6. Backend hardening (CORS, honeypot, rate-limit, length caps, `/health`).
7. README rewrite + final verification (build, Lighthouse, manual review in both themes).

## Out of scope (for now)
- Adding other newer repos (Cog-and-Cosmos, gemini-mcp, cowork-to-code-bridge).
- Migrating the backend off SQLite/Render.
- A full rewrite of the section structure or a non-terminal aesthetic.

## Open items to confirm during implementation
- Exact mono font choice (JetBrains Mono vs IBM Plex Mono).
- Final phosphor accent hex and whether the amber secondary is used at all.
- Whether to keep a (short) sticky-scroll hero stage or a standard-height hero.
