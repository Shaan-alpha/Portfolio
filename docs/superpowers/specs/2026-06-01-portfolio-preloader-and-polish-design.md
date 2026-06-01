# Portfolio Upgrade — Preloader, Skill Issue, Tech Refresh & Animation Polish

**Date:** 2026-06-01
**Owner:** Shaan Satsangi
**Status:** Approved — proceeding to implementation

## Goal

Three user-requested outcomes:

1. **Mask the slow first paint.** The hero is a 240-frame WebP scroll sequence (~14 MB) that
   streams in after load, so the page feels janky for a few seconds. Add a modern, animated,
   theme-aware preloader that shows real load progress and fades out when the experience is ready.
2. **Add the Skill Issue project** as the flagship (first) project card, with green accent, and
   refresh the tech stacks across the site + README.
3. **Go further on polish** — tasteful animation/view upgrades that stay cohesive with the
   existing Apple-style glassmorphic design.

## Constraints & non-negotiables

- **Theme-correct everywhere.** Light/dark toggle ([ThemeToggle.tsx](../../../src/components/ThemeToggle.tsx),
  next-themes, `defaultTheme="dark"`) must keep working. Every new UI element is driven by the
  existing theme CSS vars (`--background`, `--foreground`, `--border`, accent vars) so it adapts
  automatically. No flash of wrong theme (next-themes sets the class pre-paint).
- **Don't break the Contact → backend integration.** `portfolio-backend` is a **separate Flask
  repo** (deployed at `portfolio-backend-wrwo.onrender.com`, `POST /contact`). It is out of scope;
  do not modify it. [Contact.tsx](../../../src/components/Contact.tsx) must keep posting
  `{name, email, subject, message}` exactly as it does today.
- **No new dependencies.** Reuse framer-motion, lenis, next-themes, lucide-react.
- **No quality regression on the hero animation.** We mask the load; we do **not** cut frame count
  or resolution.
- **Respect `prefers-reduced-motion`.** Currently unhandled — add a global guard.

## Architecture: shared frame loader (chosen approach A)

Today [CanvasScrollSequence.tsx](../../../src/components/CanvasScrollSequence.tsx) owns frame
preloading **and** rendering, and only fades the canvas in once frame 1 decodes. To drive a
progress-accurate preloader without double-downloading, lift loading into a single provider.

```
FrameLoaderProvider (context: { images, progress, ready })
├── owns the preload loop (frame 1 first, then batched decode)
├── Preloader            → reads progress/ready, renders overlay, fades out
└── CanvasScrollSequence → pure renderer, reads images[] from context
```

**Ready threshold (UX crux):** the ring fills against a *critical set* — the first
`CRITICAL_FRAMES` (~80) that cover the early scroll — not all 240.
- `progress = min(100, round(criticalLoaded / CRITICAL_FRAMES * 100))`
- Reveal (`ready = true`) when: `progress === 100` **AND** `elapsed ≥ MIN_DISPLAY_MS` (~600 ms, so
  it never flashes on cached loads).
- **Failsafe:** a `MAX_WAIT_MS` (~6000 ms) timeout forces `ready = true` even if the network is
  slow/failing, so the site is never permanently blocked.
- Remaining ~160 frames keep decoding in the background after reveal; the canvas already skips
  missing frames gracefully (`if (!imgA) return`).

**Scroll lock:** while `!ready`, lock scroll so the user can't scroll behind the overlay. Use
`document.body` overflow hidden + `window.scrollTo(0,0)`; Lenis is started fresh on mount and will
pick up naturally (it reads live scroll). Unlock on reveal.

## Components

### New
- **`src/components/FrameLoaderProvider.tsx`** — `"use client"`. Holds `imagesRef`
  (`HTMLImageElement[]`), `progress` state, `ready` state. Runs the existing batched preload logic
  (moved out of the canvas), computing progress off the critical set. Exposes a context
  `useFrameLoader() → { images, progress, ready }`. Keeps the existing basePath detection for the
  `/Portfolio` GitHub-Pages case.
- **`src/components/Preloader.tsx`** — `"use client"`. Fixed overlay `z-[9999]`,
  `background: var(--background)`. Centerpiece: glowing **"SS" monogram** (blue→purple→pink gradient
  text) + circular **SVG progress ring** (`strokeDashoffset` driven by `progress`) + live `%` in
  DM Mono + a small "loading experience" caption. Subtle gradient pulse behind the monogram. On
  `ready`: animate opacity→0 + slight scale, then unmount (AnimatePresence). Renders in the server
  HTML at progress 0 so it covers content immediately (no FOUC of the heavy page).
- **`src/components/AmbientBackground.tsx`** — `"use client"`. Uses the currently-orphaned
  `.ambient-blob` CSS. 2–3 fixed, blurred accent blobs (blue / purple / pink) that drift slowly via
  framer-motion. Low opacity, `z-0`, `pointer-events-none`. Reduced-motion → static (no drift).
- **`src/components/SectionDivider.tsx`** — `"use client"`. A thin gradient hairline that animates
  `scaleX 0→1` (origin center) when scrolled into view (`whileInView`, `once`). Theme-aware via
  border/accent vars.
