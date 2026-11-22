# Dot field, phase 3: polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the film. That means:
- every scene fits a phone;
- every fallback shows something;
- a dot's look never jumps when a scene changes;
- reduced motion gets its 200 ms fade;
- the portrait, the README and a WebKit check;
- the follow-ups both earlier plans deferred.

**Architecture:** Same as phase 2, with one change: each dot's displayed look, not only its position and visibility, is carried across a scene change.
- **What is carried:** the look is the weights of its four kinds plus two tints (ink and grey).
- **Where it lives:** `morph.ts` computes the look on the CPU, and the vertex shader computes the same blend.
- **Small rules get small tested functions:**
  - `polish.ts`: midpoint spread, tilt gating, the reduced-motion fade and resize handling;
  - `loop.ts`: frames for a fixed time.

**Tech Stack:** As in phase 2, plus Playwright's WebKit build. That is `playwright-core` 1.65.1 and `webkit-win64.zip` (WebKit 27.2, 65 MB), used for verification only and kept in the scratchpad. Shaan approved the download on 2026-11-20.

**Spec:** `docs/superpowers/specs/2026-11-19-portfolio-dot-field-design.md`. Binding for this plan:
- phase 3 ("Polish");
- "Layout on phones" and "Fit" (360×640);
- "Fallbacks and accessibility";
- look-and-feel item 5 (the portrait).

This plan also picks up the follow-up lists at the end of the phase 1 and phase 2 plans.

## Testing is deferred

Shaan asked on 2026-11-20 to pause testing for later. Tasks 1 to 8 are built first, with only `npm run typecheck` and `npm run build` after each one. Each task's failing tests and browser checks, and all of Task 9, run in a later testing pass, before anything merges.

## Global Constraints

- **Copy, colour, commits, CSP, dependencies, tests, motion:** as in phase 2's Global Constraints, with two changes:
  - the branch is `feat/dot-field-polish`;
  - `playwright-core` is never added to `package.json`.
- **Fit:** every scene fits one screen at 1440×900, 1280×640, 390×844 and 360×640, in both themes.
- **Timing (s):** shape 1.4, move 0.5, stagger 0.45. Reduced motion's scene change is a 200 ms fade: 100 ms out, then 100 ms in.
- **Budget:**
  - a scene change costs under 16 ms of main-thread work at 1440×900;
  - no frame over 25 ms during a scene change;
  - the field's own code stays at 40 KB gzipped or less.

## Review Focus

1. **A phone's URL bar showing or hiding mid-film** must not rebuild the field or move a dot off its marker. Task 5's `resizeNeeds`; Task 9, check 4.
2. **A fast reader stepping again mid-morph** sees no dot flash in colour, size or brightness. Task 1's tests; Task 9, check 5.
3. **Reduced motion:** a second step, or a theme change, mid-fade never leaves the canvas blank. Task 3's tests; Task 9, check 6.
4. **Phones:** every scene fits at 360×640 and 390×844, touch scrolling snaps scene by scene, and nothing scrolls sideways. Task 5; Task 9, check 3.
5. **WebKit:** whatever Safari's engine makes of the snap test, the page works. It either has snap and the field, or the no-snap mode with tiles and no errors. Task 9, check 7.

---

### Task 1: The look carries across a retarget

**Files:**
- Modify: `src/components/field/morph.ts`, `shaders.ts`, `engine.ts`
- Test: `src/components/field/morph.test.mts`

**Interfaces:**
- Produces, in `morph.ts`:
  - `MorphState` gains `kind: Float32Array`, each dot's target kind.
  - `Carry` becomes `{ look: Float32Array; tint: Float32Array; progress: Float32Array }`:
    - `look` holds 4 values per dot, the weights of dust, system, model and line;
    - `tint` holds 3 values per dot: visibility, ink and grey;
    - both are updated in place by `snapshot` at a scene change.
  - `inkOf(mode): number` is 1 for packet, bounce and arrive, and 0 otherwise.
  - `greyOf(mode, c, b): number` is `smoothstep(b, b + 0.1, c)` for hold, and 0 otherwise.
  - `shownLook(st, i, now, clock, carry, out: Float32Array): void` writes `[w0, w1, w2, w3, vis, ink, grey]`:
    - `W = W_from + (onehot(kind) − W_from)·p`;
    - `I = I_from + (inkOf − I_from)·p`;
    - `G = G_from + (greyOf − G_from)·p`;
    - and visibility as phase 2's `shownVisibility`, which this replaces.
