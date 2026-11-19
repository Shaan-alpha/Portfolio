# Portfolio Renovation II — "The architecture"

> **Superseded** on 2026-11-19 by [the dot field](2026-11-19-portfolio-dot-field-design.md). Shaan rejected the building as jittery.

**Date:** 2026-11-19
**Owner:** Shaan Satsangi
**Status:** Phases 1 and 2 (acts I to IV) built and deployed on 2026-11-19. Phases 3 and 4 remain. Shaan gave full creative authority; every call below is mine unless marked as his.

## Intent

Shaan wants the portfolio at the level of Awwwards sites: highly detailed 3D, a storyline you scroll through, and a camera that zooms in and out of buildings or rendered scenes. The audience is unchanged: recruiters and engineers deciding whether he builds serious AI systems. The site must now also hold its own beside award-winning studio work.

The October renovation built the site on his line "the model is a component, not the architecture". This renovation takes that line literally. **The site becomes a building.** You arrive at an architect's model of a system, the camera cuts it open, and each production project is a route walked through it. The yellow model is still one component: a single block hanging in the atrium, never a floor of its own.

## Goals, non-goals, anti-goals

- **Goals:**
  - one continuous, scroll-driven camera story from the opening shot to the contact form;
  - a building detailed enough to reward zooming in;
  - every project drawn as its real pipeline, walked through the building, using the hand-corrected flow data;
  - the content stays real HTML;
  - the site stays fast, accessible and fully usable without the 3D.
- **Non-goals:**
  - a game (no driving, no free-flying camera);
  - new copy for the projects (`src/content/projects.ts` is carried over verbatim);
  - a CMS;
  - WebXR.
- **Anti-goals (a failure even if it works):**
  - text that exists only inside the canvas;
  - motion that hijacks scrolling or breaks anchor links;
  - a loading screen that fakes progress;
  - dark-neon "sci-fi" 3D, glass cards, or fade-up on every section;
  - yellow used for anything except a model running;
  - a recreation or close copy of any well-known portfolio (no miniature-car world, no generic isometric city);
  - sound on scroll;
  - first-load JavaScript growing from what it is today.

## Constraints

- **Hosting:** a static export (`output: "export"`) served by Cloudflare Workers, with the CSP in `public/_headers`. Scripts come from `'self'` only.
- **Stack:** the current one. Next 16, React 19 and three.js 0.186, which is already lazy-loaded and rendered on demand.
- **Inherited rules:** the October spec's accessibility and performance bar still holds (AA contrast in both themes, axe clean, reduced motion respected, Save-Data and no-WebGL fallbacks). So do the identity rules in it, unless this document changes them explicitly.
- **Tools on this machine:** Blender is not installed. A Sketchfab key is available, but the house rule is that a stock model dropped in unchanged is slop.

## Approaches considered

1. **The building (chosen).** One highly detailed architectural model, rendered in real time and generated in code, with projects as routes through it.
   - It extends the existing identity instead of discarding it.
   - Generated geometry means no model files, no WebAssembly decoders and no CSP change, and the asset payload is close to zero.
   - It stays interactive: drag to turn, select a level, follow a route.
   - The risk is that "highly detailed" depends on craft in code, which is the plan's main investment.
2. **The render.** A photoreal flythrough rendered in Blender and scrubbed on scroll as AVIF frame sequences, the way product pages do it.
   - This gives the highest fidelity.
   - It needs Blender, which is not installed, and 10–30 MB of frames.
   - It has no interactivity, and every content change means re-rendering.
   - Pre-rendered stills are kept as the fallback technique only.
3. **The city.** A miniature city with one building per project and a free-flying camera.
   - This is the most spectacular in screenshots.
   - It is also the most game-like and the heaviest, and navigation competes with reading.
   - It sits closest to well-known portfolio formats, so it would read as a copy. Rejected.

## The building

The building is one system, drawn as an architect's competition model on an aluminium plinth: matte white card, aluminium and frosted acrylic, with one yellow resin block. Its levels are the five layers of the October hero, in the same order:

| Level | Layer | What is built there |
|---|---|---|
| B | Memory and state | A vault of archive racks and cabinets. Small cool-white status lights; never yellow. |
| 0 | Interfaces | Street entrances, a lobby, doors on two façades, scale figures arriving |
| 1 | Guards | A security hall with rows of checkpoint gates and an approval desk, where a person approves |
| 2 | Orchestration | A plant floor of ducts, cable trays and conveyors routing between risers, plus the stair and lift core |
| Atrium | Model | One yellow block hanging in the void between levels 1 and 2. It has no floor of its own. |

- **Detail strategy.** All geometry is generated in code and repeated with `InstancedMesh`: a structural grid of columns and beams, slab edges, façade mullions and glazing, gates, racks, ducts swept along curves, stairs and scale figures. One draw call covers each repeated part.
- **Level of detail (LOD).** Desktop gets up to about 400k triangles and 80 draw calls; phones get about 120k and 40.
- **The cut-away.** Two façades are glazed. The other two are cut away like a sectional model, so the inside reads from the default camera.
- **Look.** Soft daylight from a low sun, with long shadows and ambient occlusion. On desktop a tilt-shift pass makes the scene read as a physical scale model under a lens; it is the signature effect. In the dark theme it becomes a night studio: cool-white window light, the plinth catching it, and the yellow block glowing.

