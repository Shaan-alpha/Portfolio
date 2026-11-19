# Dot field, phase 2: the six systems

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add scenes 4 to 9 to the film. Each is one flagship system, with its real flow drawn in dots and its guard doing what its own text says. Then add the case-study sheet, the scene ticks, and the hairline handoff into the reading part.

**Architecture:**
- **Behaviour is still a pure function of time.**
  - Every dot gets a small program (stream, packet, hold, bounce, pulse or arrive) and a wander amount.
  - `morph.ts` evaluates positions on the CPU, and the vertex shader evaluates the same formulas, so a scene change never moves a dot.
- **What each system does lives in one table,** `behaviours.ts`, keyed by project id and step label. `flowTargets` turns it into per-dot programs.
- **The scenes stay HTML.** Each step is a `data-node` marker with its label and note beside it.
- **The interface is plain HTML:** a modal `<dialog>` for the case study and a `nav` of nine links for the ticks.

**Tech Stack:** as in phase 1. Next 16 (static export), React 19, Tailwind 4, three.js 0.186.1 (one `Points` draw call, `RawShaderMaterial`), `node:test` with type stripping, and headless Chrome over CDP plus the Chrome extension.

**Spec:** `docs/superpowers/specs/2026-11-19-portfolio-dot-field-design.md`.
- Binding for this plan: phase 2 ("The six systems"), the scene list, "The case study", "Scene ticks" and look-and-feel item 4.
- This plan also picks up items from the appendix of the phase 1 plan (`docs/superpowers/plans/2026-11-19-dot-field-phase-1.md`).

## Global Constraints

- **Copy:**
  - Verbatim from `src/content/*.ts`.
  - The only new visible strings are "Read the case study" and the nav label "Scenes", both from the spec.
  - "Close" is reused from the header's menu. The tick names are existing strings.
- **Yellow:** `--model`, on model parts only.
- **Branch and commits:**
  - Work on `feat/dot-field-systems`, branched from `main`, with conventional prefixes.
  - No `Co-Authored-By` and no AI attribution.
  - Never push: pushing `main` deploys.
  - Nothing goes live until Shaan has seen the recording and says so.
- **CSP and dependencies:**
  - Rules unchanged, and no inline event-handler attributes (React handlers are fine).
  - No new runtime dependencies. Keep `three@0.186.1` exact.
- **Tests:** `*.test.mts` run by `node --test` with type stripping. They use relative `.ts` imports and erasable TypeScript only.
- **Motion:**
  - The frame loop never reads the scroll position.
  - Layout is read on load, resize, theme change and scene activation only.
