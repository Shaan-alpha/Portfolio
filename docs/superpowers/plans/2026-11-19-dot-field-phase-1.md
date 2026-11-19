# Dot field, phase 1: the film and the field

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the building with the first three scenes of the film. These are the stack, the thesis and the six lanes, drawn by one dot field and stepped one scene per wheel gesture. The reading part (the six case studies for now, then the archive, About, Experience, Contact and the footer) stays below, scrolling natively.

**Architecture:**
- **The motion maths is pure TypeScript, tested with `node:test`:** the wheel rule, the morph and the scene targets. A three.js `ShaderMaterial` evaluates the same formulas on the GPU.
- **Two client pieces glue it to the page:** `snap.ts` handles the browser's snap and wheel behaviour, and `Film.tsx` reads scene layout from the DOM, follows the active scene and drives the field.
- **Scenes are server components.** They carry `data-scene`, `data-node` and `data-mask` hooks that the field reads.

**Tech Stack:** Next 16 (static export), React 19, Tailwind 4, three.js 0.186.1 (custom shaders, one `Points` draw call), `node:test` with type stripping, and headless Chrome over CDP plus the Chrome extension for browser checks.

**Spec:** `docs/superpowers/specs/2026-11-19-portfolio-dot-field-design.md`. Read it first: the plan argues from it.

## Global Constraints

- **Copy:** verbatim from `src/content/*.ts`, `Hero.tsx` and `Work.tsx`. No new visible strings except those the spec lists.
- **Yellow:** `--model` only, and only on model parts: the cube, model steps and the Model label.
- **Commits:** on `feat/dot-field`, conventional prefixes (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `docs:`). No `Co-Authored-By` or any AI attribution. Never push; pushing `main` deploys.
- **CSP** (`public/_headers`): scripts from `'self'` only, no WebAssembly, no blob workers, no inline event handlers.
- **No new runtime dependencies.** Remove `gsap`. Keep `three@0.186.1` exact.
- **Tests:** `*.test.mts` run by `node --test` with type stripping. A module imported by a test uses relative imports with explicit `.ts` extensions and only erasable TypeScript (no `enum`, no parameter properties).
- **Motion:** the field never reads the scroll position in its frame loop. DOM layout is read on scene activation, load, resize and theme change only.
- **Timing (seconds):** shape 1.4, move 0.5, stagger 0.45; gesture gap 180 ms; stack turn 4°/s; pointer tilt up to 8°; drift up to 1.2 px.
- **Dot counts:** 16000 desktop, 12000 tablet (coarse pointer, short side 600 px or more), 8000 phone (width under 768 px), 6000 when `deviceMemory` is 4 or less. DPR capped at 2.

## Review Focus

1. **A trackpad's inertia, or a fast spin of a mouse wheel, must move exactly one scene.**
   - Covered by `wheel.test.mts`, "swallows the tail of a gesture" and "a 2,500 px delta is still one step".
   - Task 8 checks it again with real wheel input.
2. **A deep link must survive snap turning on after load.** Loading `/#about`, `/#work` or `/#atlas` must leave the reader at that target after the probe and `data-snap` are applied. Task 8, check 3.
3. **A resize or a zoom mid-film must stay on the same scene.** Stops and targets are recomputed and the page does not drift to a neighbour. Task 8, check 4.
4. **A theme switch mid-morph changes only colour and blending.** No dot moves.
   - Covered by `morph.test.mts`, "retargeting mid-morph moves no dot". Colour is not part of position.
   - Task 8, check 5.
5. **When WebGL is missing or the context is lost, the hero keeps its SVG drawing and nothing throws.** Task 8, check 6.

---

### Task 1: The wheel rule

**Files:**
- Create: `src/components/field/wheel.ts`
- Test: `src/components/field/wheel.test.mts`
- Modify: `package.json` (add the test file to `scripts.test`)

**Interfaces:**
- Produces:
  - `type WheelEventLike = { deltaX: number; deltaY: number; ctrlKey: boolean; timeStamp: number }`
  - `type WheelContext = { y: number; stops: number[]; lastAt: number; moving: boolean; blocked: boolean }`. `stops` is ascending: the scene tops, then the reading part's top, which is always last. `lastAt` is the timestamp of the previous event that was not passed, and `-Infinity` before the first.
  - `type WheelDecision = { kind: "pass" } | { kind: "swallow" } | { kind: "step"; to: number }`
  - `const GESTURE_GAP_MS = 180`
  - `function decideWheel(e: WheelEventLike, c: WheelContext): WheelDecision`

