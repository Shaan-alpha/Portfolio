# Portfolio "Terminal / Data" Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the AI-slop indigo/purple-glass aesthetic with a deliberate terminal/data identity, ship a self-built generative hero (replacing a 14 MB watermarked Veo video), add the completed AI Reel Factory project, and fix SEO / accessibility / performance / backend-security defects.

**Architecture:** Same Next.js 16 static-export app (`output: "export"`, `basePath: /Portfolio`, GitHub Pages). We swap the CSS token system, fonts, and component skins; replace the frame-sequence hero with a real-time `<canvas>` network-graph + typed terminal text; restyle content components; expand metadata; and harden the separate `portfolio-backend` Flask service.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, Framer Motion 12, Lenis, next-themes, `next/font` (JetBrains Mono), Flask + flask-limiter (backend).

**Verification model (no unit-test harness exists in this repo):** each task is verified by `npm run build` (must succeed), `npm run lint` (must pass), and the stated **visual check** via `npm run dev`. A final task runs Lighthouse. The backend task uses a local Flask run + curl.

**Locked choices (resolved from spec open items):**
- Mono/display font: **JetBrains Mono**; body prose: keep **Outfit**.
- Accent: phosphor **`#3fb950`** (dark) / deep green **`#1a7f4b`** (light). No amber secondary in v1.
- Hero: standard-height section (no 600vh stage); generative canvas behind, typed text in front.

**Branch:** `terminal-refresh` (already created; spec committed there).

---

## File map

**Create**
- `src/components/HeroNetworkCanvas.tsx` — real-time particle network-graph background.
- `src/components/TypedLine.tsx` — reusable typing-effect status line.
- `src/app/robots.ts` — static robots route.
- `src/app/sitemap.ts` — static sitemap route.
- `scripts/make-og.mjs` — rasterizes an on-brand SVG to `public/og.png` (1200×630).
- `public/og.png` — generated Open Graph image.

**Modify**
- `src/app/globals.css` — full token + utility rewrite (the core swap).
- `src/app/layout.tsx` — fonts (JetBrains Mono), full metadata, JSON-LD.
- `src/app/page.tsx` — remove `CanvasScrollSequence` stage; render new `Hero`.
- `src/components/Hero.tsx` — terminal hero (canvas + typed text + ghost CTAs).
- `src/components/Preloader.tsx` — terminal boot log, no frame gating.
- `src/components/Projects.tsx` — terminal skin, status tags, **add AI Reel Factory**.
- `src/components/About.tsx` — terminal skin, honest stats, mono monogram (drop 3D emoji).
- `src/components/Skills.tsx` — replace % bars with tier tags; terminal skin.
- `src/components/Navbar.tsx`, `Contact.tsx`, `Experience.tsx`, `Certifications.tsx`, `Footer.tsx`, `SectionDivider.tsx`, `ThemeToggle.tsx`, `CustomCursor.tsx`, `ScrollProgress.tsx` — skin to terminal tokens; Contact also gains a honeypot field.
- `src/lib/techIcons.tsx` — drop `fluent()`; add supabase/gemini logos to `TECH`.
- `README.md` — rewrite to the terminal identity.

**Delete**
- `src/components/CanvasScrollSequence.tsx`, `src/components/FrameLoaderProvider.tsx`, `src/components/Sparkles.tsx`, `src/components/AmbientBackground.tsx`.
- `public/frames-webp/` (240 files, ~14 MB), `public/fluent3d/` (if unused after restyle).

**Separate repo (`portfolio-backend`)**
- `app.py` — scoped CORS, honeypot, rate-limit, length caps, trimmed `/health`.
- `requirements.txt` — add `Flask-Limiter`.

---

## Phase 1 — Design system (tokens, fonts, kill slop)

### Task 1: Rewrite the CSS token system + utilities

**Files:**
- Modify: `src/app/globals.css` (full rewrite)

- [ ] **Step 1: Replace `:root` / `.dark` / `@theme` blocks** with the terminal token set:

