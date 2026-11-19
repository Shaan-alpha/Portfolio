# Building Renovation, Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, as Shaan asked). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Acts III and IV of "The architecture" on wide screens.
- **Act III:** each production project is a route walked through the building as its case study scrolls past, built from its real `flows`.
- **Act IV:** the archive is read in the vault.

**Architecture:**
- **`routes.ts`** is pure and tested. It maps every step of a flow to a stop on its level, joins the stops into a path, and frames a camera for any point of a project's scroll.
- **The scene** gains a `routes` mode: cut-away open, levels closed, no drag. In it, a lit tube, stop markers and a travelling marker follow the active route.
- **`RouteStage.tsx`** sits sticky in the Work section with the project directory. One ScrollTrigger per case study, and one for the archive, drive it.

**Spec:** `docs/superpowers/specs/2026-11-19-portfolio-building-renovation-design.md` (act III and act IV rows, Phase 2).

## Global Constraints

- Phase 1's constraints all hold: the palette, yellow only for the model, copy verbatim, a CSP that is unchanged, native scroll, silent scrolling, and no new dependencies.
- **First-load JS** stays within 1% of 211,680 B gzipped. Everything new lives in the lazy scene chunk.
- **Wide screens only (lg and up).** Below lg the Work section is unchanged, and the pipeline tiles carry each route.
- **Reduced motion** gets one fixed overview shot per project, changed behind a short dip, with no camera flight. Without WebGL or with Save-Data, the directory stays and the stage shows the section still.
- **Commits.** Commit and push are approved by Shaan for this work, and pushing `main` deploys. No AI attribution.

## Review Focus

1. **Projects with two flows** (Atlas, VouchRank) walk both routes in order within their own scroll. Task 1 has a test for this.
2. **Anchor jumps from the directory** land on the right case study, and the stage shows that project's route. Task 3 has a check for this.
3. **Scrolling quickly through several case studies** never leaves a stale route drawn. Task 3 has a check for this.
4. **The camera never enters a solid part** at any point of any project's scroll. Task 1 has a test for this.
5. **Resizing across lg** tears the route stage down and builds it back without a leak. Task 3 has a check for this.

---

### Task 1: routes.ts (pure, TDD)

**Files:**
- Create: `src/components/building/routes.ts`
- Test: `src/components/building/routes.test.mts`

**Interfaces:**
- `type Stop = { kind: StepKind; position: Vec3; level: StoreyId | "model" }`
- `type Route = { stops: Stop[]; path: Vec3[] }`, where `path` is the waypoints the tube follows, starting and ending at the first and last stop.
- `routesFor(flows: Flow[], bp: Blueprint): Route[]`, one per flow.
- `routeShot(routes: Route[], p: number, aspect: number, bp: Blueprint): Shot`
  - Over 0–0.12 and 0.88–1 it is the overview: `shotFor("section", aspect, bp)`.
  - Between those, every stop of every route gets an equal slice, in order. A stop's shot stands outside the cut-away side nearest it, at the stop's height plus 0.6, about 4.2 units out, looking at the stop.
  - The moves between shots are eased.
- `travelAt(routes: Route[], p: number): { route: number; t: number }`, the travelling marker's route and its position 0–1 along that route's path.
- `shotFor("vault", …)` is added in shots.ts: from outside the plinth's cut side, looking into level B.

**Stop placement:**
- **`io`:** the first one at the street entrance in the lobby, the rest at reception.
- **`guard`:** the front gate line, the i-th guard at gate 2+i.
- **`human`:** the approval desk.
- **`step`:** along the plant floor at z = 1.6, the i-th at x = −3 + 0.9i.
- **`model`:** the model block's centre.
- **Changing level** goes through a riser in the core, except into and out of the model, which goes through the atrium from above.