- [ ] **Step 1: Write the failing tests** in `wheel.test.mts`, with `stops = [0, 720, 1440, 2160]` (three scenes, then the reading part at 2160) and `base = { lastAt: -Infinity, moving: false, blocked: false }`:
  - `passes zoom gestures, horizontal wheels, empty deltas and blocked targets`: `ctrlKey: true`; `{deltaX: 50, deltaY: 10}`; `deltaY: 0`; and `blocked: true` each give `{ kind: "pass" }`.
  - `passes inside the reading part and at its top going down`: `y: 2500, deltaY: -100` → pass; `y: 2160, deltaY: 100` → pass.
  - `steps one scene down from a scene top`: `y: 0, deltaY: 100` → `{ kind: "step", to: 720 }`.
  - `steps back into the film from the reading part's top`: `y: 2160, deltaY: -100` → `{ kind: "step", to: 1440 }`.
  - `a 2,500 px delta is still one step`: `y: 0, deltaY: 2500` → `{ kind: "step", to: 720 }`.
  - `swallows the tail of a gesture`: `timeStamp: 1100, lastAt: 1000` → swallow; with `lastAt: 900` (200 ms later) it steps.
  - `swallows while a step is still moving`: `moving: true` → swallow.
  - `swallows at the ends of the film`: `y: 0, deltaY: -100` → swallow.
  - `decides from the nearest stop when the page sits between two`: `y: 700, deltaY: 100` → step to 1440.
- [ ] **Step 2: Run the tests and watch them fail.**
  - Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/components/field/wheel.test.mts`
  - Expected: FAIL, with the module not found.
- [ ] **Step 3: Implement `decideWheel`.** Apply the rules in this order:
  1. Pass if `blocked`, `ctrlKey`, `deltaY === 0`, or `|deltaX| > |deltaY|`.
  2. Pass inside the reading part (`y > last + 1`), and at its top going down (`|y - last| <= 1 && deltaY > 0`).
  3. Swallow if `moving`, or if `timeStamp - lastAt <= GESTURE_GAP_MS`.
  4. Take the nearest stop index `i` and set `j = clamp(i + sign(deltaY))`. Swallow if `|stops[j] - y| < 1`; otherwise step to `stops[j]`.
- [ ] **Step 4: Run the tests and watch them pass.**
  - Run: the same command as step 2.
  - Expected: PASS, 9 tests.
- [ ] **Step 5: Add the file to `scripts.test` in `package.json`,** then run `npm test`.
  - Expected: all suites pass.
- [ ] **Step 6: Commit** with `feat: add the one-scene-per-gesture wheel rule`.

### Task 2: The morph maths

**Files:**
- Create: `src/components/field/morph.ts`
- Test: `src/components/field/morph.test.mts`
- Modify: `package.json` (`scripts.test`)

**Interfaces:**
- Consumes: `basis` and `project` from `src/components/stack/geometry.ts`, imported in the test as `../stack/geometry.ts`.
- Produces:
  - `const TIMING = { shape: 1.4, move: 0.5, stagger: 0.45 }`
  - `function ease(t: number): number`: an expo-out curve, normalised so that `ease(0) = 0` and `ease(1) = 1`, and clamped outside that range.
  - `function dotProgress(now: number, start: number, delay: number, duration: number, stagger: number): number`: the eased progress of one dot. It starts at `start + delay * stagger`.
  - `type Frame = { m: Float32Array /* 3×3 row-major */; t: [number, number, number]; s: number }`: target-frame units to viewport px. `IDENTITY_FRAME` uses `s = 1`.
  - `function stackFrame(azimuthDeg: number, elevationDeg: number, tiltDeg: [number, number], center: [number, number], scale: number): Frame`. Its rows are `right`, `-up` and `toCamera` from `basis`, so a local point lands where `project()` draws it, with y flipped for the screen.
  - `type MorphState = { n: number; from: Float32Array; mid: Float32Array; to: Float32Array; delay: Float32Array; seed: Float32Array; flow: Float32Array /* 4n: vector + phase */; start: number; duration: number; stagger: number }`
  - `function dotPosition(out: Float32Array, o: number, st: MorphState, i: number, now: number, frame: Frame, flowSpeed: number, drift: number): void`. It traces the quadratic Bézier `from → mid → frame(to + flowVec · fract(phase + now · flowSpeed))` at `dotProgress`, then adds a drift of `drift · (sin(now · (0.6 + 0.5·seed) + 6.283·seed), cos(now · (0.7 + 0.4·seed) + 6.283·seed))`.
  - `function snapshot(st: MorphState, now: number, frame: Frame, flowSpeed: number, drift: number): Float32Array`: every dot's current position in px.

- [ ] **Step 1: Write the failing tests:**
  - `ease starts at 0, ends at 1 and never decreases`: sample 0 to 1 in 100 steps; `ease(-1) = 0` and `ease(2) = 1`.
  - `a dot waits for its delay, then arrives by the end of its window`:
    - with `delay = 0.5`, `stagger = 0.4` and `duration = 1`: progress is 0 at `start + 0.2` and 1 at `start + 1.2`;
    - progress is strictly between 0 and 1 at `start + 0.7`.
  - `a dot sits on its source at the start and on its target at the end`: with `drift = 0`, `flowSpeed = 0` and `IDENTITY_FRAME`, the position equals `from` at `start` and `to` at the end, within 1e-4.
  - `retargeting mid-morph moves no dot`:
    1. Build state A with random data and a stack frame.
    2. At `now = A.start + 0.6`, take `S = snapshot(A, now, …)`.
    3. Build state B with `from = S`, `start = now`, a new random `mid` and `to`, and the same drift.
    4. For every `i`, `dotPosition(B, i, now)` equals `S[i]` within 1e-4.
  - `streaming dots stay on their edge`: with `flow = (0, 100, 0, phase 0.3)`, `to = (10, 20, 0)` and progress at 1, `y` stays in [20, 120] for 50 sampled times.
  - `the stack frame matches the drawing's projection`: for 20 points `p`, `stackFrame(40, 24, [0, 0], [0, 0], 1)` maps `p` to `[project(p)[0], -project(p)[1]]` within 1e-6.