- **The shader's look:**
  - colour is `Σw·kindColour`, alpha `Σw·kindAlpha` and size `Σw·kindSize`;
  - ink then moves colour to `uBright`, alpha to 1 and size to 2.8;
  - grey moves colour to `uDust`;
  - visibility multiplies alpha;
  - `vModel = w2`.
- **Engine attributes:** `aLookFrom` (vec4) and `aTintFrom` (vec3) replace `aKindFrom` and `aVisFrom`, leaving 12 attributes.

- [ ] **Step 1: Write the failing tests.**
  - `a retarget keeps each dot's look`:
    - set up state A with mixed modes and kinds, random `from` looks and tints, stopped mid-morph;
    - carry it into state B;
    - Expected: `shownLook(B, i, now, …)` equals `shownLook(A, i, now, …)` for all 7 values, within 1e-6.
  - `an arrived dot shows its own kind, ink and grey`: at p = 1, `W = onehot(kind)`, `I = inkOf(mode)` and `G = greyOf(mode, c, b)`.
  - Rewrite phase 2's two visibility tests on `shownLook`.
- [ ] **Step 2: Run the tests.**
  - Run: `npm test`
  - Expected: FAIL, because `shownLook` is not exported.
- [ ] **Step 3: Implement** the changes above. The snapshot's one pass now carries look, tint and progress.
- [ ] **Step 4: Check.**
  - Run: `npm test && npm run typecheck && npm run build`, then `phase2.mjs` for `scenes`, `handoff` and `timing`.
  - Expected: all pass.
- [ ] **Step 5: Commit.** `fix: carry each dot's look across a scene change`

### Task 2: Motion polish

**Files:**
- Create: `src/components/field/polish.ts`, test `src/components/field/polish.test.mts`
- Modify: `engine.ts`, `package.json`