- [ ] **Step 1: Write the failing tests:**
  - every flagship flow gets one stop per step;
  - each stop's y sits in its level's band, and model stops equal the model's centre;
  - no stop except a model stop is inside the atrium;
  - the path starts and ends on the first and last stops;
  - `routeShot` at 0 and at 1 equals the overview;
  - the camera never enters a solid part, sampled every 0.0025 for every flagship project, at 4:3 and 5:4;
  - `travelAt` walks the routes in order, so a two-flow project ends its first route before starting its second;
  - the vault shot stands outside the plinth.
- [ ] **Step 2: Run it red, implement, run it green.** Run `npm test` and expect everything to pass.

### Task 2: Routes mode in the scene

**Files:**
- Modify: `src/components/building/scene.ts`

**Interfaces:**
- `createBuildingScene(opts)` gains `mode?: "hero" | "routes"` (default `"hero"`) and `routes?: Record<string, Route[]>`.
- `BuildingScene` gains `setRoute(id: string | null, p: number): void`. Here `id` is a project id, or `"vault"` for the archive.

- [ ] **Step 1: Routes mode.**
  - Cut fixed at 1 and separation at 0. No drag, picking or hover.
  - The camera comes from `routeShot` for the active project, or the vault shot.
  - Each route's tube has radius 0.028 and samples a CatmullRom curve through `path`. It is drawn in ink in light and in `--glow` in dark.
  - Stop markers are discs. The model stop has none, because the block itself brightens (emissive 0.12 to 0.35) while the travelling marker is within one slice of it.
  - The travelling marker is a small sphere placed with `travelAt`.
  - Only the active project's routes are visible.
- [ ] **Step 2: Run checks.** Run `npm run lint`, `npm run typecheck` and `npm test`, and expect all clean.

### Task 3: RouteStage and the Work layout

**Files:**
- Create: `src/components/building/RouteStage.tsx`
- Modify: `src/components/Work.tsx`. On lg the left five columns hold a sticky column (the WorkIndex directory, then the stage at 4:3). The right seven hold the case studies, then the archive, with its heading moved above its list.
- Modify: `src/components/WorkIndex.tsx` only if spacing demands it.

- [ ] **Step 1: Write RouteStage.**
  - It is lg-only: the matchMedia `(min-width: 64rem)` builds or tears it down.
  - It uses the same WebGL and Save-Data gating as the hero.
  - It loads the scene chunk and GSAP lazily, and builds the routes from `flagship` flows plus `buildBlueprint`.
  - There is one ScrollTrigger per case study article (`top center` to `bottom center`, `scrub: 1`). Its `onUpdate` calls `setRoute(id, progress)`, and `onToggle` sets the active id.
  - The archive's trigger drives `setRoute("vault", p)`.
  - Reduced motion uses `setRoute(id, 0.5)` behind a dip, from an IntersectionObserver, with no ScrollTrigger.
  - When static, it shows the section still.
- [ ] **Step 2: Restructure Work.tsx** for lg. Below lg, the markup is unchanged.
- [ ] **Step 3: Run checks.** Run lint, typecheck, test and build, and expect all clean. Check that first-load JS is within 1%.
- [ ] **Step 4: Check in the browser,** under the production `_headers`. Take screenshots of three routes (Skill Issue, Atlas with two flows, one guard-heavy project) and the vault.
  - Review Focus 2: a directory jump lands on the project, and the stage shows its route.
  - Review Focus 3: a fast scroll through all six leaves the last project's route drawn.
  - Review Focus 5: crossing lg is not testable here, because the window is maximised. Check it in iframes at a narrow width and confirm the stage is absent.
  - Expect no console or CSP messages.

### Task 4: Docs, commit, push, deploy

- [ ] **Step 1: Update the docs.** Add the README Design bullet for the routes, and mark Phase 2 built in the spec's status line.
- [ ] **Step 2: Run the full gate,** then commit on `feat/building`, fast-forward `main`, push, and poll production for the build SHA.
- [ ] **Step 3: Smoke-test production** in Chrome: the hero, one route, and the console.