- [ ] **Step 2: Run them and watch them fail.**
  - Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/components/field/morph.test.mts`
  - Expected: FAIL, with the module not found.
- [ ] **Step 3: Implement `morph.ts`.**
  - `dotProgress` and `ease` must be written so that each line can be copied one-to-one into GLSL in Task 6.
  - Use no `Math` function GLSL lacks: `pow`, `sin`, `cos`, `fract` (written as `x - Math.floor(x)`) and `clamp` only.
- [ ] **Step 4: Run the tests.**
  - Expected: PASS, 6 tests.
- [ ] **Step 5: Add the file to `scripts.test`.** Run `npm test`.
  - Expected: all pass.
- [ ] **Step 6: Commit** with `feat: add the field's morph maths, mirrored for the shader`.

### Task 3: Scene targets

**Files:**
- Create: `src/components/field/targets.ts`
- Test: `src/components/field/targets.test.mts`
- Modify: `package.json` (`scripts.test`)

**Interfaces:**
- Consumes: the constants from `geometry.ts`, imported as `../stack/geometry.ts`, and `StepKind`, imported as a type from `../../content/projects.ts`.
- Produces:
  - `type Kind = 0 | 1 | 2`: dust, system and model.
  - `type Targets = { n: number; to: Float32Array; kind: Uint8Array; delay: Float32Array; flow: Float32Array; group: Int16Array; frame: "stack" | "screen" }`
  - `type Rect = { x: number; y: number; w: number; h: number }`
  - `function rng(seed: number): () => number`: mulberry32.
  - `function stackTargets(n: number, random: () => number): Targets`
    - **Plates:** 62% of the dots, on the four plates' top faces and their rims. A rim takes 30% of its plate's dots.
    - **Cube:** 14%, on the cube's six faces.
    - **Dust:** the rest, in a shell from 2.6 to 4 local units.
    - `frame: "stack"`. Delay rises by slot, so the stack builds from the top down. `group` is the slot, or −1 for dust.
  - `type FlowNode = { x: number; y: number; kind: StepKind | "grid" }`: a centre in viewport px.
  - `type FlowInput = { nodes: FlowNode[]; radius: number }`: the nodes in order. Consecutive nodes are joined by an edge.
  - `function flowTargets(n: number, flows: FlowInput[], viewport: { w: number; h: number }, mask: Rect[], random: () => number): Targets`
    - **Shares:** nodes take 50%, edges 22% and dust the rest.
    - **Shapes:**
      - `io`: a ring;
      - `step`: a disc;
      - `model`: an isometric cube, the only `kind: 2`;
      - `guard`: two posts;
      - `human`: a ring around a dense centre;
      - `grid`: a 10×10 lattice.
    - **Edges:** edge dots stream, with `flow` set to the edge vector and a random phase.
    - **Delay:** the node's index divided by the count, so a flow assembles from top to bottom.
    - **Dust:** never inside a mask rect.
    - `frame: "screen"`. `group` is the global node index.
  - `function slotLabelTops(): number[]`: for slots 0 to 4, each slot centre's distance from the top of the drawing's viewBox, as a percentage. This uses `project([0, slotY(slot), 0], basis(AZIMUTH, ELEVATION))[1]` mapped into `VIEW_H`.

