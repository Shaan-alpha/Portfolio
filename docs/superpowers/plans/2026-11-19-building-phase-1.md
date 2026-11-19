# Building Renovation, Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the exploded-stack hero with acts I–II of "The architecture". A detailed architectural model, generated in code, opens into its five levels as the visitor scrolls, then the camera dives through the atrium to the yellow model and back. It comes with level selection, drag, the dial ticks, and still-image fallbacks.

**Architecture:**
- Two pure modules, both unit-tested, define the building and the camera:
  - `blueprint.ts`: every part as a box or a cylinder;
  - `shots.ts`: framed camera shots and a choreography of beats over scroll progress 0–1.
- `scene.ts` turns the blueprint into instanced three.js meshes and renders on demand.
- `BuildingStage.tsx` pins the hero with GSAP ScrollTrigger and feeds its progress to the scene. It keeps the October callouts, layer buttons, caption and sound hooks.
- The stills are rendered by headless Chrome from a still mode of the same page, then encoded with ffmpeg.

**Tech Stack:**
- Next.js 16 (static export) and React 19
- three.js 0.186 (WebGLRenderer, with GTAO from `three/addons`)
- GSAP 3.15.1 with ScrollTrigger
- `node:test` for the unit tests
- System Chrome and ffmpeg for the stills, so no new tools

**Spec:** `docs/superpowers/specs/2026-11-19-portfolio-building-renovation-design.md`. Sound behaviour comes from `docs/superpowers/specs/2026-11-19-portfolio-sound-design.md`.

## Global Constraints

- **Palette.**
  - UI: ground `#eceef1`, ink `#111318`, graphite dark `#131518`, model `#ffc61a`.
  - Scene: studio void `#e6e8eb`, maquette white `#f8f9fa`, aluminium `#a7aeb6`, night window light `#dbe7ff`.
  - Yellow appears on exactly one part: the model block.
- **Type and copy.**
  - Archivo only, sentence case, no all-caps labels.
  - A level reads as its layer name with "level N" beside it, never "WORD — fragment".
  - Copy from `src/content/*` is used verbatim.
- **Budgets.**
  - First-load JS stays at or under 211 KB gzipped.
  - The lazy 3D chunk (three, GSAP and the scene code) stays at or under about 230 KB gzipped.
  - Detail `high`: at most 400,000 triangles and 80 groups. Detail `low`: at most 120,000 triangles and 40 groups.
- **Stack rules.**
  - CSP unchanged: no glTF, no WebAssembly decoders, no external hosts.
  - Native scroll only; no smooth-scroll library. Text never animates in.
  - Scrolling makes no sound. Existing cues stay: `select` and `deselect`, the `typing` detent tick, and `press` on keys.
  - `gsap` is pinned exactly at `3.15.1` and imported only inside the lazy chunk.
- **Degrade.** If the frame average stays above 22 ms, post-processing goes off first, then detail drops to `low`, each step once.
- **Commits.** Nothing is committed until Shaan says so, because pushing `main` deploys. No AI attribution in any commit.

## Review Focus

1. **Anchor links across the pinned act II.** The nav "Work" from the top, "Back to top" from the footer, and the browser's back and forward must all land on the right section, and the scroll-spy must still mark the right link. Task 6 has a check for this.
2. **Resize, orientation change and zoom in the middle of the pin.** Shots refit and ScrollTrigger refreshes, with no blank frame and no jump. Task 6 has a check for this.
3. **Theme toggle in the middle of the story.** The scene's palette swaps without a flash, and any still on screen matches the new theme. Task 6 has a check for this.
4. **Weak GPUs.** The degrade path fires once per step and never oscillates. Task 3 has the test for this.
5. **WebGL context loss or Save-Data.** The stills take over without collapsing the pinned layout. Task 6 has a check for this.

---

### Task 1: GSAP, the detents move, and the blueprint

**Files:**
- Modify: `package.json`, `package-lock.json` (add `gsap@3.15.1`; the test script now lists the new test files)
- Move: `src/components/stack/detents.ts` and `detents.test.mts` → `src/components/building/`
- Create: `src/components/building/blueprint.ts`
- Test: `src/components/building/blueprint.test.mts`