```css
@import "tailwindcss";
@variant dark (&:where(.dark, .dark *));

:root {
  /* Light — "paper terminal": ink on warm paper, flat, no glass */
  --background: #f4f2ec;
  --foreground: #14171a;
  --bg1: #efece3;
  --bg2: #e7e3d8;
  --surface: #faf8f2;
  --border: rgba(20, 23, 26, 0.14);
  --border2: rgba(20, 23, 26, 0.26);
  --muted: rgba(20, 23, 26, 0.58);
  --muted2: rgba(20, 23, 26, 0.80);
  --accent: #1a7f4b;
  --accent-dim: rgba(26, 127, 75, 0.14);
  --grid: rgba(20, 23, 26, 0.05);
  --r: 8px; --r2: 12px;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
}

.dark {
  --background: #0b0d0e;
  --foreground: #e6e8e6;
  --bg1: #111417;
  --bg2: #15191c;
  --surface: #111417;
  --border: rgba(230, 232, 230, 0.10);
  --border2: rgba(230, 232, 230, 0.20);
  --muted: rgba(230, 232, 230, 0.50);
  --muted2: rgba(230, 232, 230, 0.74);
  --accent: #3fb950;
  --accent-dim: rgba(63, 185, 80, 0.16);
  --grid: rgba(230, 232, 230, 0.05);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-bg1: var(--bg1);
  --color-bg2: var(--bg2);
  --color-surface: var(--surface);
  --color-border: var(--border);
  --color-border2: var(--border2);
  --color-muted: var(--muted);
  --color-muted2: var(--muted2);
  --color-accent: var(--accent);
  --color-accent-dim: var(--accent-dim);
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;
  --font-sans: var(--font-outfit), system-ui, sans-serif;
  --font-display: var(--font-jetbrains), ui-monospace, monospace;
  --shadow-card: none;
}
```

- [ ] **Step 2: Replace the body + utility layer.** Body uses sans by default; remove `cursor: none` globally (handled in Step 3). Replace `.display` with a mono treatment, add the grid + scanline + ASCII-rule + accent utilities, and **delete** `.grad-blue/.grad-purple/.grad-green`, `.text-glow`, `.sparkle`/`@keyframes twinkle`, `.ambient-blob`, and the `canvas.canvas-filter-wrap` rules:

```css
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  overflow-x: hidden;
}
::selection { background: var(--accent-dim); color: var(--foreground); }

.display {
  font-family: var(--font-display);
  font-size: clamp(40px, 6vw, 84px);
  font-weight: 700;
  line-height: 1.0;
  letter-spacing: -0.04em;
}
.mono { font-family: var(--font-mono); }
.accent { color: var(--accent); }

/* graph-paper grid (deliberate data grid, not ambient glow) */
.grid-bg {
  background-image:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 36px 36px;
}

/* terminal section eyebrow: "~/projects $" */
.eyebrow {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--muted2);
}
.eyebrow::before { content: "~/"; color: var(--accent); }
.eyebrow::after { content: " $"; color: var(--accent); }

/* blinking caret */
.caret { display:inline-block; width:0.6ch; background: var(--accent); animation: blink 1.1s steps(1) infinite; }
@keyframes blink { 0%,50% { opacity:1 } 50.01%,100% { opacity:0 } }
```

- [ ] **Step 3: Accessibility cursor fix** — keep the hidden-cursor effect for non-text surfaces but restore the caret in form fields, and add focus-visible:

```css
@media (pointer: fine) {
  body { cursor: none; }
  a, button, [role="button"] { cursor: none; }
  input, textarea, select, [contenteditable] { cursor: auto !important; }
}
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }

[data-nextjs-dialog-overlay], nextjs-portal, [data-nextjs-toast] { display: none !important; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Build + lint.**
Run: `npm run build && npm run lint`
Expected: build succeeds (components still reference old tokens like `bg-glass`; Tailwind will treat unknown `bg-glass` as no-op classes — acceptable until restyled in later tasks). If build fails on a removed `@theme` key referenced in CSS, fix the reference. Lint passes.

- [ ] **Step 5: Commit.**
```bash
git add src/app/globals.css
git commit -m "style: terminal/data design tokens, kill gradient/glass/sparkle utilities, fix caret a11y"
```

### Task 2: Swap fonts to JetBrains Mono (+ keep Outfit)

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace the font imports/instances.** Swap `DM_Mono` for `JetBrains_Mono`; keep `Outfit` for body. Update the `<html>` className to expose `--font-jetbrains` and `--font-outfit`:

```tsx
import { Outfit, JetBrains_Mono } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", weight: ["300","400","500","600"] });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", weight: ["400","500","600","700"] });
```
In `<html className={...}>` use `${outfit.variable} ${jetbrains.variable} h-full antialiased no-scrollbar`.
In `<body>` change `font-outfit` → `font-sans`.

- [ ] **Step 2: Build + lint.**
Run: `npm run build && npm run lint`
Expected: succeeds. Visual check (`npm run dev`): headings now render in JetBrains Mono.

- [ ] **Step 3: Commit.**
```bash
git add src/app/layout.tsx
git commit -m "feat: JetBrains Mono display/labels, Outfit body"
```

### Task 3: Delete slop layers (Sparkles, AmbientBackground)

**Files:**
- Delete: `src/components/Sparkles.tsx`, `src/components/AmbientBackground.tsx`
- Modify: `src/app/page.tsx` (remove `AmbientBackground` import/usage), `src/components/Hero.tsx` (remove `Sparkles` import/usage — Hero is fully rewritten in Phase 2, so this is interim)

- [ ] **Step 1:** Remove `<AmbientBackground />` and its import from `page.tsx`. Remove `<Sparkles />` and its import from `Hero.tsx`. Delete both component files.

- [ ] **Step 2: Build + lint.**
Run: `npm run build && npm run lint`
Expected: succeeds, no missing-import errors.

- [ ] **Step 3: Commit.**
```bash
git add -A
git commit -m "refactor: remove Sparkles + AmbientBackground (AI-slop layers)"
```

---

## Phase 2 — Generative hero (replace the 14 MB Veo frame system)

### Task 4: Build the network-graph canvas

**Files:**
- Create: `src/components/HeroNetworkCanvas.tsx`

- [ ] **Step 1: Write the canvas component.** A layered node graph (pipeline columns) with packets flowing left→right; faint edges; reduced-motion → static single paint. DPR-aware, resizes, cleans up rAF.

```tsx
"use client";
import { useEffect, useRef } from "react";