- [ ] **Step 1: Write the failing tests:**
  - `stackTargets fills every dot and only the cube is yellow`:
    - with `n = 5000`, lengths are 15000 and 5000;
    - the share of `kind === 2` is within ±1% of 14%;
    - every yellow dot lies within `CUBE / 2 + 1e-6` of the cube centre `(0, slotY(3), 0)` on all axes.
  - `stackTargets is deterministic for a seed`: two runs with `rng(7)` are equal.
  - `flowTargets puts model dots only on model nodes`: for the flow `[io, model, guard]` at `x = 600` and `y = 100, 200, 300`, every `kind === 2` dot lies within `radius · 1.6` of `(600, 200)`.
  - `flowTargets keeps dust out of the mask`: with the mask `{ x: 0, y: 0, w: 500, h: 800 }`, no dust dot (`kind === 0`) falls inside it.
  - `flowTargets streams only edge dots`: dots with a non-zero `flow` vector all lie on the segments between consecutive nodes, within 2 px.
  - `slot labels line up with the drawing`: there are five values, strictly increasing, all between 0 and 100. Slot 3's value sits within 2 points of the midpoint between slots 2 and 4. (The model hangs a little low; this checks the mapping, not the drop.)
- [ ] **Step 2: Run them and watch them fail.**
  - Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/components/field/targets.test.mts`
  - Expected: FAIL.
- [ ] **Step 3: Implement `targets.ts`.**
  - The order inside the arrays is the dot-matching contract: model dots first, then system dots top to bottom, then dust. Consecutive scenes then send yellow dots to yellow dots and upper parts to upper parts.
  - Rounded-rectangle sampling uses rejection inside `PLATE_W × PLATE_D`, with `PLATE_R` corners.
- [ ] **Step 4: Run the tests.**
  - Expected: PASS, 6 tests.
- [ ] **Step 5: Add the file to `scripts.test`.** Run `npm test`.
  - Expected: all pass.
- [ ] **Step 6: Commit** with `feat: generate the stack, flow and lane targets`.

### Task 4: The page without the building

**Files:**
- Delete:
  - `src/components/building/` (all of it, tests included);
  - `src/components/WorkIndex.tsx`, `src/components/Work.tsx`, `src/components/Hero.tsx`;
  - `scripts/render-stills.mjs` and `public/stills/`.
- Create:
  - `src/components/film/Film.tsx` (a stub; Task 5 fills it in);
  - `src/components/film/HeroScene.tsx`, `ThesisScene.tsx`, `WorkScene.tsx` and `StackDrawing.tsx`;
  - `src/components/CaseStudies.tsx`, `src/components/Archive.tsx`.
- Modify:
  - `src/app/page.tsx`, `src/components/Header.tsx`, `src/app/globals.css`;
  - `package.json` (remove `gsap`, the `stills` script and the building tests);
  - `docs/superpowers/specs/2026-11-19-portfolio-building-renovation-design.md` (a superseded note at the top).

**Interfaces:**
- Produces the DOM hooks Tasks 5 and 7 read:
  - `section[data-scene="hero" | "thesis" | "work"]`, each `min-height: 100svh`. The work scene keeps `id="work"`.
  - `[data-stack-box]`: the hero's drawing box. `StackDrawing` renders inside it.
  - `[data-node]` with `data-kind` (a `StepKind` or `grid`) and `data-flow` (the flow index within the scene). These are empty, `aria-hidden` markers.
  - `[data-mask]`: the text column, and the header band via `header[data-mask]`.
  - `[data-phrase="scoring" | "checks" | "approval"]` on the thesis's three phrases, with `data-group` set to the node index each one lights.
  - `#reading[data-reading]`, which wraps the case studies, the archive, About, Experience, Contact and the footer.
  - `#top`, kept as the first child of `main`.