**Interfaces:**
- Produces:
  - `type Vec3 = [number, number, number]`
  - `type Part = { center: Vec3; size: Vec3; rotY?: number }`
  - `type MaterialId = "card" | "aluminium" | "acrylic" | "model" | "light"`
  - `type Owner = LayerId | "frame" | "plinth"`
  - `type PartGroup = { id: string; owner: Owner; material: MaterialId; shape: "box" | "cylinder"; parts: Part[] }`
  - `type Detail = "high" | "low"`
  - `type Blueprint = { groups: PartGroup[]; levels: { id: Exclude<LayerId, "model">; y: number }[]; atrium: { center: Vec3; size: Vec3 }; model: Part; bounds: { min: Vec3; max: Vec3 }; radius: number }`
  - `buildBlueprint(detail: Detail): Blueprint`
  - `triangles(bp: Blueprint): number`, where a box is 12 triangles and a cylinder is `4 * CYLINDER_SEGMENTS`
  - `CYLINDER_SEGMENTS = 12`
- `LayerId` is a type-only import from `@/content/stack`. Node strips it, so the test runs without path aliases.

- [ ] **Step 1: Install and vet.**
  - Run `npm install gsap@3.15.1 --save-exact`.
  - Confirm the lockfile integrity matches `npm view gsap@3.15.1 dist.integrity`.
  - Run `npm audit signatures`. Expect a verified signature for gsap and no invalid signatures.
  - Confirm `npm ls gsap` shows no dependencies of its own.
- [ ] **Step 2: Move the detents.** Move both detent files, and update the scene import and the test script path. Run `npm test` and expect 29 tests to pass.
- [ ] **Step 3: Write the failing tests** in `blueprint.test.mts`:

```ts
test("levels stack in layer order", () => {
  const y = Object.fromEntries(buildBlueprint("high").levels.map((l) => [l.id, l.y]));
  assert.ok(y.state < y.interfaces && y.interfaces < y.guards && y.guards < y.orchestration);
});
test("the model hangs in the atrium between guards and orchestration", () => {
  const bp = buildBlueprint("high");
  const y = Object.fromEntries(bp.levels.map((l) => [l.id, l.y]));
  assert.ok(y.guards < bp.model.center[1] && bp.model.center[1] < y.orchestration);
  assert.ok(inside(bp.model, bp.atrium));
});
test("nothing but the model enters the atrium", () => {
  const bp = buildBlueprint("high");
  for (const g of bp.groups) for (const p of g.parts) if (g.material !== "model") assert.equal(overlaps(p, bp.atrium), false, g.id);
});
test("yellow is used once", () => {
  const yellow = buildBlueprint("high").groups.filter((g) => g.material === "model");
  assert.equal(yellow.length, 1);
  assert.equal(yellow[0].parts.length, 1);
});
test("every part sits inside the bounds", () => { /* each part's AABB within bp.bounds, for both details */ });
test("detail budgets hold", () => {
  const hi = buildBlueprint("high"), lo = buildBlueprint("low");
  assert.ok(triangles(hi) <= 400_000 && hi.groups.length <= 80);
  assert.ok(triangles(lo) <= 120_000 && lo.groups.length <= 40);
  assert.ok(triangles(hi) > triangles(lo));
});
test("the blueprint is deterministic", () => assert.deepEqual(buildBlueprint("high"), buildBlueprint("high")));
```

  `inside` and `overlaps` are small AABB helpers in the test file. A part with `rotY` is checked against its rotated footprint's AABB.
- [ ] **Step 4: Run it red.** Add the file to the test script, run `npm test`, and expect it to fail because `blueprint.ts` is missing.
- [ ] **Step 5: Implement `buildBlueprint`.**
  - Use scene units of about 1 per storey.
  - Lay out, in order: the plinth; the structural grid (columns and beams); the slabs; the cut-away façade on two sides; the glazing and mullions on the other two; the stair and lift core.
  - Then furnish each level from the spec's level table: archive racks with status lights at B, entrances and figures at 0, gate rows and an approval desk at 1, ducts, trays and risers at 2.
  - Finally, the single model block in the atrium.
  - Any variation (the figures, the rack lights) comes from a seeded PRNG, so the result is deterministic.
  - `low` omits the furniture repeats and the mullion density, but keeps every level recognisable.