## The storyline

The page keeps its sections and anchors (`#top`, `#work`, `#about`, `#experience`, `#contact`). Each section is an act, and each act has authored camera shots that the scroll moves between. The text scrolls normally over the scene and never animates in; the camera is the motion.

| Act | Section | The camera | The text |
|---|---|---|---|
| I. Site | Hero | High and far: the whole model on its plinth. The plinth's front carries the line "The model is a component, not the architecture." Drag turns the model (the existing dial ticks keep sounding). | Name, role, the two keys, as now |
| II. Section | Hero (pinned, about 2.5 screens) | Dollies in as the cut-away opens. The levels separate slightly, annotations attach, and the camera then makes the one dramatic move: a dive through the atrium to the yellow block and back out. | Level annotations with leader lines, using the existing callout technique. Selecting a level works as the layer buttons do now. |
| III. Routes | Work: six production systems | For each project the camera follows that project's flows through the building, stop by stop: `io` at the lobby, `guard` at the gates, `step` on the plant floor, `model` at the yellow block, `human` at the approval desk. The route is drawn as a lit line; it is yellow only at the model stop. It zooms in at each stop and out to show the whole route. Systems with two flows (Atlas, VouchRank) walk two routes. | The existing case study panel, including its pipeline tiles. The sticky project index becomes the building's directory. |
| IV. Archive | Work: the seven other projects | Descends to level B: cabinets, one drawer per project | The existing archive list |
| V. Elevation | About and experience | Rises up the core. The building turns to its elevation (front-on, flat, like a drawing) and the timeline reads beside its floor lines. | About and the experience timeline, as now |
| VI. Skyline | Contact | Pulls far back: the building among quiet massing blocks at dusk, lights coming on level by level | The contact form and email |

- **Interaction.** Dragging turns the building group, not the camera, and only in acts I–II. The offset eases back to zero after act II.
- **Directory and model.** The directory lists the projects, as the sticky index does now, and selecting one scrolls to its route. Levels are selected in act II, through the annotations or the level buttons, or by picking the level on the model. A selected level shows its summary and the projects that use it, from `src/content/stack.ts` as the caption does now.
- **Scroll.** Native scroll throughout, with no smooth-scroll library. Camera tweens catch up through ScrollTrigger's `scrub` lag.
- **Scroll length.** About 14 to 18 screens on desktop in total. Act II is pinned for about 2.5 screens. Each route gets about 1.5 screens, so its stops are not rushed.
- **Phasing the canvas.** The scene is fixed behind only the acts that are already renovated. Until a section is renovated, the canvas ends before it and that section looks as it does today.

## Look and type

- **Palette.** The UI keeps its tokens: ground `#eceef1`, ink `#111318`, graphite dark `#131518`, model `#ffc61a`. The scene adds:
  - studio void `#e6e8eb`;
  - maquette white `#f8f9fa`;
  - aluminium `#a7aeb6`;
  - night window light `#dbe7ff`.
- **Yellow.** It is the only warm colour anywhere in the world.
- **Type.** Archivo only:
  - expanded (wdth 125) for display, including the plinth engraving;
  - normal width for reading;
  - semi-condensed (wdth 80) for drawing annotations.
  - Sentence case everywhere, with no all-caps labels and no "WORD — fragment" annotations. A level is written "Guards, level 1".
- **Layout.** A 12-column grid, left-aligned. Text panels sit on solid ground (never glass), so contrast never depends on what is behind them. The building occupies the other side of the frame. On phones, the scene stays fixed behind, panels are full-width solid sheets with gaps where the scene shows, and the shots have portrait variants.

```
Act I, desktop
┌────────────────────────────────────────────────────────────────┐
│ Shaan Satsangi          Work  About  Experience  Contact  🔊 ☾ │
│                                        ┌──┬──┬──┐               │
│  Shaan                               ┌─┤▓▓│  │  ├─┐  the model  │
│  Satsangi                            │ ├──┼──┼──┤ │  on its     │
│                                      │ │  │■ │  │ │  plinth     │
│  AI systems engineer in Jaipur       │ └──┴──┴──┘ │             │
│  [See the work]  [Email me]        ══════════════════            │
│                                     The model is a component…   │
└────────────────────────────────────────────────────────────────┘

Act III, one route (desktop)
┌──────────────────────┬─────────────────────────────────────────┐
│ Directory            │   lobby ●───────────┐                   │
│ ▸ Skill Issue        │                     │ gates ●            │
│   Atlas              │   ■ model ●─────────┘    (yellow stop)   │
│   …                  │   plant ●──● reply                       │
│ Case study panel     │      camera follows the lit route        │
└──────────────────────┴─────────────────────────────────────────┘
```

**Review against generated defaults.** I first sketched the opening with the name behind the building, a common Awwwards trope. I replaced it with the name in HTML on the left and the brand line engraved on the plinth, which is what a real competition model carries. Dark neon, glass cards and an isometric city were each considered and ruled out above.