- [ ] **Step 1: Delete the building and its scaffolding.**
  - Run `npm uninstall gsap`.
  - Remove the building test files from `scripts.test` and delete `scripts.stills`.
  - Run: `git grep -nE "building/|WorkIndex|render-stills|gsap|data-still" -- src scripts package.json`
  - Expected: no output (the doc folders may still mention them).
- [ ] **Step 2: Write `StackDrawing.tsx`.**
  - It renders the OG card's SVG from `drawing`, with the same paths and painter's order.
  - Plate fills use `var(--plate)` and `var(--plate-top)` and strokes `var(--line-2)`. The model faces use `--model`, with `--model-edge` strokes and two darker faces made with `color-mix` from `--model`.
  - Beside the SVG, it renders the five layer names from `layers` in `src/content/stack.ts`, absolutely positioned at `slotLabelTops()`, with a small `--model` square before "Model". They are visible from `lg` up.
- [ ] **Step 3: Write the three scenes.**
  - **`HeroScene`:**
    - the copy from today's `Hero.tsx`: the name in `t-display`, the role line, the two keys, and the "Creator of…" line;
    - the lead paragraph moves to the thesis;
    - the text column is `[data-mask]` in `lg:col-span-5`, and `[data-stack-box]` holding `StackDrawing` sits in `lg:col-span-7`.
  - **`ThesisScene`:**
    - "The model is a component, not the architecture." as an `h2` in `t-h2`;
    - the lead sentence, with the three phrases wrapped as `span[data-phrase]`;
    - on the right, six `data-node` markers in one vertical rail: `io`, `grid`, `model`, `guard`, `human`, `io`;
    - no visible labels (ruling: no new copy).
  - **`WorkScene`:**
    - the "Selected work" `h2`, today's lead line (with `spell()` as in `Work.tsx`) and `PipelineLegend` in the text column;
    - on the right, six lanes, one `ol` per flagship project. Its `li[data-node]` markers come from all of that project's flows in order, with a gap between flows, and `data-flow` set to the lane index;
    - under each lane, its name as a link to `#<id>`.
- [ ] **Step 4: Write `CaseStudies.tsx`.** It renders `flagship.map(ProjectCase)` inside `container-x`, which is today's right column without the building. It is temporary until phase 2.
- [ ] **Step 5: Write `Archive.tsx`.**
  - `id="also-shipped"`, with the heading and intro line as in `Work.tsx`.
  - Each project is a full-width row on the 12-column grid:
    - columns 1–3: name, kicker, status and date;
    - columns 4–10: `desc` and the tags;
    - columns 11–12: the links, right-aligned.
  - Below `md`, the row stacks. Each row has one hairline, and every `li` keeps its `id`.
- [ ] **Step 6: Compose `page.tsx`:**
  ```
  Header
  main#main: #top, Film(HeroScene, ThesisScene, WorkScene)
  #reading[data-reading]: CaseStudies, Archive, About, Experience, Contact, Footer
  ```
  - `Film` is a stub in this task. It is a client component that renders its children; Task 5 fills it in.
  - The footer moves inside `#reading`. The snap area has to reach the end of the page, or the browser can never show the footer in full.
- [ ] **Step 7: Make the header an overlay.**
  - It becomes `fixed inset-x-0 top-0` instead of `sticky`, and gets `data-mask`.
  - Add `html[data-film] header { border-color: transparent }`.
  - The `inert` list keeps working: the footer is now inside `#main`.