- [ ] **Step 6: Run checks.** Run `npm test` (all green) and `npm run typecheck` (clean).

### Task 2: Shots and choreography

**Files:**
- Create: `src/components/building/shots.ts`
- Test: `src/components/building/shots.test.mts`

**Interfaces:**
- Consumes: `Vec3` and `Blueprint` from Task 1.
- Produces:
  - `type Shot = { position: Vec3; target: Vec3; fov: number }`
  - `type ShotName = "site" | "section" | "dive"`
  - `fitDistance(radius: number, fovDeg: number, aspect: number, margin = 1.1): number`
  - `shotFor(name: ShotName, aspect: number, bp: Pick<Blueprint, "radius" | "atrium" | "model">): Shot`. The portrait variant applies when `aspect < 0.8`.
  - `lerpShot(a: Shot, b: Shot, t: number): Shot`
  - `type Beat = { shot: ShotName; separation: number; cut: number }`. `separation` and `cut` both run 0–1.
  - `BEATS: { at: number; beat: Beat }[]` = site at 0 (separation 0, cut 0), section at 0.35 (1, 1), dive at 0.62 (1, 1), section at 1 (1, 1).
  - `choreograph(p: number): { from: Beat; to: Beat; t: number }`. `p` is clamped to 0–1, and `t` is eased in-out cubic.

- [ ] **Step 1: Write the failing tests:**
  - "a fitted sphere stays inside the frustum at any aspect": for aspects 0.46, 0.75, 1, 1.6 and 2.4, `asin(r/d)` is no more than half of both the vertical and the horizontal fov.
  - "portrait framing pulls back": `shotFor("site", 0.46, bp)` is farther from its target than `shotFor("site", 1.6, bp)`.
  - "the dive ends in the atrium, looking at the model": the dive's position is inside the atrium box, and its target equals the model's centre.
  - "lerp hits both ends": the fov at the midpoint is the mean.
  - "choreography starts at the site and ends on the section": `choreograph(0).from.shot === "site"`, and at 1 the settled beat is `"section"`. `t` stays within 0–1 and the beats are monotonic.
- [ ] **Step 2: Run it red.** Run `npm test` and expect it to fail because `shots.ts` is missing.
- [ ] **Step 3: Implement.** Each shot is defined by an azimuth, an elevation and a distance factor, then fitted with `fitDistance`.
- [ ] **Step 4: Run checks.** Run `npm test` and `npm run typecheck`, and expect both green.

### Task 3: The building scene

**Files:**
- Create: `src/components/building/scene.ts`
- Create: `src/components/building/degrade.ts`
- Test: `src/components/building/degrade.test.mts`

**Interfaces:**
- Consumes: `buildBlueprint` and `Blueprint` (Task 1); `shotFor`, `lerpShot` and `choreograph` (Task 2); `createDetents` (moved in Task 1).
- Produces:
  - `type Anchor = { id: LayerId; x: number; y: number }`
  - `createBuildingScene(opts: { canvas: HTMLCanvasElement; detail: Detail; reducedMotion: boolean; onReady(): void; onHover(id: LayerId | null): void; onPick(id: LayerId | null): void; onRotated(rotated: boolean): void; onDetent?(): void; onAnchors(a: Anchor[]): void; onLost(): void }): BuildingScene`
  - `BuildingScene = { setProgress(p: number): void; setSelected(id: LayerId | null): void; setHighlighted(id: LayerId | null): void; resetView(): void; redraw(): void; renderStill(): Promise<void>; dispose(): void }`
  - `createDegrade(thresholdMs = 22, windowFrames = 90): (frameMs: number) => "post-off" | "low-detail" | null`. It returns each step at most once, in that order. It only fires when the window's average exceeds the threshold, and after a step it waits a full new window.

- [ ] **Step 1: Write the failing test** for `degrade.ts`:
  - 90 frames at 30 ms gives `"post-off"` once, and the next 90 give `"low-detail"` once.
  - After that it gives only `null`.
  - Frames at 15 ms never fire.
  - Alternating 15 and 30 ms (an average of 22.5) fires `"post-off"` only after a full window.