**Interfaces:**
- `pushPast(mx, push, spread): number`. A midpoint left of `push` (the text column's right edge plus 24) maps to `push + (push − mx)·spread/push`, keeping its spread instead of bunching into 60 px. The engine passes `spread = min(240, w − push)`.
- `tiltWanted(o: { motion: boolean; inside: boolean; stack: boolean; x: number; y: number; w: number; h: number; now: number; turnFrom: number }): [number, number]`. It is `[0, 0]` until `now ≥ turnFrom`, so the stack never tilts while its drawing is still showing (phase 1 follow-up); after that it is phase 1's formula.

- [ ] **Step 1: Write the failing tests.**
  - `midpoints past the text column keep their spread`: 1,000 values evenly over [0, push] map into [push, push + spread], and no tenth of that range holds more than twice its share.
  - `the stack waits for its drawing before it tilts`.
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement,** and use both in the engine.
- [ ] **Step 4: Check.**
  - Run: `npm test && npm run typecheck`
  - Expected: both pass.
- [ ] **Step 5: Commit.** `fix: spread pushed midpoints, and hold the tilt until the stack turns`

### Task 3: Reduced motion's fade

**Files:**
- Modify: `src/components/field/loop.ts`, `loop.test.mts`, `polish.ts`, `polish.test.mts`, `engine.ts`, `shaders.ts`

**Interfaces:**
- `Loop.runFor(seconds: number)` draws every frame until the clock passes the deadline, even with reduced motion.
- `fadeAlpha(now, start, half): number` is `|1 − (now − start)/half|` clamped to [0, 1]. That gives 1 → 0 over `half`, then 0 → 1.
- `refade(now, start, half): number` is a new start on the way out, at the current level. A second change mid-fade therefore continues without a blank frame or a flash.
- **The engine:**
  - With reduced motion, a non-instant `show()` holds its targets.
  - It applies them once the fade-out ends, at `start + 0.1`, and sets `uFade` (which multiplies alpha) from `fadeAlpha`.
  - It calls `runFor(0.2)`.
  - A show mid-fade replaces the held targets, starting from `refade`.

- [ ] **Step 1: Write the failing tests.**
  - `a fade draws its frames, even with reduced motion` (`loop.test.mts`).
  - `the fade goes out, then in` (`fadeAlpha` at 0, 0.05, 0.1, 0.15 and 0.2: 1, 0.5, 0, 0.5, 1).
  - `a second change mid-fade carries on from where it is`.
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Check.**
  - Run: `npm test && npm run typecheck`
  - Expected: both pass.
- [ ] **Step 5: Commit.** `feat: fade between scenes with reduced motion`

### Task 4: Fallback tiles for the thesis and the lanes

**Files:**
- Modify: `src/components/film/ThesisScene.tsx`, `WorkScene.tsx`, and `Pipeline.tsx` (export a `KindTile`, used by `SceneFlows` too)

**Interfaces:**
- `KindTile({ kind: StepKind | "grid" })` is the `data-glyph` tile `SceneFlows` already draws: Pipeline's tile look with its kind icon, and lucide's `Grid3x3` for `grid`.
- Every `data-node` in the thesis and the work scene gets one.
- The existing CSS hides tiles while the field draws the scene, and shows them without WebGL, with Save-Data, after a lost context, and in no-snap mode.

- [ ] **Step 1: Write the failing check.** Extend `phase2.mjs nowebgl`: without WebGL, every `data-node` on the page holds a visible tile.
  - Expected: FAIL for the thesis and the lanes.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Check.**
  - Run: `nowebgl` and `scenes`.
  - Expected: both pass, and the tiles stay hidden while the field draws.
- [ ] **Step 4: Commit.** `feat: show tiles on the thesis and the lanes without the field`

### Task 5: Phones

**Files:**
- Modify:
  - `SystemScene.tsx`, `SceneFlows.tsx`, `HeroScene.tsx`, `WorkScene.tsx`;
  - `src/components/film/Film.tsx`, `polish.ts`, `polish.test.mts`;
  - `src/app/globals.css`.

**Interfaces:**
- **Below `md` in a system scene:**
  - the scene keeps only "Read the case study", because the sheet already holds the live and source links;
  - markers are 24 px and rows are 10 px apart;
  - flow names sit 12 px above their rail;
  - the grid gap is 24 px.
- **The hero:** the stack box is `28svh` on phones, and the keys and the creator line sit 24 px apart.
- **The work scene below `sm`:** each lane is a row, its name in a 6.5 rem column and its steps running left to right on 16 px markers. The dots follow, because `flowTargets` draws an edge in any direction. From `sm` up the lanes stay vertical and side by side.
- **`resizeNeeds(prev, next): "none" | "canvas" | "rebuild"`**, where each side is `{ w, h, sceneH }` (`sceneH` is the first scene's height):
  - a change of `w` or `sceneH` → `"rebuild"`;
  - a change of `h` alone → `"canvas"`. A phone's URL bar changes `h` but not `100svh`, so Film then only resizes the canvas;
  - no change → `"none"`.
- **CSS:** below `md` the sheet is `width: 100%`.

- [ ] **Step 1: Write the failing tests.**
  - `a phone's URL bar only resizes the canvas`, plus the other three cases of `resizeNeeds`.
  - The `phone` check at 360×640.
  - Expected: FAIL for both. The phone check currently fails on the hero, the work scene, Atlas, Syntrueno, AI Reel Factory and Think9.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Check.**
  - Run: `phone` at 360×640 and 390×844 in both themes, `scenes` at 1440×900 and 1280×640, `npm test` and `npm run typecheck`.
  - Expected: all pass, with no `data-tiles` at any of these sizes.
- [ ] **Step 4: Commit.** `feat: fit every scene on a phone`

### Task 6: Interface details

**Files:**
- Modify: `src/components/Header.tsx`, `Film.tsx`, `CaseSheet.tsx`, `Pipeline.tsx`, `globals.css`

**Interfaces:**
- **The header's hairline:**
  - Film's reading observer sets `html[data-read]` while the reading part holds the screen.
  - The header loses its scroll listener, its `scrolled` state and its `border-b`.
  - Its hairline is a `box-shadow: 0 1px 0 var(--line)` under `html[data-read]` or `header[data-open]`. That puts it in row 64, the row the handoff line lands in (phase 2 follow-up).
- **The sheet:** a click closes it only if the press also began on the backdrop, so a text selection dragged out of the panel keeps it open.
- **Pipeline:** its flow names are `h3`, the level under the sheet's `h2`.

- [ ] **Step 1: Write the failing checks** in `phase2.mjs`.
  - `header`: there is no hairline in the film, the hairline is in row 64 in the reading part, and it shows with the menu open.
  - `sheet` gains a step: press inside the panel and release on the backdrop. Expected: the sheet stays open.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Check.**
  - Run: `header`, `sheet`, `handoff` and `ticks`.
  - Expected: all pass.
- [ ] **Step 4: Commit.** `fix: draw the header's hairline from the film, and keep the sheet open through a selection`

### Task 7: The portrait

**Files:**
- Modify: `src/components/About.tsx`

**Interfaces:**
- **Both themes:** the photo is grayscale, so yellow stays the only warm colour on the page.
- **Light:** `mix-blend-mode: multiply` on a transparent frame, so its white backdrop takes on the page's ground.
- **Dark:** normal blending, `brightness(0.8) contrast(1.1)`, and the hairline frame.

- [ ] **Step 1: Write the failing check** `portrait`: the computed filter includes `grayscale(1)` in both themes, and the blend is `multiply` in light and `normal` in dark.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Check, then commit.** `feat: give the portrait the page's palette`

### Task 8: The README

**Files:**
- Modify: `README.md`
- Replace: `docs/screenshots/hero-light.webp`, `hero-dark.webp`, `case-study.webp`

**Interfaces:**
- **Rewrite** "Design", "Stack" and "Layout of the code" for the dot field: the film, the field, the behaviours table, fallbacks, sound and the reading part. Remove the building and GSAP.
- **Keep** the featured projects, the hosting and contact sections, and local development.
- **New screenshots** at 1440×900, as WebP through ffmpeg: the hero in light and in dark, and Atlas for the case study. The alt text describes what each image shows.
- **`npm test`** now runs more than the Worker's tests, so the README says so.

- [ ] **Step 1: Write** the README, then check that every path and link it names exists.
- [ ] **Step 2: Commit.** `docs: rewrite the README for the dot field`

### Task 9: Verification, WebKit, recordings and the final review

- [ ] **Step 1: The suite and the budget.**
  - Run: `npm run typecheck && npm run lint && npm test && npm run build`, and gzip the field's sources.
  - Expected: all pass, and the field's code is at most 40 KB.
- [ ] **Step 2: Desktop checks.**
  - Run: every `phase2.mjs` check (`scenes`, `sheet`, `ticks`, `handoff`, `tiles`, `deeplinks`, `nowebgl`, `contrast`, `nojs`, `header`, `portrait`), and `scenes` counting masks.
  - Expected: all pass, with at most 16 masks per scene.
- [ ] **Step 3: Phones (Review Focus 4).**
  - Run: `phone` at 360×640 and 390×844, light and dark.
  - Then a touch walk: `Input.dispatchTouchEvent` swipes, one per scene.
  - Expected: all nine scenes fit; each swipe lands on the next scene's top; nothing scrolls sideways; no errors.
- [ ] **Step 4: A URL-bar resize (Review Focus 1).**
  - On a phone, change only the viewport's height by 56 px, mid-film.
  - Expected: the field is not rebuilt, and the markers stay lit within 2 px of their centres.
- [ ] **Step 5: A fast reader (Review Focus 2).** Step twice within 400 ms and record the canvas.
  - Expected: no dot's alpha or size jumps between consecutive frames by more than its morph would.
- [ ] **Step 6: Reduced motion (Review Focus 3).** Step, step again mid-fade, and switch the theme mid-fade.
  - Expected: the canvas never goes blank for more than the fade's 100 ms, and each scene ends drawn.
- [ ] **Step 7: WebKit (Review Focus 5).**
  - Install `playwright-core` 1.65.1 and WebKit into the scratchpad.
  - Run the snap probe page, then the site: does snap turn on, does the field start, are there console errors, and screenshots.
  - Expected: snap and the field, or the no-snap mode with tiles. Either way, no errors.
- [ ] **Step 8: Frame timing.**
  - Run: `timing`, light and dark.
  - Expected: no frame over 25 ms, and a scene change under 16 ms of main-thread work in a CPU profile.
- [ ] **Step 9: The recordings.** Desktop in light and dark, plus a phone at 390×844, sent with SendUserFile.
- [ ] **Step 10: The final whole-branch review,** as superpowers:executing-plans requires, with the fix pass RED→GREEN.

## Left for later

Phase 3 is built, tested and reviewed. The testing pass is `1ee3033` to `86b9540`; its fixes are `6d06972` (a dot's size as it leaves the stack), and, from the final review, `9930060` (highlight and masks carried across a scene change), `0f17804` (the URL bar followed in the same frame) and `ccdd4eb` (a hero taller than the screen keeps its drawing). The responsiveness sweep at 18 sizes added `4c7193c` (the work scene's lanes on a 320 px screen). After the deploy, the review of the live site and Shaan's touchpad added `077d5d4` (no field behind a scene that shows its tiles) and `239bbbe` (a new swipe during the last one's momentum).

### From phase 3's final review

These are the minor findings it deferred, and what the testing pass could not settle on its own.

- **Resizes:** `sceneH` reads only the hero, so on a short desktop window whose hero is taller than the screen a vertical resize leaves the other scenes' targets stale; and a change of pixel ratio alone (a window moved to another screen) never reaches `setPixelRatio`. Sum every scene's height, and give `Size` the ratio.
- **Reduced motion:** a quick show (a rebuild mid-fade, the handoff line) skips the fade.
- **Types:** `MorphState.kind` and `group`, and `Carry.look` and `tint`, are optional, so a caller that forgets them gets no carry. Make them required on the engine's path.
- **Masks** past 16 are still dropped silently (Atlas uses 12). A unit test over the content would guard the limit.
- **README screenshots** are 1422×804, the headless window's content area, not 1440×900.
- **Thesis phrases** cannot be focused, so a keyboard user cannot light a part again.
- **`uNow`** grows without bound; float32 keeps it within 2 ms for about nine hours open.
- **Phones held sideways** fit no scene, so every scene shows its tiles and the hero its drawing, with no field behind them (`077d5d4`). A landscape layout would bring the dots back.
- **Swipes the touchpad rule still misses** (`239bbbe`), each as the old rule did:
  - a swipe slower than 2.3 px/ms, or a flick of under about 90 px in 40 ms, made during momentum;
  - a swipe made while the film is still moving, in the first half second after a step (by design);
  - the weakest recorded swipe on a 30 Hz screen, in most frame phases.
  - Mac trackpads were modelled, not recorded. Record one (Safari at 60 Hz, Chrome at 120 Hz) with the same wheel recorder before tuning for them.
- **Scene-change cost.** Measured on 2026-11-23 on a quiet machine: the build before the review's fixes against the one after, interleaved, six runs each.
  - Warm, the fixes add about 2 ms to a system step. That is the mask test that keeps dots under the copy from blinking.
  - The first change into the work scene costs about 4.5 ms more, in native time while the larger snapshot is still cold. Warm, thesis → work costs the same in both builds.
  - That change is the heaviest in both builds. In the A/B its longest task was 15–21 ms before the fixes and 21–28 ms after, over the 16 ms budget.
  - The final sweep of the shipped build, minutes later, measured it at 10.7 and 11.1 ms, with every change under 12 ms and no frame over 14 ms. This laptop's clock state moves these numbers by 2× or more, so only the A/B's differences are firm.
  - For headroom on slow machines: run the snapshot once at idle after load, so the first changes run warm code; or split a change over two frames, the snapshot in one and the midpoints and upload in the next.
- **Shaan's own checks:** the phone (the snap test, `scrollend`, sound) and frame timing in his Chrome with the window in front. Headless Chrome here draws on the same Intel Iris Xe GPU (ANGLE, D3D11), but with no window on screen.