- [ ] **Step 8: Update `globals.css`:**
  - Set `html { scroll-padding-top: 0 }` and add `html[data-snap] { scroll-snap-type: y mandatory }`.
  - Add `[data-scene] { min-height: 100svh; scroll-snap-align: start; scroll-snap-stop: always; padding-top: var(--header) }`.
  - Add `[data-reading] { scroll-snap-align: start; position: relative; z-index: 1; background: var(--ground) }`.
  - Add `[data-reading] :is(section, article, li)[id] { scroll-margin-top: calc(var(--header) + 24px) }`. CaseStudies gets `padding-top: var(--header)`.
  - Remove the still-mode block and the tokens `--card`, `--alu`, `--acrylic`, `--glow`, `--route`, `--part`, `--part-2` and `--shadow`, after `git grep` shows no users. Keep `--plate` and `--plate-top` for `StackDrawing`.
- [ ] **Step 9: Add the superseded note** to the Renovation II spec: one line linking the dot-field spec.
- [ ] **Step 10: Verify:**
  - Run: `npm run typecheck && npm run lint && npm test && npm run build`
  - Expected: all succeed, and `out/index.html` contains `data-scene="hero"`, `data-scene="work"` and `data-reading`.
- [ ] **Step 11: Commit**, split in two:
  - `refactor: remove the building, its stills and GSAP`
  - `feat: lay out the film's first three scenes and the reading part`

### Task 5: Snap and wheel in the browser

**Files:**
- Create: `src/components/field/snap.ts`
- Modify: `src/components/film/Film.tsx` (it stops being a stub)

**Interfaces:**
- Consumes: `decideWheel` and `GESTURE_GAP_MS` (Task 1), and the DOM hooks (Task 4).
- Produces:
  - `function probeCoveringSnap(): Promise<boolean>`: the hidden container test from the spec. It returns `true` when the scroll position inside a tall snap child is left alone.
  - `function installFilm(o: { scenes: () => HTMLElement[]; reading: () => HTMLElement; reducedMotion: boolean }): () => void`
    - It sets `html[data-snap]` and adds a non-passive `wheel` listener on `window` that applies `decideWheel`.
    - On a step it scrolls with `behavior: "smooth"`, or `"instant"` under reduced motion. It clears `moving` on `scrollend`, or after 900 ms where `scrollend` is missing.
    - Targets inside `dialog[open]` or the open mobile menu count as `blocked`.
    - It returns a teardown.
  - `Film.tsx` also keeps `html[data-film]` in step with whether the reading part has reached the top of the viewport, using an `IntersectionObserver` on `#reading`.

- [ ] **Step 1: Implement `snap.ts` and wire it in `Film.tsx`.** The order is the probe, then `installFilm`. A reader who loaded on a deep link stays put, because the snap target nearest to their position is their own section, which is valid inside the reading part.
- [ ] **Step 2: Verify in a browser.**
  - Run `npm run build`, then serve `out/` with the CSP headers:
    - Run: `node <scratchpad>/tools/serve.mjs out public/_headers 4319`
  - In Shaan's Chrome through the extension, on `http://localhost:4319/`, send single wheel notches.
  - Expected:
    - `scrollY` goes 0 → `innerHeight` → `2·innerHeight` → the reading top, one per notch;
    - a 10-notch fling moves one scene;
    - inside the reading part, notches scroll natively;
    - one notch up from the reading top returns to the work scene.
- [ ] **Step 3: Commit** with `feat: snap the film one scene per wheel gesture`.

### Task 6: The field engine

**Files:**
- Create: `src/components/field/shaders.ts`, `src/components/field/engine.ts`

**Interfaces:**
- Consumes: `morph.ts` (Task 2) and `targets.ts` (Task 3).
- Produces:
  - `type FieldColors = { system: [number, number, number]; bright: [number, number, number]; dust: [number, number, number]; model: [number, number, number]; modelEdge: [number, number, number]; dark: boolean }`
  - `function createField(o: { canvas: HTMLCanvasElement; count: number; reducedMotion: boolean; onLost: () => void }): Field`
  - `Field` has these methods:
    - `show(t: Targets, opts?: { quick?: boolean }): void`: retargets, taking the CPU snapshot first.
    - `setStackBox(box: Rect): void`
    - `setMask(rects: Rect[]): void`: up to four rects.
    - `setPointer(x: number, y: number, inside: boolean): void`
    - `highlight(group: number): void`: −1 clears it.
    - `setColors(c: FieldColors): void`: eases over 0.4 s.
    - `setRunning(on: boolean): void`
    - `resize(w: number, h: number, dpr: number): void`
    - `dispose(): void`