- **Timing:**
  - Shape 1.4 s, move 0.5 s, stagger 0.45 s and the 180 ms gesture gap, all unchanged.
  - Behaviour loops run 2–4 s.
  - Ambient drift stays at 1.5 px or less (the engine's 1.2). The narrator's free motion in Skill Issue is that system's behaviour (4 px or less), not ambient drift.
- **Dots:**
  - Counts are unchanged.
  - Every dot always has a target.
  - A dot only trades its part for its counterpart or for dust (the index blocks).
- **Budget:**
  - No frame over 25 ms during a scene change at 1440×900, and under 2 ms of CPU per frame.
  - The field's own code is at most 40 KB gzipped, three.js excluded.

## Review Focus

1. **Deep links and header links to a system** (`/#atlas`, the lane names) land flush on its scene, the field forms there, and the header marks Work. Task 8, check 3.
2. **A scene that doesn't fit the window** (1280×560, or large text) shows its flow as tiles, never as dots off their labels, and the wheel scrolls inside it. Task 7 sets `data-tiles`; Task 8, check 5.
3. **While the sheet is open:**
   - the wheel scrolls the sheet, never the film;
   - Escape or Close returns focus to "Read the case study";
   - the next wheel notch moves exactly one scene.

   Task 5's check, then Task 8, check 4.
4. **Leaving the film and coming back.** The dots settle on the line and the canvas stops; stepping back up re-forms the last system with no pop.
   - Covered by `morph.test.mts`: "retargeting mid-morph moves no dot" and "visibility carries across a retarget".
   - Task 8, check 6.
5. **Reduced motion and no WebGL.** Each behaviour shows a still frame that makes its point. Without the field, every system flow shows tiles. Task 8, checks 7 and 8.

---

### Task 1: Programs in the morph maths

**Files:**
- Modify: `src/components/field/morph.ts`, `src/components/field/engine.ts` (only its two `snapshot` call sites and the new `MorphState` arrays, so the build compiles)
- Test: `src/components/field/morph.test.mts`

**Interfaces:**
- Produces:
  - `const MODE = { stream: 0, packet: 1, hold: 2, bounce: 3, pulse: 4, arrive: 5 } as const`
  - `const PULSE = { amp: 0.3, decay: 2.6, hz: 1.6 } as const`
  - `MorphState` gains two arrays:
    - `loop: Float32Array`: four values per dot, namely the mode, the rate (cycles per second), and `a` and `b` (cycle points);
    - `wander: Float32Array`: a drift multiplier per dot, where 0 is rigid.
  - `smoothstep(e0: number, e1: number, x: number): number`, as in GLSL.
  - `cycle(phase: number, rate: number, clock: number): number`, which is `fract(phase + clock·rate)`.
  - `travel(mode: number, c: number, a: number, b: number): number`, how far along its edge a dot is (0 to 1).
  - `pulseFactor(c: number, a: number, rate: number): number`
  - `visibility(mode: number, c: number, u: number, a: number, b: number, moving: boolean): number`
  - `dotPosition(out, o, st, i, now, frame, clock, drift)`. `clock` is the loop clock and `drift` the ambient amplitude.
  - `snapshot(st, now, frame, clock, drift, out?)`. It now **includes** the drift, and it writes into `out` when one is given.
  - `shownVisibility(st: MorphState, i: number, now: number, clock: number, visFrom: Float32Array): number`, which is `visFrom[i] + (visibility(i's program) − visFrom[i])·p`.

These are the definitions. The shader ports them line for line in Task 3.

```
travel:     stream → c
            packet, hold, arrive → 0 for c ≤ a, 1 for c ≥ b, else smoothstep(0, 1, (c − a)/(b − a))
            bounce → m = (a + b)/2; 0 outside [a, b]; smoothstep out on [a, m], back on [m, b]
            pulse  → 0
pulseFactor: c < a → 0; else τ = (c − a)/rate seconds, amp·exp(−decay·τ)·sin(2π·hz·τ)
position:   k = pulse dots ? pulseFactor : travel       (a pulse dot's flow.xyz is to − centre)
            l = to + flow.xyz·k, framed, then the phase 1 Bézier
            + p·drift·wander[i]·(sin(now(0.6+0.5s)+6.283s), cos(now(0.7+0.4s)+6.283s), 0)
visibility: stream → moving ? smoothstep(0, 0.12, u)·(1 − smoothstep(0.88, 1, u)) : 1
            packet, bounce → smoothstep(a, a + 0.03, c)·(1 − smoothstep(b − 0.03, b, c))
            hold, arrive → smoothstep(a, a + 0.03, c)·(1 − smoothstep(0.93, 1, c))
            pulse → 1
```

Drift is now multiplied by the dot's own progress `p`, and the snapshot carries the old drift into `from`. So a dot whose wander changes at a scene change, for example from the narrator's 3 to 0, still never jumps. This replaces phase 1's drift-free snapshot.

- [ ] **Step 1: Write the failing tests** in `morph.test.mts`. Extend `randomState` with `loop` and `wander`, and move the existing tests to the new signatures (stream mode, rate 0.25, `clock = now`).
  - `a stream runs its edge once per cycle`:
    - `travel(MODE.stream, 0.3, 0, 1) === 0.3`;
    - `cycle(0.9, 0.25, 2)` ≈ 0.4.
  - `a packet waits at its gate, crosses in its window and rests at the end`, with window [0.5, 0.8]: c 0.2 → 0; 0.65 → 0.5; 0.8 → 1; 0.95 → 1.
  - `a bounce goes out and comes back inside its window`, with window [0.3, 0.8]: 0.2 → 0; 0.55 → 1; 0.8 → 0; 0.9 → 0; 0.425 → strictly between 0 and 1.
  - `a pulse is still before its start, swings, then settles`:
    - `pulseFactor(0.4, 0.62, 1/3.6) === 0`;
    - the largest |f| over c ∈ [0.62, 0.8] is at least 0.1;
    - |`pulseFactor(0.999, 0.62, 1/3.6)`| < 0.02.
  - `a resting packet is hidden and a held dot stays visible until its cycle ends`:
    - packet [0.5, 0.8]: c 0.2 → 0, and c 0.65 → 1;
    - hold [0, 0.35]: c 0.6 → 1, and c 0.99 → under 0.1;
    - a moving stream: u 0.5 → 1, and u 0.01 → under 0.2;
    - a static stream: u 0.01 → 1.
  - `a rigid dot never drifts`: take one arrived dot (p = 1) with zero flow and drift 1.2.
    - With wander 0, its position at `now` 3, 4.1 and 7.7 is the same each time.
    - With wander 1, the positions differ.
  - `retargeting mid-morph moves no dot` (rewritten):
    1. Build state A from mixed modes (stream, packet, bounce, pulse) and wander values from {0, 1, 3}, and stop it mid-morph.
    2. Take `s = snapshot(A, now, frame, clockA, 1.2)`.
    3. Build state B with new modes, new wander values and its own clock, setting `from = s` and `start = now`.
    - Expected: for every dot, `dotPosition(B, now, IDENTITY_FRAME, clockB, 1.2)` ≈ `s` (within 1e-3).
  - `visibility carries across a retarget`:
    - `shownVisibility(B, i, now, clockB, visFromB) === visFromB[i]`, where `visFromB[i] = shownVisibility(A, i, now, clockA, visFromA)`;
    - and, once B has arrived, `shownVisibility` equals B's own `visibility`.
  - `a frozen loop clock holds every dot still`: take an arrived state of packets and streams with drift 0 and a fixed clock. Expected: the same positions at three different values of `now`.
  - `snapshot fills the buffer it is given`: `snapshot(..., out) === out`.
- [ ] **Step 2: Run the tests.**
  - Run: `npm test 2>&1 | tail -30`
  - Expected: FAIL, because `MODE`, `cycle`, `travel` and the rest are not exported yet.
- [ ] **Step 3: Implement** the definitions above in `morph.ts`.
  - In `engine.ts`:
    - allocate `loop` (zeros) and `wander` (ones) in the CPU state;
    - pass `(clock, drift)` to `snapshot`, where the clock is the existing `now` and the drift is `motion ? DRIFT_PX : 0`.
  - The GPU side is Task 3.
- [ ] **Step 4: Check that everything passes.**
  - Run: `npm test && npm run typecheck`
  - Expected: both pass.
- [ ] **Step 5: Commit.** `git commit -m "feat: give each dot a looping program in the morph maths"`

### Task 2: The behaviour table and flow targets

**Files:**
- Create: `src/components/field/behaviours.ts`, test `src/components/field/behaviours.test.mts`
- Modify: `src/components/field/targets.ts`, `src/components/field/targets.test.mts`, `package.json` (add the new test file to `scripts.test`)

**Interfaces:**
- Consumes: `MODE` (Task 1).
- Produces, in `behaviours.ts`:
  ```ts
  export type StepBehaviour = { shape?: "grid" | "box" | "posts"; posts?: number; wander?: number; pulseAt?: number; arrive?: [number, number] };
  export type EdgeProgram =
    | { kind: "stream"; share?: number }
    | { kind: "packets"; window: [number, number]; count: number; gap?: number; spread?: number }
    | { kind: "hold"; window: [number, number]; share: number; stopShort: number }
    | { kind: "bounce"; window: [number, number]; count: number; gap?: number; stopShort: number };
  export type Behaviour = { period: number; still: number; steps?: Record<string, StepBehaviour>; edges?: Record<string, EdgeProgram[]>; exits?: Record<string, EdgeProgram[]> };
  export const BEHAVIOURS: Record<string, Behaviour>; // by project id
  ```
  - **`edges[label]`** replaces the default single stream on the edge that leaves that step.
  - **`exits[label]`** adds an edge out past the last step of a flow.
  - **Windows and `still`** are cycle points.
  - **`gap`** shifts packet j by j·gap.
  - **`spread` and `stopShort`** are in step radii.
  - **`share`** is a program's part of the edge's stream budget.
- Produces, in `targets.ts`:
  - `Kind = 0 | 1 | 2 | 3`, where 3 is the handoff line.
  - `Targets` gains:
    - `loop` (4n values);
    - `wander` (n values);
    - `still: number`, the loop clock a reduced-motion still shows: `behaviour.still·behaviour.period` when there is a behaviour, otherwise 0.
  - `FlowNode` gains `step?: string` (the step's label).
  - `flowTargets(n, flows, viewport, mask, random, behaviour?: Behaviour): Targets`
  - `lineTargets(n: number, y: number, width: number): Targets`
  - `lineAlpha(n: number, width: number, dark: boolean): number`. With d = n / width dots per pixel, it returns `dark ? 0.8/d : 1 − 0.1^(1/d)`, clamped to [0.02, 0.6]. In light, the overlapping dots then add up to one opaque hairline; in dark, additive blending gives about one hairline's brightness.
  - `STREAM_PX_PER_S = 16`, `PACKET_DOTS = 14`, `EXIT_PX = 56`.

The table. Each entry is the spec's sentence for that system, and each test below is named after it.

```ts
"skill-issue": { period: 3, still: 0, steps: { Score: { shape: "grid", wander: 0 }, Narrate: { wander: 3 } } },
atlas: { period: 4, still: 0.8, edges: { "Salience check": [{ kind: "packets", window: [0.62, 0.9], count: 1 }] } },
syntrueno: { period: 3.6, still: 0.52,
  steps: { "Five guards": { shape: "posts", posts: 5 }, "Human gate": { arrive: [0.2, 0.38] }, "Execute and verify": { pulseAt: 0.64 } },
  edges: { "Human gate": [{ kind: "packets", window: [0.42, 0.62], count: 1 }] } },
"ai-reel-factory": { period: 4, still: 0.53, edges: {
  "Research and pitch": [{ kind: "packets", window: [0.04, 0.3], count: 6, gap: 0.02, spread: 0.7 }],
  Approve: [{ kind: "packets", window: [0.42, 0.56], count: 3, gap: 0.025 }],
  Script: [{ kind: "packets", window: [0.6, 0.71], count: 3, gap: 0.025 }],
  "Fact-check": [{ kind: "packets", window: [0.74, 0.85], count: 3, gap: 0.025 }],
  "Voice and B-roll": [{ kind: "packets", window: [0.88, 0.95], count: 3, gap: 0.015 }] } },
vouchrank: { period: 3, still: 0, steps: { "Agency workspace": { shape: "box" } }, exits: { Consent: [{ kind: "stream" }] } },
"think9-brain": { period: 3.6, still: 0.66,
  edges: {
    Question: [{ kind: "stream", share: 0.6 }, { kind: "hold", window: [0, 0.34], share: 0.4, stopShort: 1 }],
    Cite: [{ kind: "stream", share: 0.6 }, { kind: "bounce", window: [0.3, 0.82], count: 2, gap: 0.12, stopShort: 0.9 }] },
  exits: { "Answer or refuse": [{ kind: "stream" }] } },
```

The tests don't settle how `flowTargets` applies the table, so these are the decisions:

- **Gaps.** Edges reach a guard's centre (gap 0), so a stream passes between its posts. Other steps keep the 1.25r gap. `stopShort` overrides the gap at the end of an edge.
- **Rates, phases and offsets:**

  | Program | Rate | Phase | Lateral offset |
  |---|---|---|---|
  | Stream | `STREAM_PX_PER_S / max(span, 24)` | random | as in phase 1 |
  | Hold | `1/period` | `−0.2·random()`, so the dots trickle in | within ±0.45r |
  | Packets and bounces | `1/period` | `−j·gap` ± 0.004 | `spread·r·(2j/(count−1) − 1)` ± 1.5 px |

  Packets and bounces have `PACKET_DOTS` dots each.
- **Step shapes:**
  - **`grid`** is the 10×10 lattice, `max(1.6r, 36)` px across.
  - **`posts`** puts `posts` short posts, each 0.32r tall, on alternating sides of the stream, spaced evenly over the step's height.
  - **`box`** is a rectangle outline 1.5r outside the nodes of the step's flow, at 0.5 dots per px.
  - **`arrive`** sets a human step's centre dots to the arrive mode: they travel in from 1.8r to the left.
  - **`pulseAt`** sets the step's dots to the pulse mode, with `flow.xyz = to − centre`.
  - **`wander`** sets the step's dots' wander. The default is 1.
- **Exits** leave the last step along the flow's last direction, for `EXIT_PX`.
- **`lineTargets`** puts every dot, kind 3, on `y`, with x spread evenly over `[0, width]`, delay `x/width`, zero flow and wander 0.
- **Unchanged from phase 1:** the blocks, the caps, and the dust outside the mask. `stackTargets` fills `loop` with zeros (static) and `wander` with ones.

- [ ] **Step 1: Write the failing tests.**
  - In `behaviours.test.mts`:
    - `every behaviour names a flagship system and its real steps`:
      - each id is a flagship id;
      - every key in `steps` and `edges` is a step label of that project;
      - no `edges` key is the last step of its flow;
      - every `exits` key is the last step of its flow.
    - `every loop runs 2 to 4 seconds and stays inside one cycle`:
      - `2 ≤ period ≤ 4` and `0 ≤ still < 1`;
      - every window has `0 ≤ a < b ≤ 1`, and `b + (count − 1)·gap < 1`;
      - the stream and hold shares on an edge add up to 1 or less.
  - In `targets.test.mts`: add a helper that builds each system's `FlowInput[]` from `projects.ts`, at `x = 900 + 260·f`, `y = 140 + 70·k`, radius 20, with `step` set to the label. Then:
    - `Skill Issue: the score is a rigid grid, and the narrator moves freely beside it`:
      - Score's dots sit on at most 100 lattice points and have wander 0;
      - Narrate's dots are yellow, with wander 2 or more;
      - no Narrate dot is inside the Score grid's box.
    - `Atlas: the briefing passes the salience check one packet at a time`:
      - the dots leaving Salience check are in packet mode with one distinct phase cluster;
      - every edge dot of the message flow is in stream mode.
    - `Syntrueno: five posts, an arriving approval, one packet, then a pulse`:
      - Five guards' dots fall into 5 clusters on alternating sides;
      - Human gate has arrive dots;
      - the edge out of Human gate is one packet;
      - Execute and verify's dots are in pulse mode, with `a` = 0.64.
    - `AI Reel Factory: a spread of six pitches, and at most three continue`:
      - the edge out of Research and pitch has 6 packets, whose lateral offsets span r or more;
      - each later edge carries exactly 3 packets;
      - the edges into and out of Fact-check meet at its centre.
    - `VouchRank: the audit runs inside its workspace, and consent filters nothing`:
      - the bounds of the box dots contain every node of the audit flow;
      - an exit stream leaves Consent, moving down.
    - `Think9 Brain: part of the stream is held back, and some answers turn back`:
      - the hold dots on the Question edge end at least 0.9r short of Retrieve's centre;
      - the Cite edge has bounce dots;
      - an exit stream leaves Answer or refuse.
    - `every system keeps yellow on its models and fills its blocks`. For all six systems:
      - every yellow dot is within 1.3r of a model node;
      - `t.n === n`;
      - model dots stay in the model block.
    - `streams keep a steady speed on the screen`: for stream dots on spans of 24 px or more, `rate·|flow|` ≈ 16.
    - `the handoff is one hairline`, for `lineTargets(5000, 64.5, 1440)`:
      - every y is 64.5 and 0 ≤ x ≤ 1440;
      - every dot is kind 3 with wander 0;
      - `lineAlpha(16000, 1440, false)` is within (0.02, 0.6).
- [ ] **Step 2: Run the tests.**
  - Run: `npm test 2>&1 | tail -30`
  - Expected: FAIL, because `BEHAVIOURS`, `lineTargets` and the `loop` arrays don't exist yet.
- [ ] **Step 3: Implement** `behaviours.ts`, and the `flowTargets` changes described above.
- [ ] **Step 4: Check that everything passes.**
  - Run: `npm test && npm run typecheck`
  - Expected: all pass, including phase 1's targets tests. The thesis and the lanes have no behaviour, so they keep streams only, with `still` 0.
- [ ] **Step 5: Commit.** `git commit -m "feat: describe each system's behaviour and build it into the targets"`

### Task 3: Shaders, engine and the layout reader

**Files:**
- Modify:
  - `src/components/field/shaders.ts`, `engine.ts` and `dom.ts`;
  - `src/components/film/Film.tsx` (call sites only);
  - `HeroScene.tsx`, `StackDrawing.tsx`, `ThesisScene.tsx` and `WorkScene.tsx` (mask attributes).
- Test: `src/components/field/dom.test.mts`

**Interfaces:**
- Consumes: Task 1's maths and Task 2's `Targets` and `lineAlpha`.
- Produces:
  - `MAX_MASKS = 16`, exported from `engine.ts` and mirrored in the shader.
  - `Field.setMask(rects: Rect[], textRight: number)`. It keeps the first 16 rects. `textRight` is the right edge of the text column, used for the midpoint push (0 means none).
  - `Field.show()` throws when `t.n !== count`.
  - `FieldColors` gains `line: RGB`, read from `--line` by `readColors()`.
  - `readScene` changes:
    - `SceneLayout` gains `textRight: number`: the largest right edge among the `[data-mask="text"]` elements, or 0.
    - The header's band comes **first** in `mask`.
    - Rects with no size are skipped.
    - Each node carries `step` from `data-step`.
- **Engine decisions:**
  - **Attributes and uniforms.** The attributes `aLoop` (vec4), `aWander` and `aVisFrom` join phase 1's nine. `uLoopClock` replaces `uFlowSpeed`. `uLine` and `uLineAlpha` are new.
  - **The loop clock** is `motion ? now − loopStart : t.still`.
    - A scene change sets `loopStart = now + 0.7`, so a behaviour starts as its shape forms.
    - A `quick` show keeps `loopStart`, and an `instant` one sets it to `now`.
  - **On each show:**
    - snapshot into a buffer that is allocated once;
    - set `visFrom[i] = shownVisibility(i)` under the old state;
    - handle kinds as before.
  - **Shader colour and alpha:**
    - It multiplies the drift by `p`, and the alpha by `mix(aVisFrom, visibility, p)`.
    - A held dot greys towards `uDust` over `smoothstep(b, b + 0.1, c)`.
    - An arriving dot is `uBright` at full alpha.
    - Kind 3 is `uLine` at `uLineAlpha`, with size 1.2.
  - **`uLineAlpha`** is `lineAlpha(n, w, dark)`, set in `setColors` and in `resize`.
  - **`powerPreference: "default"`** (phase 1 follow-up).
- **Markup:**
  - `data-mask="text"` on the text column of the hero, thesis and work scenes;
  - `data-mask` on each hero layer label and on each lane name (phase 1 follow-up).

- [ ] **Step 1: Write the failing tests** in `dom.test.mts`. Use plain fake objects for the section, its elements and `globalThis.document`, each with `getBoundingClientRect`, `dataset`, `querySelectorAll` and `querySelector`.
  - `the header's band comes first and the text column sets textRight`
  - `a step's label rides along with its node`
  - `masks with no size are left out`
- [ ] **Step 2: Run the tests.**
  - Run: `npm test 2>&1 | tail -20`
  - Expected: FAIL, because `textRight` is undefined and the header comes last.
- [ ] **Step 3: Implement.**
  - **`dom.ts`** as above.
  - **The shader port:** in `shaders.ts`, write `cycle`, `travel`, `pulseFactor` and `visibility` as GLSL functions with morph.ts's names, and use them the way `dotPosition` does.
  - **The engine wiring** as above.
  - **Film** passes `layout.textRight` with each mask.
  - **The markup attributes.**
- [ ] **Step 4: Check that everything passes.**
  - Run: `npm run typecheck && npm run lint && npm test && npm run build`
  - Expected: all succeed.
- [ ] **Step 5: Browser smoke test.**
  - Run: `node <scratchpad>/tools/phase1.mjs <outDir>` against the build (with `serve.mjs`).
  - Expected:
    - phase 1's checks still pass;
    - the three scenes render with no console errors;
    - the thesis streams fade in and out at their ends.
- [ ] **Step 6: Commit.** `git commit -m "feat: run the dots' programs on the GPU"`

GLSL can't run in node, so the final review checks the port against morph.ts by reading the two side by side.

### Task 4: The six system scenes

**Files:**
- Create: `src/components/film/SystemScene.tsx`, `src/components/film/SceneFlows.tsx`, `src/components/StatusLabel.tsx` (moved from ProjectCase)
- Modify:
  - `src/app/page.tsx`, `src/components/Archive.tsx` and `src/app/globals.css`;
  - `src/components/Pipeline.tsx` (export `KindIcon` and `KIND_LABEL`).
- Delete: `src/components/CaseStudies.tsx`
- Check script: `<scratchpad>/tools/phase2.mjs`. Copy the launcher from `phase1.mjs`. Subcommands: `scenes`, `sheet`, `ticks`, `handoff`, `tiles`, `timing`, `record`.

**Interfaces:**
- Consumes: the `data-*` contract that `readScene` reads (Task 3).
- Produces:
  - **`SystemScene({ project }: { project: Project })`** renders `<section id={p.id} data-scene={p.id} aria-labelledby={`${p.id}-title`}>`, using the hero's grid classes.
    - **The text column** (`data-mask="text"`, the left five of 12 columns on `lg`) holds, in order:
      - the name (h2, `t-h2`);
      - the status and date, as ProjectCase showed them;
      - the kicker;
      - `desc`, hidden below `md`;
      - a row of keys: an `opener` slot that Task 5 fills, the live link (`key key-secondary key-sm`, "Open {liveLabel ?? hostOf}", as ProjectCase had it) and Source.
    - **The flows** fill the right seven columns.
  - **`SceneFlows({ flows, name })`** gives each flow a rail, `<ol aria-label="How {title} runs, step by step">`, using Pipeline's label.
    - Each step's `li` holds:
      - a marker, `<span data-node data-kind data-flow={f} data-step={label}>`, which holds a `data-glyph` tile: Pipeline's tile look with its kind icon, as `PipelineLegend` draws it;
      - then a `data-mask` block with the label (15 px semibold, plus Pipeline's sr-only kind) and the note (13.5 px `ink-3`, hidden below `md`).
    - Two flows sit side by side, each under its name (h3, 14 px semibold, `data-mask`).
  - **Sizes.**
    - Markers are `size-[clamp(1.75rem,4.4svh,2.5rem)]`, and rows are spaced `gap-y-[clamp(0.75rem,3.6svh,2.25rem)]`.
    - At 1280×640 this makes AI Reel Factory's seven steps about 420 px tall, the spec's count.
  - **CSS:**
    - `[data-glyph]` fades over 300 ms.
    - `html[data-field] [data-scene]:not([data-tiles]) [data-glyph] { opacity: 0 }`
  - **The reading part opens with "Also shipped".**
    - Its section loses its top border, because the header's hairline is the line it starts from.
    - It gets top padding of `calc(var(--header) + 5rem)`.
    - `#also-shipped` gets `scroll-margin-top: 0`, because it is the reading part's top and so a snap stop.

- [ ] **Step 1: Write the failing check** `phase2.mjs scenes`. It loads the built site and checks four things:
  - there are 9 `[data-scene]` elements, in the order hero, thesis, work, then the six flagship ids;
  - in each system scene, the `data-step` values match its flows' labels in order;
  - each system scene has a `data-mask="text"`;
  - `#reading`'s first child is `#also-shipped`, and there is no case-study `article`.
- [ ] **Step 2: Run the check.**
  - Run: `npm run build`, then `node phase2.mjs scenes`.
  - Expected: FAIL, because there are only 3 scenes.
- [ ] **Step 3: Implement** the files above.
  - Put the six scenes in `<Film>`, in `flagship` order, after `WorkScene`.
  - Archive imports `StatusLabel` from its new file.
- [ ] **Step 4: Run the check again.**
  - Run: build, then `scenes` at 1440×900 and at 1280×640.
  - Expected: PASS. At 1280×640, every scene's `offsetHeight` is 640 or less (each one fits).
- [ ] **Step 5: Check that everything passes.**
  - Run: `npm run typecheck && npm run lint && npm test`
  - Expected: all pass.
- [ ] **Step 6: Commit.** `git commit -m "feat: give each system its own scene"`

### Task 5: The case-study sheet

**Files:**
- Create: `src/components/film/CaseSheet.tsx` (client), `src/components/CaseDetails.tsx`
- Modify:
  - `SystemScene.tsx` (the opener);
  - `src/app/globals.css` (the sheet, and `html { scrollbar-gutter: stable }` so that locking the page doesn't shift the layout or the canvas);
  - `Pipeline.tsx` (its comment about ProjectCase).
- Delete: `src/components/ProjectCase.tsx`

**Interfaces:**
- **`CaseSheet({ id, name, children })`** renders two things:
  - the "Read the case study" key (`key key-primary key-sm`, `data-sfx`, `aria-haspopup="dialog"`);
  - a `<dialog aria-labelledby={`${id}-sheet-title`}>` holding the name (h2, `t-h3`), a Close key (`key key-secondary key-sm`, `data-sfx`) and `children`.

  Its behaviour:
  - **Opening:** set `document.documentElement.style.overflow = "hidden"`, call `showModal()`, then `play("open")`.
  - **Closing.** Close, Escape and a click on the backdrop outside the panel's rect all go through one `close` handler, which restores the overflow, plays `"close"` and focuses the opener.
- **`CaseDetails({ project })`**:
  - below `md` only, `desc` and the full `Pipeline` with its notes;
  - always, the bullets, the tags with their logos, and the live and source links, as ProjectCase had them.
- **CSS:**
  - The sheet is a right-hand panel, `min(40rem, 100vw)` wide and full height, over a scrim. It scrolls inside, with `overscroll-behavior: contain`.
  - It is full screen below `md`.
  - It slides in over 280 ms using `@starting-style`. Reduced motion removes the slide through the global rule.

- [ ] **Step 1: Write the failing check** `phase2.mjs sheet`. On the Atlas scene, with snap on:
  1. Click "Read the case study". Expected: `dialog[open]`, the root's overflow is `hidden`, and `scrollY` is unchanged.
  2. Dispatch a wheel event over the dialog. Expected: the dialog's `scrollTop` grows and `scrollY` doesn't change.
  3. Press Escape. Expected: no `dialog[open]`, focus is on the opener, and the overflow is restored.
  4. Send one wheel notch. Expected: `scrollY` equals Syntrueno's top.
- [ ] **Step 2: Run the check.**
  - Run: build, then `node phase2.mjs sheet`.
  - Expected: FAIL, because there is no opener.
- [ ] **Step 3: Implement** the sheet.
- [ ] **Step 4: Check that everything passes.**
  - Run: `sheet`, then `npm run typecheck && npm run lint && npm test`.
  - Expected: all pass.
- [ ] **Step 5: Commit.** `git commit -m "feat: open each case study in a sheet over its scene"`

### Task 6: Scene ticks and the header's scroll-spy

**Files:**
- Create: `src/components/film/places.ts`, test `src/components/film/places.test.mts`, and `src/components/film/SceneTicks.tsx` (client)
- Modify:
  - `ThesisScene.tsx` (`id="thesis"`, and its title from `places`);
  - `WorkScene.tsx` (its title from `places`);
  - `Header.tsx`, `src/app/page.tsx`, `globals.css` and `package.json`.

**Interfaces:**
- **`places.ts`** exports:
  - `THESIS_TITLE` and `WORK_TITLE`;
  - `scenePlaces(systems: { id: string; name: string }[]): { href: string; name: string }[]`, which returns, in order:
    - `#top` with `profile.name`;
    - `#thesis` with `THESIS_TITLE`;
    - `#work` with `WORK_TITLE`;
    - then each system as `#id` with its name;
  - `navCurrent(active: string | null, systemIds: string[]): string | null`. It returns "work" for the work scene, every system, and "also-shipped"; any other value passes through unchanged.
- **`SceneTicks()`** renders `<nav aria-label="Scenes" data-ticks>` with nine links from `scenePlaces(flagship)`.
  - **Placement:** fixed on the right edge, centred vertically, and placed after the six scenes inside `<Film>`.
  - **Hidden** below `md`, and while the reading part holds the screen (`html:not([data-film])`).
  - **The current scene** is the first `[data-scene]` crossing the band `-38% 0px -58% 0px`. Its link gets `aria-current="location"`, a longer tick and ink colour.
  - **Names:** a tick's name appears beside it on hover and on focus.
  - **Hit area:** at least 24 px.
- **The header** spies on `["work", ...flagship ids, "also-shipped", "about", "experience", "contact"]`, and marks `navCurrent(active)` as current.

- [ ] **Step 1: Write the failing tests** in `places.test.mts`.
  - `the ticks list the nine scenes in order under their existing names`
  - `the header marks Work through the six systems and the archive`
- [ ] **Step 2: Run the tests.**
  - Run: `npm test 2>&1 | tail -20`
  - Expected: FAIL, because `places.ts` doesn't exist.
- [ ] **Step 3: Implement** the files above.
- [ ] **Step 4: Check that everything passes, in tests and in the browser.**
  - Run: `npm test`, build, then `node phase2.mjs ticks`.
  - Expected:
    - there are nine links in the nav labelled "Scenes";
    - the current tick follows each wheel step;
    - clicking Syntrueno's tick lands flush on its scene;
    - on Atlas, the header's Work link has `aria-current`.
- [ ] **Step 5: Commit.** `git commit -m "feat: add scene ticks, and keep Work current through the systems"`

### Task 7: Film drives the systems and the handoff

**Files:**
- Modify: `src/components/film/Film.tsx`

**Interfaces:**
- Consumes: `BEHAVIOURS`, `flowTargets(..., behaviour)`, `lineTargets`, `Field.setMask(rects, textRight)` and `SceneLayout.textRight`.
- Decisions:
  - **Behaviours.** Each system scene's targets use `BEHAVIOURS[name]`.
  - **Tile mode.**
    - In `build()`, a flow scene taller than the canvas (`offsetHeight > h + 1`) gets `data-tiles` and dust-only targets.
    - A scene that fits loses `data-tiles`.
    - This is recomputed on every resize.
  - **`html[data-field]`** is set once the hero's first instant show is placed, and removed in `stop()`.
  - **The handoff:**
    - `activate(null)` shows `lineTargets(count, headerBottom + 0.5, w)` as a quick morph with an empty mask, then fades the canvas and stops the loop 650 ms later.
    - Any scene activation cancels that fade.
    - If the canvas was hidden, it stays hidden.
    - A second observer on the reading part (`rootMargin: "0px 0px -12% 0px"`) calls `activate(null)` as soon as the reading part enters, so the line forms while it is still on screen. The middle band still covers keyboard and scrollbar moves.
  - **Robustness** (phase 1 follow-ups):
    - failures in the probe chain and in the engine import are caught, and the page keeps its drawing;
    - `build()` does nothing after `stop()`.

- [ ] **Step 1: Write the failing checks** in `phase2.mjs`.
  - **`handoff`:**
    1. From Think9, send one wheel notch.
       - Within 700 ms: the screenshot band at y 64–66 is lit across at least 40% of its width (decode the screenshot with ffmpeg).
       - After 1.2 s: the canvas opacity is `"0"`.
    2. Send one notch up. Expected: the opacity is `"1"`, and Think9's markers are lit again.
  - **`tiles`:** at 1280×560, AI Reel Factory has `data-tiles`, its glyphs have opacity 1, and the wheel scrolls inside it before stepping on.
- [ ] **Step 2: Run the checks.**
  - Run: build, then `handoff` and `tiles`.
  - Expected: FAIL, because the canvas just fades and there is no `data-tiles`.
- [ ] **Step 3: Implement** the decisions above.
- [ ] **Step 4: Check that everything passes.**
  - Run: `handoff` and `tiles`, then `npm run typecheck && npm run lint && npm test`.
  - Expected: all pass.
- [ ] **Step 5: Commit.** `git commit -m "feat: drive the six systems and end the film on the line"`

### Task 8: Verification, the recording and the final review

**Files:**
- Modify: none, unless a check fails. A failure gets fixed under superpowers:systematic-debugging, with a test whenever the failure is in pure code.

- [ ] **Step 1: The full suite and the budget.**
  - Run: `npm run typecheck && npm run lint && npm test && npm run build`
  - Expected:
    - all succeed;
    - the field's own chunks total 40 KB or less gzipped, three.js excluded.
- [ ] **Step 2: Every scene.**
  - Run: `scenes`, then step through all nine scenes in both themes, at 1440×900 and 1280×640.
  - Expected:
    - dots on every marker (keep the screenshots for review);
    - no console errors and no CSP violations.
- [ ] **Step 3: Deep links (Review Focus 1).** Load `/#atlas` and `/#think9-brain`.
  - Expected:
    - after 2 s, `scrollY` is the scene's top, within 2 px;
    - the header's Work link has `aria-current`;
    - the field shows that system.
- [ ] **Step 4: The sheet (Review Focus 3).** Run Task 5's check with the field running, then press Tab inside the sheet.
  - Expected: the check passes, and Tab keeps focus inside the sheet.
- [ ] **Step 5: Tall scenes (Review Focus 2).** Run Task 7's `tiles`.
  - Expected: it passes.
- [ ] **Step 6: The handoff (Review Focus 4).** Run Task 7's `handoff`, and time the frames through it.
  - Expected: it passes, with no frame over 25 ms.
- [ ] **Step 7: Reduced motion (Review Focus 5).** Take a still of each system.
  - Expected:
    - Atlas shows a packet past the check;
    - Syntrueno shows the approval and the packet;
    - AI Reel Factory shows three packets;
    - Think9 shows the grey dots and a packet turning back.
- [ ] **Step 8: No WebGL (Review Focus 5).** Run with `--disable-webgl`.
  - Expected: glyph tiles in every system scene, and no errors.
- [ ] **Step 9: Frame timing.**
  - Run: `timing`, which instruments rAF in headless Chrome on the GPU across all nine scenes and the handoff. Then do a real-wheel pass in Shaan's Chrome through the extension, with the window in front.
  - Expected: no frame over 25 ms after the first second.
- [ ] **Step 10: The recording for Shaan.**
  - Run: `record`. It captures a canvas webm (`captureStream(30)`) through the six systems in both themes, and a screen-level GIF of the sheet and the ticks.
  - Send both with SendUserFile, along with what phase 3 still holds.
- [ ] **Step 11: The final whole-branch review,** as superpowers:executing-plans requires.
  - The reviewer reads the GLSL port against morph.ts.
  - Fix what it finds, each fix RED→GREEN.

---

## Left for phase 3

- **Phones:** the 360×640 fit, the full-screen sheet, and mobile URL-bar resizes.
- **Fallback tiles** for the thesis and the lanes.
- **Reduced motion's** 200 ms scene fade.
- **Retargets:** a retarget's jump in colour, alpha and size.
- **Midpoint push:** dust bunching where the midpoint push meets the text column.
- **Tilt:** gating the pointer tilt during the load crossfade.
- **Portrait:** the grayscale portrait.
- **README.**
- **WebKit and Shaan's phone:** the snap test, `scrollend`, and the sound check still outstanding from the sound work.