type Node = { x: number; y: number; r: number };
type Packet = { from: number; to: number; t: number; speed: number };

export default function HeroNetworkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#3fb950";

    let raf = 0;
    let w = 0, h = 0, dpr = 1;
    const COLS = 5;             // pipeline stages
    const PER = [2, 4, 4, 3, 1]; // nodes per stage (source -> bronze -> silver -> gold -> sink)
    let nodes: Node[] = [];
    let edges: [number, number][] = [];
    let packets: Packet[] = [];

    const build = () => {
      nodes = []; edges = [];
      const colStarts: number[] = [];
      for (let c = 0; c < COLS; c++) {
        colStarts[c] = nodes.length;
        const n = PER[c];
        for (let i = 0; i < n; i++) {
          nodes.push({
            x: ((c + 0.5) / COLS) * w,
            y: ((i + 0.5) / n) * h * 0.7 + h * 0.15,
            r: c === 0 || c === COLS - 1 ? 3.5 : 2.5,
          });
        }
      }
      for (let c = 0; c < COLS - 1; c++) {
        const a0 = colStarts[c], a1 = colStarts[c + 1], an = PER[c], bn = PER[c + 1];
        for (let i = 0; i < an; i++)
          for (let j = 0; j < bn; j++)
            if ((i + j) % 2 === 0) edges.push([a0 + i, a1 + j]);
      }
      packets = edges.map((_, i) => ({
        from: edges[i][0], to: edges[i][1],
        t: (i % 7) / 7, speed: 0.0016 + (i % 5) * 0.0004,
      }));
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduce) draw(); // single static paint
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // edges
      ctx.strokeStyle = accent; ctx.globalAlpha = 0.12; ctx.lineWidth = 1;
      for (const [a, b] of edges) {
        ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
      }
      // nodes
      ctx.globalAlpha = 0.9; ctx.fillStyle = accent;
      for (const n of nodes) { ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill(); }
      // packets
      for (const p of packets) {
        const a = nodes[p.from], b = nodes[p.to];
        const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
        ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      for (const p of packets) { p.t += p.speed; if (p.t > 1) p.t -= 1; }
      draw();
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reduce) raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 w-full h-full" />;
}
```

- [ ] **Step 2: Build + lint.** Run: `npm run build && npm run lint` → succeeds (component not yet used; no errors).

- [ ] **Step 3: Commit.**
```bash
git add src/components/HeroNetworkCanvas.tsx
git commit -m "feat: real-time network-graph hero canvas (reduced-motion safe)"
```

### Task 5: Typed status line component

**Files:**
- Create: `src/components/TypedLine.tsx`

- [ ] **Step 1: Write the typing-effect component** (reduced-motion → shows full text immediately; cycles through phrases):

```tsx
"use client";
import { useEffect, useState } from "react";