- [ ] **Step 1: Write `shaders.ts`.**
  - **Vertex shader:**
    - It is a line-for-line port of `dotProgress`, `ease`, the Bézier, the flow wrap, the drift and the frame.
    - `aFrame` selects the stack frame (a `mat3` + centre + scale uniform) or the identity.
    - It projects px to clip space with `uViewport`.
    - Point size by kind: dust 1.4, system 2.2, model 2.6 CSS px, times the DPR, times a z-based depth term of ±15% for stack dots.
    - Alpha falls to 0.15 inside any `uMask` rect.
    - Pointer push: up to 14 px within 100 px, scaled by `uPointerAmt`.
    - Highlight: ×1.6 brightness where `aGroup == uHighlight`.
  - **Fragment shader:** a round dot with a 1 px soft edge. In light, model dots get a `modelEdge` rim.
- [ ] **Step 2: Write `engine.ts`.**
  - **Setup:**
    - `WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" })`.
    - One `Points` with a `BufferGeometry` holding `aFrom`, `aMid`, `aTo`, `aDelay`, `aSeed`, `aFlow`, `aKindFrom`, `aKindTo`, `aGroup` and `aFrame`, and `depthTest: false`.
    - Additive blending in dark, normal blending in light.
  - **`show()`:**
    - It calls `snapshot()` at `now` for `aFrom`.
    - It picks the mids: the midpoint, plus a random offset of 6–12% of `min(w, h)`, pushed to the right of the text mask on wide screens.
    - It sets `start` and `duration` (shape or move), and writes the buffers once.
  - **The loop:**
    - `requestAnimationFrame` while running and the document is visible.
    - Each frame it only updates uniforms: time, stack azimuth (`AZIMUTH + 4°/s` while the hero is active, held otherwise), the damped pointer and tilt (a spring of about 0.6 s), and the colour ease.
    - With `reducedMotion`, duration is 0, drift, flow speed, pointer and turn are all 0, and it renders on change only.
  - **Context loss:** `webglcontextlost` calls `onLost`.
- [ ] **Step 3: Verify.**
  - Run: `npm run typecheck && npm run lint`
  - Expected: clean. The behaviour is verified in Task 7.
- [ ] **Step 4: Commit** with `feat: add the dot field engine`.

### Task 7: Film drives the field

**Files:**
- Create: `src/components/field/dom.ts`
- Modify: `src/components/film/Film.tsx`, `src/components/film/StackDrawing.tsx` (fade hook)

**Interfaces:**
- Consumes: `createField` (Task 6), `stackTargets`, `flowTargets` and `rng` (Task 3), and the DOM hooks (Task 4).
- Produces:
  - `function readScene(section: HTMLElement): { flows: FlowInput[]; stackBox: Rect | null; mask: Rect[] }`. Rects are relative to the section's top-left, which is the viewport once the section is snapped.
  - `function readColors(): FieldColors`, read from the computed CSS tokens.

- [ ] **Step 1: Implement `dom.ts`.**
- [ ] **Step 2: Wire `Film.tsx`.**
  - **The mode:**
    - No WebGL, Save-Data or no-snap means the field never starts.
    - In no-snap mode the field draws only the hero stack and dust, and the thesis and lanes show no dots (ruling: no tiles for the unlabelled thesis rail).
    - Otherwise, choose the dot count from Global Constraints.
  - **Loading:** after `load`, plus an idle callback, `import("./../field/engine")` (with three.js). Build the targets for all three scenes from `readScene`.
  - **The seamless load:** the first `show()` is the stack with `quick`, already at rest on the drawing (azimuth 40°). Then `StackDrawing` fades out over 300 ms (`data-live`), and the turn starts.
  - **The active scene:** an `IntersectionObserver` with the band `-38% 0px -58% 0px` calls `show()` on change, and `setRunning(false)` once `#reading` covers the viewport.
  - **Events:** `pointermove` calls `setPointer`. Theme changes come from a `MutationObserver` on `html`'s `class` and call `setColors`. Resize rebuilds the targets, calls `resize()`, and re-shows the active scene with `quick`.
  - **Thesis phrases:** `pointerenter` and `pointerleave` call `highlight(data-group)`. On the first activation, they play once in sequence at 0.5 s steps.
  - **Context lost:** dispose, put the drawing back, and stop.