- [ ] **Step 2: Run it red, implement, run it green.** Run `npm test`.
- [ ] **Step 3: Implement `scene.ts`.** Keep `stack/scene.ts`'s renderer setup, PMREM environment, on-demand loop, offscreen pause, resize and pixel-ratio handling, palette reading from CSS variables, MutationObserver theme swap and context-loss handling, adapted as follows:
  - **Camera.** A PerspectiveCamera set from `lerpShot` of the current beats.
  - **Geometry.** One `InstancedMesh` per `PartGroup`, from shared unit box and cylinder geometry. The model block is its own Mesh, so it can lift and glow.
  - **Materials** by `MaterialId`:
    - `card`: maquette white, roughness 0.9.
    - `aluminium`: metalness 1, roughness 0.35.
    - `acrylic`: transparent at 0.35 opacity, roughness 0.2.
    - `model`: `#ffc61a` with a faint emissive.
    - `light`: a basic material. Cool white in the dark theme; a muted grey in the light theme.
  - **Scroll.** `setProgress` drives the camera, the level separation (each level's group offsets on y) and the cut-away (the cut façade groups slide out and fade).
  - **Lights.** A low sun with soft PCF shadows: 2048 at `high`, 1024 at `low`. GTAO through EffectComposer at `high` only, plus OutputPass.
  - **Selection.** Selecting or highlighting a level lifts and dims it as the stack does now.
  - **Drag.** Drag turns the building group, with inertia and the detents through `onDetent`, during acts I–II. `resetView` eases the turn back.
  - **Picking.** Raycast against per-level hit boxes.
  - **Anchors** come from each level's right-most corner, as now.
  - **Degrade.** The degrade monitor consumes frame times while the loop runs.
  - **`renderStill`** settles every animated value, renders once at a pixel ratio of 2, and resolves.
  - **The plinth engraving.** The plinth's front face carries "The model is a component, not the architecture." as a generated canvas texture: Archivo expanded, set in ink on aluminium. It is drawn only after `document.fonts.ready`, so it never bakes in a fallback font, and redrawn on a theme change.
  - **The dark theme in Phase 1** uses the graphite palette from the CSS variables, with the status lights in cool white. The full night studio arrives in Phase 3.
- [ ] **Step 4: Run checks.** Run `npm run lint`, `npm run typecheck` and `npm test`, and expect all clean.

### Task 4: BuildingStage and the hero swap

**Files:**
- Create: `src/components/building/BuildingStage.tsx`
- Modify: `src/components/Hero.tsx`. The hero section gets an id'd stage wrapper; the copy is unchanged.
- Delete: `src/components/stack/StackStage.tsx`, `scene.ts`, `geometry.ts`, `drawing.ts` and `StackDrawing.tsx`
- Modify: `src/app/globals.css`. Add the stage pin wrapper, and `html[data-still]` rules that hide everything but the stage.

**Interfaces:**
- Consumes: `createBuildingScene` (Task 3) and `play` from `@/lib/sound`.
- Imports `gsap` and `gsap/ScrollTrigger` dynamically, alongside `./scene`.

- [ ] **Step 1: Write `BuildingStage`.** Carry over StackStage's state model (loading, ready or static), the WebGL probe and the Save-Data check, then add:
  - **Detail.** `low` when `pointer: coarse`, when `innerWidth < 900`, or when `navigator.deviceMemory <= 4`.
  - **Loading.** One `Promise.all` loads `./scene`, `gsap` and `gsap/ScrollTrigger`, then calls `gsap.registerPlugin(ScrollTrigger)`.
  - **The pin.** The trigger is `#top`, from `"top top"` to `"+=250%"`, with `pin: true`, `scrub: 1` and an `onUpdate` that calls `scene.setProgress(self.progress)`. It is killed through `gsap.context().revert()` on unmount.
  - **Reduced motion.** No ScrollTrigger. Two sentinel elements, observed with an IntersectionObserver, set progress 0 or 0.35 behind a 300 ms canvas opacity dip.
  - **Kept from StackStage:**
    - the callouts and leader lines, with `placeCallouts`, on wide screens;
    - the wrapped layer buttons on small screens;
    - the caption, with its summary and "Seen in" links from `stack.ts`;
    - Escape to clear, and the Reset view key;
    - the sound effects: the `select`/`deselect` previous-value effect, and `onDetent` playing `typing` with `cooldownMs: 45` and a ±3% playback rate.
  - **Labels.** Callouts read "Guards" with a muted "level 1" beside it. The model's callout has no level.
  - **Fallback.** While loading, and when the stage is static, it shows the act I still for the current theme: two `<img>` elements, with `.dark` toggling which one shows, each with explicit width, height and `alt=""`.
- [ ] **Step 2: Swap the hero.** Render `<BuildingStage />` in `Hero.tsx`, delete the old stack files, and confirm nothing still imports them by grepping for `stack/`.
- [ ] **Step 3: Run checks.** Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`, and expect all clean. Then check that the first-load JS total in `out/index.html` is 211 KB gzipped or less, and that the chunk holding gsap is absent from the HTML.

### Task 5: The stills pipeline

**Files:**
- Modify: `BuildingStage.tsx` (still mode)
- Create: `scripts/render-stills.mjs`
- Modify: `package.json` (add the script `"stills": "node scripts/render-stills.mjs"`)
- Create: `public/stills/{site,section}-{light,dark}.{avif,webp}`

- [ ] **Step 1: Add the still mode.**
  - `?still=site|section&theme=light|dark` sets `html[data-still]` and forces the theme class.
  - The stage fills the viewport and calls `setProgress` with the beat's `at`.
  - It awaits `renderStill()`, then sets `document.documentElement.dataset.stillReady = "1"`.
- [ ] **Step 2: Write the script.**
  - It serves `out/` on port 4391.
  - For each of the four combinations it runs Chrome from `CHROME_PATH`, defaulting to `C:\Program Files\Google\Chrome\Application\chrome.exe`, with `--headless=new --hide-scrollbars --window-size=1600,1200 --virtual-time-budget=15000 --screenshot=<tmp>.png` against the still URL.
  - It encodes each screenshot with ffmpeg: `-c:v libaom-av1 -still-picture 1 -crf 32` to `.avif`, and `-c:v libwebp -quality 80` to `.webp`.
  - It fails loudly if any output is missing or blank, meaning under 5 KB.
- [ ] **Step 3: Run `npm run build && npm run stills`.** Expect four `.avif` files of 120 KB or less each, plus their `.webp`. Open each one with the Read tool and check that it shows the right shot in the right theme.
- [ ] **Step 4: Wire both stills** into the fallback in `<picture>` order, with AVIF before WebP.

### Task 6: Verify, document, review

**Files:**
- Modify: `README.md` (the Design bullets for the building)
- Modify: the spec's Status line
- Scratch only: the local CSP server, including the iframe-widths mode used for the sound work

- [ ] **Step 1: Run the full gate.** Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`, and expect all clean.
- [ ] **Step 2: Check in the browser,** under the production `_headers`.
  - Screenshots of act I, act II mid-way and the dive, in both themes, at 1440×900 and at 390×844 (iframe).
  - Review each one against the spec, and note anything that reads as a generated default.
- [ ] **Step 3: Run the Review Focus checks.**
  1. From the top, nav "Work" lands on `#work`, with the "Work" link marked current. Footer "Back to top" returns to the top, and back and forward restore the position.
  2. Resizing from 1440 to 1000 mid-pin, and running the iframe at portrait, leave no blank canvas, and the callouts re-place.
  3. Toggling the theme at act II swaps the palette in the same frame, and the light still is hidden in dark.
  4. Covered by the degrade unit tests. Also force the low-detail path with `deviceMemory` and confirm it renders.
  5. Forcing context loss with `WEBGL_lose_context` shows the still, and the page height is unchanged. With Save-Data emulated, no three or gsap chunk is requested.
- [ ] **Step 4: Check the console and budgets.**
  - No CSP violations, no console warnings apart from the known three.js shader-precision note, and no autoplay warnings.
  - First-load JS is 211 KB or less, and the 3D chunks total about 230 KB or less, gzipped.
  - Frame times: sample 120 frames during the dive on desktop and report the mean.
- [ ] **Step 5: Update the docs.** Update the README and the spec's status. Then do a whole-branch self-review against both specs (inline, as Shaan asked), and ledger the findings.