export default function TypedLine({ phrases, className }: { phrases: string[]; className?: string }) {
  const [out, setOut] = useState("");
  const [i, setI] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setOut(phrases[0]); return; }
    const full = phrases[i % phrases.length];
    const done = out === full;
    const empty = out === "";
    const delay = del ? 40 : done ? 1600 : 70;
    const id = setTimeout(() => {
      if (!del && done) setDel(true);
      else if (del && empty) { setDel(false); setI((v) => v + 1); }
      else setOut(del ? full.slice(0, out.length - 1) : full.slice(0, out.length + 1));
    }, delay);
    return () => clearTimeout(id);
  }, [out, del, i, phrases]);

  return <span className={className}>{out}<span className="caret">&nbsp;</span></span>;
}
```

- [ ] **Step 2: Build + lint** → succeeds.
- [ ] **Step 3: Commit.**
```bash
git add src/components/TypedLine.tsx
git commit -m "feat: TypedLine typing-effect status line"
```

### Task 6: Rewrite Hero to terminal layout

**Files:**
- Modify: `src/components/Hero.tsx`

- [ ] **Step 1: Replace Hero** with: full-height section, `grid-bg` + `HeroNetworkCanvas` behind, foreground mono name lockup, a `TypedLine` role line, and ghost-style CTAs. Remove the floating glass cards, `useScroll` parallax of `fluent()` cards, and `Sparkles`.

```tsx
"use client";
import HeroNetworkCanvas from "./HeroNetworkCanvas";
import TypedLine from "./TypedLine";

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden grid-bg">
      <div className="absolute inset-0 opacity-70"><HeroNetworkCanvas /></div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background pointer-events-none" />
      <div className="relative z-10 max-w-[1100px] mx-auto px-[6vw] w-full">
        <div className="eyebrow mb-5">whoami</div>
        <h1 className="display">
          Shaan Satsangi<span className="accent">.</span>
        </h1>
        <p className="mono text-[clamp(13px,1.8vw,18px)] text-muted2 mt-6">
          <span className="accent">&gt; </span>
          <TypedLine phrases={["data engineer", "ml / analytics", "pipelines over demos"]} />
        </p>
        <div className="flex flex-wrap gap-3 mt-9">
          <a href="#projects" className="mono text-[13px] px-5 py-2.5 border border-accent text-accent hover:bg-accent hover:text-background transition-colors duration-200 rounded-[var(--r)]">[ view projects ]</a>
          <a href="mailto:shaansatsangi@gmail.com" className="mono text-[13px] px-5 py-2.5 border border-border2 text-muted2 hover:text-foreground hover:border-foreground/40 transition-colors duration-200 rounded-[var(--r)]">[ say hello ]</a>
          <a href="https://github.com/Shaan-alpha" target="_blank" rel="noreferrer" className="mono text-[13px] px-5 py-2.5 border border-border2 text-muted2 hover:text-foreground hover:border-foreground/40 transition-colors duration-200 rounded-[var(--r)]">[ github ]</a>
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 mono text-[10px] tracking-[0.2em] uppercase text-muted">scroll ↓</div>
    </section>
  );
}
```

- [ ] **Step 2: Build + lint** → succeeds. Visual check: hero shows animated graph + typed line, no glass/sparkle.
- [ ] **Step 3: Commit.**
```bash
git add src/components/Hero.tsx
git commit -m "feat: terminal hero (network canvas + typed line + ghost CTAs)"
```

### Task 7: Remove the frame-sequence system + rework page.tsx + Preloader

**Files:**
- Delete: `src/components/CanvasScrollSequence.tsx`, `src/components/FrameLoaderProvider.tsx`, `public/frames-webp/`
- Modify: `src/app/page.tsx`, `src/app/layout.tsx` (remove `FrameLoaderProvider`), `src/components/Preloader.tsx`

- [ ] **Step 1: Rework `page.tsx`** — drop `CanvasScrollSequence` wrapper; render `<Hero />` directly:

```tsx
export default function Home() {
  return (
    <main className="relative min-h-screen">
      <div id="home" className="absolute top-0 left-0 w-full h-screen pointer-events-none" />
      <ThemeToggle />
      <Hero />
      <Navbar />
      <div className="relative overflow-hidden">
        <About />
        <SectionDivider />
        <Skills />
        <SectionDivider />
        <Projects />
        <SectionDivider />
        <Experience />
        <Certifications />
        <SectionDivider />
        <Contact />
        <Footer />
      </div>
    </main>
  );
}
```
Remove the `CanvasScrollSequence` and `AmbientBackground` imports.

- [ ] **Step 2: Rewrite `Preloader.tsx`** to a fast terminal boot log that gates only on `document` ready (no frame dependency). It must not import `useFrameLoader`. Minimal version:

```tsx
"use client";
import { useEffect, useState } from "react";

const LINES = ["booting…", "loading modules", "mounting ui", "ready ✓"];