- [ ] **Step 3: Verify.**
  - Run `npm run build` and serve as in Task 5.
  - In Shaan's Chrome, check:
    - the hero shows the drawing, then dots exactly on it, then the slow turn;
    - a notch down sends the plates into the thesis rail and the cube into the model node;
    - the next notch splits the rail into six lanes with yellow at the model steps;
    - nothing appears in the text column, and the console is clean.
- [ ] **Step 4: Commit** with `feat: drive the field from the film's scenes`.

### Task 8: Phase 1 verification and the recording

**Files:**
- Modify: none, unless a check fails. A failure gets fixed under superpowers:systematic-debugging, with a test where the failure is in pure code.

- [ ] **Step 1: Run the full suite.**
  - Run: `npm run typecheck && npm run lint && npm test && npm run build`
  - Expected: all succeed.
- [ ] **Step 2: Real wheel.** Repeat Task 5, step 2, with the field running.
  - Expected: the same `scrollY` sequence, with no dropped frames visible.
- [ ] **Step 3: Deep links (Review Focus 2).** Load `/#about`, `/#work` and `/#atlas`.
  - Expected: after 2 s, `scrollY` equals the target's `offsetTop` minus its scroll margin, within 2 px.
- [ ] **Step 4: Resize (Review Focus 3).** On the thesis, resize the window from 1536 to 1280 px wide.
  - Expected: it stays on the thesis, and the dots re-form on the rail.
- [ ] **Step 5: Theme and reduced motion (Review Focus 4).**
  - Toggle the theme mid-morph. Expected: the colours ease, and no dot jumps.
  - Use CDP `Emulation.setEmulatedMedia` with reduced motion. Expected: no turn and no drift, and a scene change shows its final shape.
- [ ] **Step 6: No WebGL (Review Focus 5).** Use headless Chrome with `--disable-webgl`, and run `WEBGL_lose_context.loseContext()` on a live page.
  - Expected: the drawing stays, and there are no errors.
- [ ] **Step 7: Frame timing.**
  - Record the canvas with `captureStream(30)` while stepping through the three scenes with real notches, the same method used on insert.gr.
  - Extract the frame timing with ffprobe.
  - Expected: no frame over 25 ms after the first second, the spec's budget. (Corrected from 50 ms after the final review.)
- [ ] **Step 8: The recording for Shaan.**
  - Combine a webm of the canvas with a screen-level GIF of the page.
  - Send it with SendUserFile, along with what is still to come in phase 2.
- [ ] **Step 9: Run the final whole-branch review** as superpowers:executing-plans requires, and fix what it finds, each fix RED→GREEN.

---

## Follow-ups for phases 2 and 3

Phase 1 is done and reviewed. Its fixes are in `e25311b`. These are the review's deferred items and the open checks; the next plans pick them up.

- **Performance:** re-measure the scene-change frame in Shaan's Chrome without the extension capturing screenshots. Headless runs on his GPU measured 7 ms. If it is over 25 ms, pre-allocate the snapshot buffer and fold the kind pass into it.
- **Morph polish:**
  - a dot caught mid-morph jumps in colour, alpha and size on a retarget (only its position is continuous);
  - pushing midpoints beside the text column bunches faint dust;
  - pointer tilt isn't gated during the load crossfade.
- **Masks:** add the lane names and the hero's layer labels to the mask, so no dust drifts behind them.
- **Robustness:**
  - catch failures in the probe chain and the engine import;
  - assert `t.n === n` in `show()`;
  - stop rebuilding targets after a context loss;
  - prefer `powerPreference: "default"`.
- **Fallbacks:** the thesis and the lanes are blank when the field doesn't run. Phase 3 owns this.
- **Header scroll-spy:** "Work" isn't marked current while reading the case studies. Phase 2 makes them scenes.
- **Phase 3 checks:** WebKit and Shaan's phone (the snap test, `scrollend`), reduced motion's 200 ms fade, the README, the phone layout, and mobile URL-bar resizes.