- **`src/components/ScrollProgress.tsx`** — `"use client"`. Thin (2–3px) gradient bar fixed at the
  very top, width = page `scrollYProgress` (framer-motion `useScroll` + `scaleX`). `z` below navbar.

### Modified
- **`CanvasScrollSequence.tsx`** — remove its own preload effect; consume `images` from
  `useFrameLoader()`. Keep scroll/spring/render/resize logic. Canvas opacity tied to `ready`.
- **`src/app/layout.tsx`** — wrap the tree in `FrameLoaderProvider`; mount `Preloader` and
  `ScrollProgress` inside `ThemeProvider` (so they're theme-aware). Order: ThemeProvider →
  FrameLoaderProvider → (Preloader, ScrollProgress, CustomCursor, SmoothScroll, children).
- **`src/app/page.tsx`** — add `<AmbientBackground />` behind content; insert `<SectionDivider />`
  between About/Skills/Projects/Experience/Certifications/Contact.
- **`src/components/Projects.tsx`** — prepend the **Skill Issue** card (content below); add richer
  card interactions: cursor-tracking radial **spotlight** using `--proj-glow`, a subtle hover
  **tilt** (translateY already exists; add small rotateX/Y on pointer move, capped ~4°), and an
  accent **top-border** that fades in on hover. Reduced-motion → disable tilt/spotlight, keep static
  hover. All built on the per-card `--proj-accent`/`--proj-glow` vars that already exist.
- **`src/components/Skills.tsx`** — surface the new stack via the **dev-tools grid** (it wraps, so
  no symmetry cost): add FastAPI, Upstash Redis, Neon Postgres, Groq LLM, Vercel, Next.js. Leave the
  four skill **pillars** (4 bars each) as-is for symmetry — the dev-tools grid is the right home for
  the additions, keeping the change honest and minimal.
- **`src/app/globals.css`** — add: preloader keyframes (ring/monogram pulse), `.proj-spotlight`
  helper, `.section-divider` gradient, and a global `@media (prefers-reduced-motion: reduce)` block
  that neutralizes drift/tilt/heavy transitions.
- **`README.md`** — add Skill Issue as flagship project; fix stale entries (Sahara = Next.js/TS not
  Flutter; FaceFilter = OpenCV DNN YuNet+SFace not DeepFace; correct GitHub link casing for CRM &
  JARVIS); refresh the stack list to mention the AI/full-stack additions.

### Optional / light (will do unless told otherwise)
- **`Hero.tsx`** — swap the stale "Cross-Platform · Flutter · Firebase" float to
  "Full-Stack AI · Next.js · FastAPI" to reflect current work.

## Skill Issue card content (flagship, first, green accent)

- **icon:** 🧾 (ties to "GitHub Receipts")
- **date:** "May 2026"
- **title:** "Skill Issue — GitHub Intelligence"
- **desc:** "AI-powered GitHub intelligence platform. Drop in a username and it turns repos, OSS
  contributions, and coding discipline into a deterministic engineering score and shareable
  receipts."
- **tags:** `Next.js` · `FastAPI` · `Python` · `Neon Postgres` · `Upstash Redis` · `Groq LLM`
- **bullets:**
  - "Deterministic 100-point engineering score across repo quality, maturity, OSS, consistency & recruiter signal — AI only narrates"
  - "FastAPI + Next.js with Neon Postgres persistence, GitHub OAuth, and an Upstash Redis warm cache (repeat analysis p95 ≤ 200 ms)"
  - "Groq llama-3.3-70b Roast + Mentor narration and shareable 1200×630 'GitHub Receipts' OG scorecards"
- **link:** https://github.com/Shaan-alpha/Skill-Issue
- **liveLink:** https://skill-issue-tau.vercel.app
- **colors:** green accent — `bg: from-[#041a10] to-[#08361f]`, `accent: var(--color-green)`,
  `glow: var(--color-green-glow)`, green badge classes.

## Out of scope (explicit)
- The `portfolio-backend` Flask repo (no edits).
- New page routes / multi-page structure.
- Reducing frame count or resolution.
- New runtime dependencies.

## Acceptance criteria
- [ ] Preloader covers the page from first paint, shows climbing %/ring, and fades out smoothly.
- [ ] Site reveals after the critical frames load (not all 240); background loading continues.
- [ ] Failsafe: with throttled/blocked network, site still reveals within ~6 s.
- [ ] Hero scroll animation still renders smoothly; no double-download of frames.
- [ ] **Toggle works in both directions**; preloader, blobs, dividers, scroll bar, and project
      spotlight all look correct in **light and dark** with no theme flash.
- [ ] Skill Issue card appears first, green-accented, with correct Live + GitHub links.
- [ ] New tech surfaced in Skills dev-tools grid; README updated and accurate.
- [ ] `prefers-reduced-motion` disables drift/tilt; layout stays intact.
- [ ] Contact form still posts to the Render backend successfully.
- [ ] `npm run build` and `npm run lint` pass clean.
- [ ] Committed and pushed to `origin/main`.