export default function Preloader() {
  const [done, setDone] = useState(false);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDone(true); return; }
    if (n >= LINES.length) { const t = setTimeout(() => setDone(true), 250); return () => clearTimeout(t); }
    const t = setTimeout(() => setN((v) => v + 1), 180);
    return () => clearTimeout(t);
  }, [n]);
  if (done) return null;
  return (
    <div className="fixed inset-0 z-[10000] bg-background flex items-center justify-center">
      <div className="mono text-[13px] text-muted2 space-y-1">
        {LINES.slice(0, n).map((l, i) => (
          <div key={i}><span className="accent">$</span> {l}</div>
        ))}
        <span className="caret">&nbsp;</span>
      </div>
    </div>
  );
}
```
In `layout.tsx`, remove the `FrameLoaderProvider` import and unwrap it (keep `<Preloader/>`, `<ScrollProgress/>`, `<CustomCursor/>`, `<SmoothScroll/>`, `{children}` inside `ThemeProvider`).

- [ ] **Step 3: Delete files.** `git rm` the two components and the entire `public/frames-webp/` directory.

- [ ] **Step 4: Build + lint.** Run: `npm run build && npm run lint`
Expected: succeeds; confirm `out/` no longer contains `frames-webp`. Verify `du -sh out` dropped by ~14 MB.

- [ ] **Step 5: Commit.**
```bash
git add -A
git commit -m "perf: remove 240-frame Veo sequence + loader (-14MB), terminal boot preloader"
```

---

## Phase 3 — Content / GitHub sync

### Task 8: techIcons — drop fluent, add brand logos

**Files:**
- Modify: `src/lib/techIcons.tsx`
- Add (if downloadable): `public/devicon/supabase.svg`, `public/devicon/googlegemini.svg` (else skip; text fallback is fine)

- [ ] **Step 1:** Remove the `fluent()` export (no longer used after Hero/About/Skills/Projects restyle). Add entries to `TECH` for the new project's stack that have logos: `supabase`, `gemini`/`google gemini`, `github actions`, `ffmpeg`. Where no clean SVG exists, omit — `lookupTech` returns `null` and the tag renders text-only (already supported).

- [ ] **Step 2:** If adding logos, download official SVGs into `public/devicon/` (verify license). Otherwise rely on text fallback.

- [ ] **Step 3: Build + lint** → succeeds (after Tasks 9–11 remove `fluent` callers; if doing this task first, keep `fluent` until callers are gone, then delete in Task 11). **Order note:** perform Step-1 deletion of `fluent` only after Tasks 9–11; here just add `TECH` entries.

- [ ] **Step 4: Commit.**
```bash
git add src/lib/techIcons.tsx public/devicon
git commit -m "feat: add supabase/gemini tech logos for AI Reel Factory"
```

### Task 9: Projects — terminal skin, status tags, add AI Reel Factory

**Files:**
- Modify: `src/components/Projects.tsx`

- [ ] **Step 1: Add a `status` field** to each project (`"live" | "shipped" | "building"`) and **prepend the AI Reel Factory entry**:

```ts
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
}
```

- [ ] **Step 2: Remove the color system** (`colors.accent/glow/badgeText`, `--proj-accent`, `proj-spotlight`, `onPointerMove` spotlight). Replace card classes: flat `bg-surface border border-border rounded-[var(--r2)]`, hover `border-accent/50` + subtle `-translate-y-1`, no glass/blur. Replace the date pill with a status tag + date in mono:

```tsx
<div className="flex items-center gap-2 mb-3 mono text-[10px]">
  <span className={`px-2 py-0.5 border ${proj.status === "building" ? "border-border2 text-muted2" : "border-accent text-accent"}`}>
    [ {proj.status} ]
  </span>
  <span className="text-muted">{proj.date}</span>
</div>
```
Replace the 3D `fluent(proj.img)` image header with a mono index header, e.g. `0{i+1} / {title}` or a small ASCII frame; remove `img`/`fluent` usage. Tags keep `lookupTech`/`TechLogo`. Title uses `font-display`. Buttons become ghost/mono `[ view on github ↗ ]` / `[ live ↗ ]`.

- [ ] **Step 3: Remove `review-reader`'s dead link** — point `link` to a real repo if one exists, else drop the `link` and render only the description (no GitHub button) and add a `note: "notebook project"`.

- [ ] **Step 4: Build + lint** → succeeds. Visual: 8 cards, AI Reel Factory first, status tags, no glass/spotlight.

- [ ] **Step 5: Commit.**
```bash
git add src/components/Projects.tsx
git commit -m "feat: add AI Reel Factory, status tags, terminal project cards; fix dead link"
```

### Task 10: About — honest stats + mono monogram

**Files:**
- Modify: `src/components/About.tsx`

- [ ] **Step 1:** Replace the floating-avatar 3D `fluent("technologist")` with a mono monogram block (`[ SS ]` in a bordered square) or initials; remove `fluent` import. Flat card (`bg-surface border border-border`, no glass/gradient/`animate-avatarFloat`). Keep contact links (restyle to flat + mono labels).

- [ ] **Step 2: Update the stat counters** to honest values in mono: `8` Projects Shipped, `2` Internships, `5+` Certifications. Remove `grad-blue/grad-purple/grad-green` classes (now deleted) → use `accent`/`foreground`.

- [ ] **Step 3:** Restyle the skill chips (`bg-glass`→`bg-surface`, mono). Keep copy but drop "Data Unicorn" flourish only if desired (optional; keep for now).

- [ ] **Step 4: Build + lint** → succeeds.
- [ ] **Step 5: Commit.**
```bash
git add src/components/About.tsx
git commit -m "feat: terminal About — mono monogram, honest stats, flat surfaces"
```

### Task 11: Skills — tier tags instead of fake %; remove fluent

**Files:**
- Modify: `src/components/Skills.tsx`
- Modify: `src/lib/techIcons.tsx` (now safe to delete `fluent` export)

- [ ] **Step 1: Replace the `val` percentages** with a `tier: "core" | "strong" | "working"` per item. Render the bar row as a label + mono tier tag (no animated width bar, no invented numbers):

```tsx
<div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
  <span className="text-[13px] text-muted2">{item.name}</span>
  <span className="mono text-[10px] accent">{item.tier}</span>