## Motion and tools

- **GSAP 3.15** (free standard licence).
  - ScrollTrigger drives one timeline per act with `scrub` and pins act II.
  - CustomEase supplies the camera easing.
  - GSAP loads with the 3D chunk, not the first load. The page reads fully without it.
- **three.js 0.186**, staying on WebGLRenderer, with post-processing from `three/addons`: GTAO, a custom tilt-shift pass and OutputPass. WebGPU is not needed for this look and can come later.
- **Shots.** Authored in code as named shots `{ position, target, fov }`, with portrait variants, fitted to the building's bounding sphere per aspect ratio. Theatre.js has no recent releases, and Blender camera paths would need Blender, so neither is used.
- **Assets.** None at runtime beyond small generated canvas textures (the plinth engraving, the level labels). Sketchfab props and Blender renders stay optional for later; adding glTF files would need `'wasm-unsafe-eval'` and `worker-src 'self' blob:` in the CSP for their decoders.
- **Rendering.** On demand, as now: the loop runs while the scroll or a drag is moving, then stops. A frame-time monitor drops post-processing, then LOD, if the frame average stays above 22 ms.

## Fallbacks and accessibility

- **The 3D is decorative.** The canvas is `aria-hidden`, and every word of content stays in semantic HTML in reading order.
- **Reduced motion:** no camera flights. Each act, and in act III each project, holds one composed shot and changes between shots with a short crossfade. The scene stays.
- **No WebGL, Save-Data, or JS off:** each act shows a still of its main shot.
  - The stills are rendered from the real scene by a script and committed, as AVIF with a WebP fallback, under `public/stills/`.
  - There are twelve: six acts, each in both themes, framed for desktop and cropped with `object-fit: cover` on phones.
  - Projects get no stills of their own. In the fallback, each case study's pipeline tiles carry its route.
  - This replaces the October SVG drawing, which cannot represent the building.
- **Keyboard:** the directory and level buttons are the way in, and focus stays visible. Escape clears a selection, as now.
- **Sound:** the existing cues stay. Scrolling, including the camera story, makes no sound.

## Performance budget

- **First-load JS:** no larger than today (about 211 KB gzipped). GSAP and the scene code join the lazy 3D chunk.
- **3D chunk:** about 230 KB gzipped (three about 140, GSAP about 45, scene about 45), loaded after first paint. It is not loaded under Save-Data or without WebGL.
- **Frame rate:** 60 fps on a 2020 integrated-GPU laptop at a device pixel ratio of 2 or less, and 30 fps or better on a mid-range 2022 Android phone (pixel ratio capped at 1.5, no post-processing).
- **Largest contentful paint** stays the HTML name, not the canvas.

## Phases

Each phase ships on its own; the parts of the site not yet renovated stay as they are.

1. **Engine and acts I–II.** The building with all five levels, the shot system and ScrollTrigger, drag, and the level selection. This replaces the stack hero. It also includes the stills script and the fallbacks.
2. **Routes and archive.** Route generation from `flows`, the directory and the per-stop shots.
3. **Elevation and skyline.** The about and contact acts, the dusk lighting, the night theme and the tilt-shift pass.
4. **Polish.** LOD and phone tuning, the performance monitor, the OG card from a still, and an Awwwards submission pass: a preview video, credits, and lighthouse and axe checks.

## Verification

- **Unit tests** (`node:test`, like the Worker and the detents) cover the pure parts:
  - mapping a project's `flows` to route stops, with every step kind placed on its level and the yellow stop only at `model`;
  - fitting a shot to any aspect ratio;
  - the LOD and degrade thresholds.
- **In the browser,** under the production `_headers`, every act gets a screenshot in both themes, at 1440×900 and at 390×844, reviewed against this document. Checks:
  - anchors and the directory land on the right act;
  - reduced motion, no-WebGL and Save-Data show the stills;
  - axe is clean in both themes;
  - there are no CSP violations or console warnings;
  - first-load JS stays at or under today's figure, and the 3D chunk stays within budget;
  - frame times are sampled on desktop and in phone emulation.
- **Code review:** one fresh reviewer per phase, at the end.

## Calls I made (check these)

1. The concept: the literal architecture, an extension of the October identity rather than its replacement. Yellow still means only a model running.
2. Geometry generated in code instead of Blender or Sketchfab, for detail you can zoom into, a near-zero payload and no CSP change.
3. Vanilla three.js with GSAP, not React Three Fiber, because the codebase is vanilla and on-demand rendering is already built.
4. Native scroll, with no smooth-scroll library and no scroll hijacking.
5. Daylight white model by day, night studio by dark theme, and tilt-shift as the one signature effect.
6. Text never animates in; the camera carries the motion. This revises the October "quiet everywhere else" rule: it is quiet for the UI, cinematic for the scene.
7. Stills replace the October SVG drawing as the fallback.
8. The content and the existing sound cues are unchanged.

## Left to the builder

- Exact building dimensions and grid spacing, instance counts per LOD, shot values, shader details, and the furniture of each level.
- The tooling for the stills script.
- The drawer layout in the archive.