</div>
```
Map existing items to tiers (e.g. `Scikit-learn/Pandas` → core; `Databricks/Delta Lake` → working), preserving the four category groups. Replace category header `fluent(cat.img)` with a mono label (e.g. `> data_engineering`). Restyle cards flat.

- [ ] **Step 2:** Keep the devicon tool grid (it's real/on-brand); restyle tiles flat (`bg-surface border-border`, mono labels).

- [ ] **Step 3: Delete the now-unused `fluent` export** from `techIcons.tsx`. Grep to confirm zero `fluent(` callers remain: `grep -rn "fluent(" src` → no results.

- [ ] **Step 4: Build + lint** → succeeds. Confirm `public/fluent3d/` is unreferenced; `git rm -r public/fluent3d`.

- [ ] **Step 5: Commit.**
```bash
git add -A
git commit -m "feat: Skills tier tags (drop fake %), remove fluent 3D icons (-cleanup)"
```

### Task 12: Skin remaining components

**Files:**
- Modify: `Navbar.tsx`, `Contact.tsx`, `Experience.tsx`, `Certifications.tsx`, `Footer.tsx`, `SectionDivider.tsx`, `ThemeToggle.tsx`, `ScrollProgress.tsx`, `CustomCursor.tsx`

- [ ] **Step 1:** Replace `bg-glass`/`bg-glass2`/glass borders with `bg-surface`/`border-border`; replace any `grad-*`/`text-glow`/`color-blue|purple|pink|teal` classes with `accent`/`foreground`/`muted`. `CustomCursor` ring/dot use `border-accent`/`bg-accent`. `ScrollProgress` bar uses `bg-accent`. Section eyebrows across components adopt the `.eyebrow` class. `SectionDivider` becomes an ASCII rule, e.g. a centered mono `────────┼────────` or a labeled `// section`.

- [ ] **Step 2:** `ThemeToggle` — keep the view-transition reveal; restyle icon/colors to accent; ensure it still toggles `.dark`. Note: the `::view-transition` CSS in globals was removed — re-add a minimal version if the toggle relied on it, or let it cross-fade by default. (Re-add the `::view-transition-old/new(root)` block if needed.)

- [ ] **Step 3:** `Contact.tsx` — restyle inputs flat/mono; the success toast uses accent. (Honeypot field added in Task 16.)

- [ ] **Step 4: Build + lint** → succeeds. Visual: scan every section in both light/dark for stray purple/glass.
- [ ] **Step 5: Commit.**
```bash
git add -A
git commit -m "style: skin nav/contact/experience/certs/footer/divider/toggle/cursor to terminal tokens"
```

---

## Phase 4 — SEO / metadata

### Task 13: Expand metadata + JSON-LD

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace the `metadata` export** with a full set (uses the generated `public/og.png` from Task 15):

```tsx
const SITE = "https://shaan-alpha.github.io/Portfolio";
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Shaan Satsangi · Data Engineer",
  description: "Data engineer building bulletproof pipelines and shipping AI/ML + analytics projects. Airflow, Spark, dbt, FastAPI, and more.",
  keywords: ["Shaan Satsangi","data engineer","ML","analytics","Airflow","dbt","FastAPI","portfolio"],
  authors: [{ name: "Shaan Satsangi", url: SITE }],
  alternates: { canonical: SITE },
  openGraph: {
    type: "website", url: SITE, siteName: "Shaan Satsangi",
    title: "Shaan Satsangi · Data Engineer",
    description: "Bulletproof pipelines over flashy demos. Data engineering, ML, and analytics.",
    images: [{ url: "/Portfolio/og.png", width: 1200, height: 630, alt: "Shaan Satsangi — Data Engineer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shaan Satsangi · Data Engineer",
    description: "Bulletproof pipelines over flashy demos. Data engineering, ML, and analytics.",
    images: ["/Portfolio/og.png"],
  },
};
```
(Note: `images` paths include the `/Portfolio` basePath because static-export does not auto-prefix metadata image URLs.)

- [ ] **Step 2: Add JSON-LD** `Person` via a `<script type="application/ld+json">` in the `<body>` (dangerouslySetInnerHTML with name, url, jobTitle "Data Engineer", sameAs GitHub/LinkedIn, email).

- [ ] **Step 3: Build + lint** → succeeds. Inspect `out/index.html` for the OG/twitter/canonical tags + JSON-LD.
- [ ] **Step 4: Commit.**
```bash
git add src/app/layout.tsx
git commit -m "feat(seo): open graph, twitter card, canonical, JSON-LD Person"
```

### Task 14: robots + sitemap routes

**Files:**
- Create: `src/app/robots.ts`, `src/app/sitemap.ts`

- [ ] **Step 1:** Add the two metadata routes (static-export compatible — Next emits `robots.txt`/`sitemap.xml` into `out/`):

```ts
// robots.ts
import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: "https://shaan-alpha.github.io/Portfolio/sitemap.xml" };
}
```
```ts
// sitemap.ts
import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://shaan-alpha.github.io/Portfolio/", changeFrequency: "monthly", priority: 1 }];
}
```

- [ ] **Step 2: Build** → confirm `out/robots.txt` and `out/sitemap.xml` exist.
- [ ] **Step 3: Commit.**
```bash
git add src/app/robots.ts src/app/sitemap.ts
git commit -m "feat(seo): static robots.txt + sitemap.xml"
```

### Task 15: Generate the OG image

**Files:**
- Create: `scripts/make-og.mjs`, `public/og.png`

- [ ] **Step 1: Add `sharp` as a dev dep** for SVG→PNG rasterization: `npm i -D sharp`.

- [ ] **Step 2: Write `scripts/make-og.mjs`** that renders an on-brand terminal card SVG (near-black bg, faint grid, mono name + `> data engineer`, green accent prompt) at 1200×630 and writes `public/og.png`:

```js
import sharp from "sharp";
import { writeFileSync } from "node:fs";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0b0d0e"/>
  <g fill="none" stroke="rgba(230,232,230,0.05)">${
    Array.from({length: 34}, (_, i) => `<line x1="${i*36}" y1="0" x2="${i*36}" y2="630"/>`).join("") +
    Array.from({length: 18}, (_, i) => `<line x1="0" y1="${i*36}" x2="1200" y2="${i*36}"/>`).join("")
  }</g>
  <text x="80" y="300" font-family="monospace" font-size="72" font-weight="700" fill="#e6e8e6">Shaan Satsangi<tspan fill="#3fb950">.</tspan></text>
  <text x="80" y="370" font-family="monospace" font-size="30" fill="#9aa0a6"><tspan fill="#3fb950">&gt; </tspan>data engineer · ml · analytics</text>
  <text x="80" y="560" font-family="monospace" font-size="22" fill="#3fb950">~/portfolio $ _</text>
</svg>`;
const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(new URL("../public/og.png", import.meta.url), png);
console.log("wrote public/og.png");
```

- [ ] **Step 3: Run it.** `node scripts/make-og.mjs` → confirm `public/og.png` is 1200×630.
- [ ] **Step 4: Build** → confirm `out/og.png` exists. (Add `scripts/make-og.mjs` run to README dev notes; optional `prebuild` hook is out of scope.)
- [ ] **Step 5: Commit.**
```bash
git add scripts/make-og.mjs public/og.png package.json package-lock.json
git commit -m "feat(seo): generate on-brand 1200x630 og.png"
```

---

## Phase 5 — A11y / performance verification

### Task 16: Contact honeypot (client) + a11y sweep

**Files:**
- Modify: `src/components/Contact.tsx`

- [ ] **Step 1: Add a hidden honeypot field** the backend will check (visually hidden, not `display:none` so bots fill it; excluded from tab order + a11y):

```tsx
<input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden
  className="absolute left-[-9999px] w-px h-px opacity-0" />
```
The existing `handleSubmit` already serializes all fields via `FormData`, so `company` is included automatically.

- [ ] **Step 2: A11y sweep** — confirm form inputs show a caret (cursor fix from Task 1), every interactive element has visible `:focus-visible`, images have `alt`, and the canvas is `aria-hidden`. Add `aria-label` to icon-only links (theme toggle, social icons).

- [ ] **Step 3: Build + lint** → succeeds.
- [ ] **Step 4: Commit.**
```bash
git add src/components/Contact.tsx
git commit -m "feat(a11y): contact honeypot field + focus/aria sweep"
```

### Task 17: Build size + Lighthouse pass

- [ ] **Step 1:** `npm run build` then measure: `du -sh out` (expect a large drop from removing frames). Confirm no `frames-webp`/`fluent3d` in `out`.
- [ ] **Step 2:** `npx serve out -l 4000` (or `npm run dev`) and run Lighthouse (Chrome DevTools or `npx lighthouse http://localhost:4000/Portfolio --view`). Target: Performance ≥ 90, Accessibility ≥ 95, Best-Practices/SEO ≥ 95.
- [ ] **Step 3:** Address any flagged regressions (e.g. contrast, missing labels), re-commit if changes made.
```bash
git commit -am "perf/a11y: lighthouse fixes" # only if changes
```

---

## Phase 6 — Backend hardening (separate repo `portfolio-backend`)

> This is a **different repository**. Work in a local clone; pushing is an outward action — prepare the diff and **confirm with the owner before pushing**.

### Task 18: Harden the Flask contact service

**Files (in `portfolio-backend`):**
- Modify: `app.py`, `requirements.txt`

- [ ] **Step 1: Clone** (if not local): `git clone https://github.com/Shaan-alpha/portfolio-backend` into a sibling dir; create branch `harden-contact`.

- [ ] **Step 2: Scope CORS** — replace `CORS(app)` with an allowlist:

```python
ALLOWED_ORIGINS = [o for o in env_value("ALLOWED_ORIGINS",
    "https://shaan-alpha.github.io,http://localhost:3000").split(",") if o]
CORS(app, resources={r"/contact": {"origins": ALLOWED_ORIGINS},
                     r"/health": {"origins": ALLOWED_ORIGINS}}, methods=["GET", "POST"])
```

- [ ] **Step 3: Add rate limiting** — add `Flask-Limiter` to `requirements.txt`, then:

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
limiter = Limiter(get_remote_address, app=app, default_limits=[])
```
Decorate the route: `@limiter.limit("5 per hour; 2 per minute")` above `def contact():`.

- [ ] **Step 4: Honeypot + length caps** inside `contact()` after parsing fields:

```python
if (data.get("company") or "").strip():       # honeypot filled => bot
    return jsonify({"status": "success"}), 200  # silently accept, drop
LIMITS = {"name": 100, "email": 200, "subject": 150, "message": 5000}
for field, cap in LIMITS.items():
    if len(locals()[field]) > cap:
        return jsonify({"status": "error", "message": f"{field} too long"}), 400
```

- [ ] **Step 5: Trim `/health`** — remove `owner_email_hint` and `from_email` from the JSON (keep `status` + booleans).

- [ ] **Step 6: Verify locally** — `pip install -r requirements.txt`, run `flask --app app run`, then:
```bash
curl -s -X POST localhost:5000/contact -H 'Content-Type: application/json' -d '{"name":"a","email":"a@b.com","message":"hi"}'   # 200
curl -s -X POST localhost:5000/contact -H 'Content-Type: application/json' -d '{"name":"a","email":"a@b.com","message":"hi","company":"bot"}' # 200 but dropped
# 6th request within an hour => 429
```
- [ ] **Step 7: Commit** (in the backend repo). **Do not push without owner confirmation.**
```bash
git add app.py requirements.txt
git commit -m "feat(security): scoped CORS, rate limit, honeypot, length caps, trim /health"
```

---

## Phase 7 — Docs + final verification

### Task 19: Rewrite README

**Files:**
- Modify: `README.md`

- [ ] **Step 1:** Rewrite to the terminal identity — remove "Apple-like glassmorphic / vibrant gradients / Data Unicorn" framing; describe the real-time network-graph hero, monospace system, single phosphor accent, and the project list **including AI Reel Factory**. Update the stack notes (JetBrains Mono; no frame sequence).
- [ ] **Step 2: Commit.**
```bash
git add README.md
git commit -m "docs: rewrite README for terminal/data identity"
```

### Task 20: Final end-to-end verification

- [ ] **Step 1:** `npm run build && npm run lint` → both clean.
- [ ] **Step 2: Manual review** in `npm run dev`: load every section in **both** light and dark; confirm zero remaining purple/indigo, glass/blur, sparkles, gradient text, fake %, 3D emoji; hero graph animates and respects reduced-motion (test via DevTools "Emulate prefers-reduced-motion"); caret visible in form fields; theme toggle works; AI Reel Factory card present with correct links.
- [ ] **Step 3:** Confirm `out/` contains `og.png`, `robots.txt`, `sitemap.xml`, and no `frames-webp`/`fluent3d`.
- [ ] **Step 4: Push the branch + open PR** (frontend), and surface the backend diff for the owner to push.
```bash
git push -u origin terminal-refresh
gh pr create --fill --title "Terminal/data portfolio refresh: AI Reel Factory + de-slop + audit fixes"
```

---

## Self-review notes
- **Spec coverage:** §1 tokens→Task 1; fonts→Task 2; slop deletion→Tasks 3,7,11; §2 hero→Tasks 4–7; §3 content→Tasks 8–12; §4 SEO→Tasks 13–15; a11y/perf→Tasks 16–17; backend→Task 18; cleanup/README→Tasks 7,11,19. All spec sections map to tasks.
- **Ordering caveat:** `fluent` export is deleted in Task 11 (after its last caller is removed); Task 8 only *adds* `TECH` entries. Honor this to avoid build breaks.
- **Static-export gotchas:** metadata image URLs and any `<img>`/asset paths must carry the `/Portfolio` basePath manually (already true in `techIcons`/frame loader patterns).
- **No placeholders:** code blocks are concrete; restyle tasks name exact class swaps rather than "improve styling."
