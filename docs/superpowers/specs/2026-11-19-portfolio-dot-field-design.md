# Portfolio Renovation III: the dot field

Status: design for approval. It supersedes [Renovation II, "The architecture"](2026-11-19-portfolio-building-renovation-design.md), which Shaan rejected on 2026-11-19.

## Intent

Shaan rejected the building hero because it felt jittery, and pointed to [insert.gr](https://insert.gr/) as what he meant by Awwwards-level. What works there is one smooth, story-led scroll: each scroll gesture moves one full screen, and a single field of dots re-forms into the next scene.

This renovation rebuilds the top of the portfolio as that kind of film. Its subject is Shaan's own: the systems he has built, and the rule his identity already rests on, that yellow marks where a model runs. In the field, grey dots are the system and yellow dots are the model. Every scene therefore says "the model is a component, not the architecture" without needing a caption.

**Why it matters:** recruiters and engineers read this site. It must feel crafted, and for Shaan the feel of the motion is the product. It must also let a reader get the facts about each system quickly.

## What the reference does

These figures were measured on 2026-11-19 by recording insert.gr's canvas at 30 fps while scrolling with wheel steps. The recordings are `~/Downloads/insert_gr_canvas.webm` and `~/Downloads/insert_gr_motion_study.png`.

- **Scrolling.**
  - It uses no smooth-scroll library. `html { scroll-snap-type: y mandatory }` runs over five 100vh sections, with `scroll-snap-stop: always`.
  - A small script on `body` also cancels each wheel event and turns each wheel gesture into a smooth scroll to the next section. So each gesture moves exactly one screen in about 520 ms, even a 2,500 px fling. Touch and keyboard rely on CSS snap alone.
  - The scene changes about 190 ms into that movement.
  - CSS snap alone doesn't produce this, as a test in Chrome showed: a single 100 px wheel step snaps back to where it started, and only a long fling advances.
- **Morphs.**
  - The dots never follow the scroll position. A section change only sets a new target, and the dots get there on their own clock.
  - A new shape takes about 1.5 s; turning the same shape takes about 0.3 s.
  - Each morph starts fast and settles slowly, and is staggered so the shape draws itself.
  - The dots loosen into a wider field before they gather.
- **Ambient motion.** Between gestures, something always moves a little: a pulse, a slow turn, a beat.
- **Cost.** One canvas and one cloud of points, with no lighting and no post-processing.

The building failed on the opposite choices: its camera was scrubbed to the scroll position, and two heavy scenes competed for frames.

**Taken from the reference:** native snap with one scene per wheel gesture, morphs that scenes trigger and that run on a clock, dissolve-then-form transitions, ambient motion, and a single light canvas.

**Not taken:**
- their shapes (the dot, the head, the bulb, the heartbeat, the wordmark);
- their copy;
- navy and periwinkle;
- the "01 / 05" counter;
- blurred captions;
- one accented word per heading;
- the night/day and "watch" controls.

## Goals, non-goals, anti-goals

**Goals**
- **Smooth before anything else.** No frame of the field depends on the scroll position, so a mouse-wheel notch on Windows can never make it jump.
- **A story in nine scenes:** who Shaan is, how he builds, the six systems as a set, then each system in turn.
- **Real flows.** Each system's flow from `src/content/projects.ts` is drawn in dots, and its guard visibly does its job.
- **Every fact stays in HTML.** A reader who ignores the motion still gets everything.
- **It works everywhere:** both themes, phones through wide screens, reduced motion, without WebGL and without JavaScript.

**Non-goals**
- New project copy, or rewording any existing copy.
- Changes to the content of About, Experience or Contact.
- New sounds. Existing cues are reused.
- A smooth-scroll library, scroll-driven animation, or pinned sections. The only scroll handling is the reference's: inside the film, one wheel gesture moves one scene.

**Anti-goals** (each is a failure even if everything else works)
- Anything that stutters under a real mouse wheel.
- Anything that reads as a copy of INSERT (see "Not taken" above).
- The stock generated looks listed in the October spec: terminal costume, glass cards, neon on black, identical card grids, accenting one word per heading, fade-up on every section, all-caps labels, middle-dot meta strings.
- Dots moving behind text so that it becomes hard to read.
- A fact that only the animation shows.

## Constraints

- **Hosting:** a static export (`output: "export"`) on Cloudflare Workers, with the strict CSP in `public/_headers`. Scripts come from `'self'` only, with no WebAssembly and no blob workers. Custom shaders and dynamic imports are fine.
- **Stack:** Next 16, React 19 and three.js 0.186.1, which is lazy-loaded. GSAP is used only by the building and is removed with it.
- **Identity:** Archivo and the existing tokens in `src/app/globals.css`. Yellow (`--model`) means "an AI model runs here" and nothing else.
- **Copy:** carry it over verbatim from `projects.ts`, `profile.ts`, `Hero.tsx` and `Work.tsx`. The brand line "The model is a component, not the architecture." is already in the OG card. Any new string must be listed in this document.
- **Tests:** `node:test` with type stripping (`*.test.mts`), plus the headless-Chrome-over-CDP tooling used for the last two renovations.
- **Inherited bar:** AA contrast in both themes, axe clean, reduced motion respected, and Save-Data and no-WebGL fallbacks.

## Approaches considered

- **A. Story first, then reading (chosen by Shaan).** The hero, the thesis, the overview and the six systems are full-screen snap scenes. Each system's full case study opens in place. After the last system, the reader moves into the archive, About, Experience and Contact, which scroll normally.
  - It puts the insert.gr rhythm where first impressions form, and keeps every fact readable on one page.
- **B. Scenes all the way down.** About and Contact become scenes too, and each case study gets its own page.
  - This is the purest version, but more content sits behind clicks and there are nine more pages to design.
- **C. No snap.** Keep today's long page and re-form the field as each section arrives.
  - This is the lowest risk, but it loses the one-gesture-one-scene rhythm that makes the reference feel designed.

## The page

```
Header (unchanged)
┌ the film: nine full-screen scenes, snapped ───────────────────────┐
│ 1 Hero               the stack                                    │
│ 2 Thesis             the stack becomes one system                 │
│ 3 Selected work      six lanes, one per system  (id="work")       │
│ 4–9 The six systems  each one's real flow       (ids unchanged)   │
└───────────────────────────────────────────────────────────────────┘
┌ the reading: one long section, free scroll inside it ─────────────┐
│ Also shipped (the lab projects, as today), About, Experience,     │
│ Contact, Footer                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Scrolling

- **The scenes.** Each scene is a full-bleed `100svh` section with `scroll-snap-align: start` and `scroll-snap-stop: always`, so every scene is seen once. The header overlays the scenes.
- **The reading part.** It is one snap area, taller than the screen. Per the CSS Scroll Snap spec, any position inside a snap area that covers the viewport is valid, so the reader scrolls freely inside it.
  - A gesture down from the last system lands exactly at the start of the reading part.
  - A gesture up from the top of the reading part lands on the last system.
- **Snap and the header padding.** Snap uses `scroll-padding-top: 0`. The header offset that anchors need today moves to `scroll-margin-top` on the reading part's sections.
- **One scene per wheel gesture**, as in the reference.
  - **Inside the film:** a wheel handler on `window` (non-passive) cancels the browser's own scroll and calls `scrollTo({ behavior: "smooth" })` to the next or previous stop. The stops are the nine scene tops and the top of the reading part.
  - **What counts as a gesture:** a wheel event that comes more than 180 ms after the previous one starts a new gesture. The events that follow, such as the rest of a fast spin or a trackpad's inertia, are swallowed until the movement ends (`scrollend`).
  - **A swipe during momentum:** a touchpad keeps sending ever smaller events for a second or more after the fingers lift, never pausing for 180 ms, so a swipe made during it would be swallowed, and its own momentum would swallow the next. Once the movement has ended, a new swipe shows as a jump in speed instead.
    - **Speed** is the scroll of the last 40 ms, each event's spread over the time since the one before. The display's frame rate, its beat against the touchpad's own rate, and the events Chrome merges while the page is busy then change how the scroll is cut into events, never how fast it is.
    - **The jump:** the gesture peaked and then slowed to a quarter of that peak or less, and the speed is now four times what it slowed to, and at least 2.3 px/ms. "What it slowed to" is measured 80 to 120 ms back, and the peak before that, so a new swipe's own first moments never count as either.
    - **Measured** on Shaan's Windows precision touchpad on 2026-11-23 (`wheel.fixtures.ts`): fingers resting on the pad drift at up to 2 px/ms; a swipe runs at 2.7 px/ms or more.
    - **Unchanged:** a mouse wheel does not slow down while it rolls, so a roll stays one gesture, and a swipe made while the film is still moving is swallowed, as before.
  - **Inside the reading part:** the handler stands aside. The only exception is a wheel-up at the reading part's very top, which steps back to the last system.
  - **Left alone:** Ctrl+wheel (zoom), horizontal wheels, and anything inside the case-study sheet.
  - **Other input:** touch, keyboard and the scrollbar use native snap.
  - **Prototype result:** this was tested in Shaan's Chrome on 2026-11-19, with a throwaway page of nine 100svh scenes and a long reading part.
    - One step, two steps and a 10-step fling each moved exactly one scene.
    - From the last scene, one step landed at the start of the reading part.
    - Inside the reading part, the wheel scrolled natively.
    - One step up from the reading part's top returned to the last scene.
    - Page Down moved one scene, and anchors landed within 3 px.
- **Turning snap on.**
  - Snap and the wheel handler are applied only by JavaScript (`html[data-snap]`), and only after a small hidden test has passed. The test builds an offscreen snap container with a short child and a tall child, scrolls inside the tall one, and checks that the browser leaves the position alone. Chrome passes it.
  - If the browser fails the test, or JavaScript doesn't run, there is no snap and no wheel handling anywhere. This is the no-snap mode.
- **The no-snap mode.**
  - The same nine sections and the case-study sheet stay, but scenes are no longer guaranteed to rest at the top of the screen.
  - Nothing can keep dots on their HTML labels without following the scroll position, which Goal 1 rules out. So every flow, including the thesis line and the six lanes, shows as `Pipeline` tiles.
  - The field draws only what needs no alignment: the hero stack and the dust.
  - Chrome passes the test. Safari 15 or later is expected to pass; Phase 3 checks this on WebKit and on Shaan's phone.
- **In-page links.** The header links, "See the work" and any `#id` URL land exactly on their target, with and without snap.
- **When a scene becomes active.** A scene is active when it crosses the middle of the viewport, using the band that `useActiveSection` uses. The morph therefore starts while the snap is still moving, as it does in the reference.

### The field

- **One canvas.**
  - It is a fixed, full-viewport canvas behind the film, with `pointer-events: none` and `aria-hidden`.
  - It holds one three.js `Points` object with a custom `ShaderMaterial`, drawn in one draw call.
  - It fades out once the reading part fills the screen.
  - Its loop runs only while the film is on screen and the tab is visible.
- **Budget.** About 16k dots on desktop, 12k on tablets, 8k on phones, and 6k where `deviceMemory` is 4 or less. The builder may tune these by ±30% after measuring.
- **Motion is a function of time.**
  - Every position is computed in the vertex shader from per-dot attributes (source, target, delay, seed, flow data) and a few uniforms (time, morph start, pointer).
  - On the CPU, each frame only sets uniforms.
  - When a scene changes, the CPU works out where every dot is at that moment, using the same formula as the shader, so the handoff never jumps. That position becomes the new source. A new scene that arrives mid-morph therefore retargets smoothly and never queues.
- **The morph.**
  - **Timing:** a new shape takes 1.4 s; moving the same shape takes 0.5 s. The ease is `cubic-bezier(0.16, 1, 0.3, 1)`.
  - **Stagger:** within a 0.45 s window, set by where the dot's target sits along its flow, so each system assembles from input to output, the way its data moves.
  - **Path:** each dot arcs through a scattered midpoint, so a morph reads as dissolving, then forming.
- **Every dot always has a target.** Dots that a scene doesn't use become dust, a faint field at low alpha that gives depth. No dot ever appears or disappears.
- **Ambient motion.**
  - Each dot drifts slightly, by 1.5 px or less, from its own seed.
  - Dots stream along each connection between two steps.
  - The hero stack turns slowly.
- **Pointer.** On devices with a fine pointer, dots within about 100 px of the pointer ease away by up to 14 px and spring back. There is no pointer effect on touch.
- **The HTML lays out; the dots follow.**
  - Every flow step is a real HTML element (`Pipeline`'s markup, as today), and the dots gather on each step's marker.
  - Positions are read relative to the scene once after load, then cached and recomputed on resize, never in the frame loop.
  - Text stays HTML: crisp, selectable, translatable, and read by screen readers.
- **Keeping text readable.** The text column is a mask for the shader. On wide screens that is the left five columns; on phones it is the text block. No shape is placed there, no morph path crosses it, and dust inside it fades to about 15%.
- **Colours.**
  - Colours are read from the CSS tokens at runtime, so both themes are covered, and they ease over about 0.4 s when the theme changes.
  - **Dark:** dots in `--ink-2` and `--ink` on `--ground`, with additive blending so that dense clusters glow.
  - **Light:** dots in `--ink-3` and `--ink`, with normal blending.
  - **Yellow** dots use `--model`. In the light theme they get a `--model-edge` rim, so they still read as yellow on `#eceef1`.

### Shapes of the steps

Each step's shape comes from its `StepKind`:

| Kind | Shape in dots |
|---|---|
| `io` | an open ring |
| `step` | a dense disc |
| `model` | a yellow cube, the same cube as the stack's |
| `guard` | a gate: two posts the stream has to pass between |
| `human` | a ring around one bright dot |

### The scenes

All text below already exists. Its source is named in each scene.

1. **Hero: the stack.**
   - **The dots:** the October stack rebuilt in dots, with four plates and, in slot 3, the yellow cube, using the geometry in `src/components/stack/geometry.ts` so it still matches the OG card. It turns slowly, and the pointer tilts it by up to 8°.
   - **Layer labels:** on wide screens, the layer names from `src/content/stack.ts` (Interfaces, Guards, Orchestration, Model, Memory and state) sit beside the stack as plain HTML, one per slot. Turning the stack doesn't change a slot's height, so the labels never need to follow the 3D. The Model label gets the yellow marker.
   - **Text** (`Hero.tsx`, `profile.ts`): the name; "AI systems engineer in Jaipur, India"; the "See the work" and "Email me" buttons; and "Creator of Skill Issue. Six of my systems are running in production."
2. **Thesis: the stack becomes a system.**
   - **The dots:** the plates slide apart and line up into one flow running top to bottom, input → scoring → model → check → approval → output, and dots begin to stream down through it.
   - **Text:** the brand line "The model is a component, not the architecture." (OG card). Under it, the lead sentence from `Hero.tsx`, "I build agents and retrieval systems with the guardrails designed in: deterministic scoring, checks that fail closed, and a human approval wherever a mistake would be expensive."
   - **The three phrases:**
     - When the scene first arrives, they light their parts of the flow in turn: scoring as a rigid grid, checks as a gate, approval as a ring.
     - Hovering over or focusing on a phrase lights its part again.
     - This is the page's one orchestrated moment.
3. **Selected work: six lanes.**
   - **The dots:** the single flow splits into six vertical lanes side by side, one per system. Each lane is a miniature of that system's flow, with yellow exactly where its models are, so the overview shows at a glance where each system's model sits.
   - **Text** (`Work.tsx`): the "Selected work" heading, its lead line, the legend (`PipelineLegend`), and the six names as links to their scenes.
   - This scene takes the `work` id, so the header's Work link and "See the work" land here.
4. **The six systems**, scenes 4 to 9, in `projects.ts` order: Skill Issue, Atlas, Syntrueno, AI Reel Factory, VouchRank, Think9 Brain.
   - **Text:** each scene shows the name, the status and date (as `ProjectCase` shows them), the kicker, `desc`, and the flow with each step's label and note. Below these come a "Read the case study" button and the live and source buttons.
   - **The dots** form every step and stream between steps. A system with two flows (Atlas and VouchRank) draws them as two rails side by side. Each system's guard visibly does what its own text says:
     - **Skill Issue:** the Score step is a rigid 10×10 grid that never drifts. The yellow Narrate step beside it moves freely but never enters the grid. ("The score is computed; the model only narrates it.")
     - **Atlas:** the message flow streams steadily. In the briefing flow, the stream stops at the salience check most of the time, and only now and then does one packet reach Briefing. ("Returns send: false when nothing matters".)
     - **Syntrueno:** the stream passes five posts and then waits at the human gate. At intervals one bright dot arrives, and exactly one packet goes on to Execute and verify. That step pulses until it settles. ("Single-use SHA-256 approval", "Until live state converges".)
     - **AI Reel Factory:** Research and pitch sends out a spread of packets, and at Approve no more than three continue. The stream passes only through the fact-check gate, never around it. ("Up to 3 ideas a run", "Cannot switch itself off".)
     - **VouchRank:** the audit runs inside a bounded box, the agency workspace. The review flow passes every packet through consent, with nothing filtered out. ("Row-level security", "no review gating".)
     - **Think9 Brain:** at Retrieve, part of the stream greys out and is held back. At Answer or refuse, some packets turn back instead of becoming an answer. ("Superseded documents withheld", "Refusal recall 1.000".)
   - These behaviours are quiet and loop over 2–4 s. They never carry anything the text doesn't also say.

### The case study

"Read the case study" opens a sheet over the scene. It holds the rest of `ProjectCase`: the bullets, the tags with their logos, and the live and source links.
- It is a modal `<dialog>`. Escape and the close button both close it, and focus returns to the button that opened it.
- The page behind it doesn't scroll while it is open.
- It is full-screen on phones.
- It opens and closes with the sound cues the menu already uses.

### Scene ticks

Nine short ticks sit on the right edge as a `nav` labelled "Scenes". The current tick is longer and drawn in ink. Hovering over or focusing on a tick shows the scene's name, and clicking it jumps there.

The names are existing strings:
- "Shaan Satsangi"
- "The model is a component, not the architecture."
- "Selected work"
- the six system names

The ticks are hidden below `md`. They are not the reference's numeric counter: they are a list of real places in the page, and you can use them to navigate.

### The reading part

- "Also shipped" moves out of `Work.tsx` into its own section at the top of the reading part, with its markup unchanged.
- About, Experience, Contact and the footer stay as they are.
- `WorkIndex` (the building's directory) and the building's route stage are removed.

## Look and type

- **Palette and type.**
  - The existing tokens and Archivo, unchanged.
  - The name stays in `t-display`, and the system names use `t-h2`.
  - Sentence case everywhere.
- **No text entrance animation.** Text is simply there and moves with native scroll. The dots are the only motion, so the page's boldness is spent in one place.
- **Flows run top to bottom at every size,** like the stack they come from. This is `Pipeline`'s existing vertical rail, with each note beside its step, so `Pipeline` needs no rework. A system with two flows puts them side by side.
- **Layout on wide screens.** Text (name, status and date, kicker, `desc`, buttons) sits in the left five columns of the 12-column grid. The flows and the field's shapes fill the right seven.
- **Layout on phones.**
  - Text sits at the top and the flow below it.
  - A system's `desc` and step notes move into the sheet.
- **Fit.**
  - Every scene fits one screen at 1280×640 (a 1366×768 laptop, once the browser's toolbars are taken off) and at 360×640.
  - At 1280×640 the longest scene is AI Reel Factory: seven steps at about 60 px each, about 420 px beside its text.
  - A scene that doesn't fit at the visitor's size (large text settings, a very small window) shows its flow as HTML tiles instead of dots, and can then be scrolled within.
    - The field steps back there. With no flow to draw, all of its dots would be dust, crowding into the margins around the copy (a phone held sideways, 2026-11-23).

```
System scene, desktop (Atlas): text left, flows right       System scene, phone
┌──────────────────────────────────────────────────────────┐  ┌──────────────────────┐
│ header                                                 ╷ │  │ header               │
│ Atlas                    A message      A morning      ╷ │  │ Atlas                │
│ Live │ Aug 2026                         briefing       ━ │  │ AI financial analyst │
│ AI financial analyst     ◯ Telegram     ◯ Watchlist    ╷ │  │ on Telegram          │
│ on Telegram              ∙   chat       ∙              ╷ │  │ ◯  Telegram chat     │
│                          ▣ Gemini loop  ┃┃ Salience    ╷ │  │ ▣  Gemini loop       │
│ An AI financial analyst  ∙              ∙   check      ╷ │  │ ┃┃ User-scoped tools │
│ that lives in Telegram:  ┃┃ User-scoped ∙              ╷ │  │ ●  Market data       │
│ conversation only, …     ∙   tools      ◯ Briefing     ╷ │  │ ◯  Reply             │
│                          ● Market data                   │  │ ◯  Watchlist         │
│ [Read the case study]    ∙                               │  │ ┃┃ Salience check    │
│ [Open t.me/…] [Source]   ◯ Reply                         │  │ ◯  Briefing          │
│ (left five columns)      (right seven: each note sits    │  │ [Read the case study]│
│                           beside its step)               │  └──────────────────────┘
└──────────────────────────────────────────────────────────┘
```

## The look-and-feel pass

A senior review of what the film touches and of the parts that stay. Shaan asked for this on approval: "act like a senior fullstack eng and ui-ux developer to better the website look good".

1. **Seamless load** (phase 1).
   - The hero's first paint is the existing SVG stack drawing.
   - When the field is ready, the dots appear exactly on the drawing's plates. This works because the hero uses the same orthographic camera maths as `stack/geometry.ts`, as the October build did.
   - Then the drawing fades, and only after that does the stack start to turn. There is no pop and no empty frame.
2. **The header over the film** (phase 1).
   - The header becomes an overlay (`position: fixed`), so every scene is truly full-screen. Scenes pad their content below it.
   - Its hairline appears only in the reading part.
   - The header's band is part of the text mask.
3. **The archive as an index** (phase 1, because the building's sticky column goes now).
   - It runs full width on the 12-column grid, with one hairline per row:
     - columns 1–3: the name, kicker, status and date;
     - columns 4–10: `desc` and the tags;
     - columns 11–12: the links, right-aligned.
   - Copy and order are unchanged.
4. **The handoff** (phase 2).
   - Leaving the last system, the dots settle into a single hairline exactly on the reading part's top border, and then the canvas fades.
   - The film ends on the line the reading starts from.
5. **The portrait joins the palette** (phase 3).
   - It is grayscale in both themes, so yellow stays the only warm colour on the page.
   - In light, `mix-blend-mode: multiply` lets the white studio backdrop take on the page's ground, so the photo sits like a print.
   - In dark, it is toned down (brightness about 0.8, slightly more contrast) inside a hairline frame, so it stops being the brightest box on the page.
   - A portrait on a plain mid-grey or dark backdrop would be better still; if Shaan has one, it swaps in.
6. **Considered and dropped.**
   - Depth dots for the toolkit: a résumé-template cliché. The words core, strong and working stay.
   - Forcing dark mode for the film: the site keeps following the system theme.

## Fallbacks and accessibility

- **No WebGL, Save-Data, or a lost context.** The scenes and snap still work.
  - The hero shows the existing SVG stack drawing (`src/components/stack/drawing.ts`).
  - Every flow shows today's `Pipeline` tiles.
- **Reduced motion.**
  - Dots appear already in their final shapes, and a scene change is a 200 ms fade.
  - There is no drift, streaming, rotation or pointer effect.
  - Each behaviour is shown as a still frame: for example, the gate with its sparse outgoing stream frozen.
- **No JavaScript.** All the text renders as plain sections, with no snap and with the tiles visible.
- **Keyboard.**
  - Tab order follows the scenes.
  - Page Down, Space and the arrow keys move between scenes through native snap.
  - Every control has a visible focus ring.
- **Screen readers.** The canvas is hidden from them. Flows stay ordered lists with their existing labels, and the ticks are a labelled `nav`.

## Performance budget

- **Frame time.** 60 fps on Shaan's laptop with a real wheel. In a CDP trace at 1440×900, no frame during a scene change may exceed 25 ms.
- **CPU per frame.** Under 2 ms, with one draw call and no layout reads in the frame loop.
- **Download size.** The field's own code is at most 40 KB gzipped, three.js excluded. three.js loads after first paint, so the hero text, which is server-rendered, sets the LCP.

## What is removed

- **The building:** `src/components/building/` and its tests, `WorkIndex.tsx`, `scripts/render-stills.mjs`, `public/stills/` and the `stills` script.
- **Its CSS:** the building's still-mode CSS, and the tokens only it used. Check `--card`, `--alu`, `--acrylic`, `--glow` and `--route` before deleting them.
- **GSAP.**
- **Kept:** `src/components/stack/`, which the OG card and the hero fallback use.
- **The old spec:** Renovation II gets a one-line "superseded" note at its top.

## Phases

Each phase ends with a screen recording for Shaan, made with the same in-page canvas capture used on insert.gr. Nothing goes live until he has seen it and says so.

1. **The film and the field.**
   - The snap test and snap behaviour, the scene sections, the engine, and scenes 1 to 3.
   - The seamless load, the overlay header and the archive as an index.
   - The building, GSAP and their CSS removed.
2. **The six systems.** The step shapes, streaming, each system's behaviour, the case-study sheet, the scene ticks and the hairline handoff.
3. **Polish.** Phones, both themes, every fallback, reduced motion, the portrait, a performance pass, the README, then deploy.

## Verification

- **Unit tests** (`node:test`):
  - Scene targets: the count matches the budget, every point is inside the frame, and only model steps are yellow.
  - The morph handoff: the CPU formula and the shader formula agree, so retargeting never moves a dot.
  - Flow layout from `projects.ts`: every step present, in order.
  - Snap-test decisions.
  - The wheel rule, as a pure function of the event, its timestamp and the scroll position: a new gesture versus its tail, the boundary of the reading part, and the inputs it leaves alone.
- **Headless Chrome:** each scene renders in both themes at 1440×900 and 390×844, with no console errors and no CSP violations.
- **Smoothness:** capture the canvas while scrolling with real wheel input through the Chrome extension, and check the frame timing. Shaan then tries it with his own mouse before deploy.
- **Accessibility:** axe clean, a keyboard walk, reduced motion, and no WebGL.
- **WebKit:**
  - Run the snap test page on Playwright's WebKit build. Ask Shaan before downloading it.
  - Shaan checks the site on his phone, together with the sound check still outstanding from the sound work.
  - If Safari fails the snap test, iPhones get the no-snap mode, and Shaan hears that before deploy.

## Calls I made (check these)

1. There are nine scenes. The "Selected work" overview, with six lanes, doubles as a table of contents.
2. The hero shape is the October stack, so the hero and the OG card still match. Its layer names come back as quiet labels.
3. Each system's guard visibly does its job, always taken from that system's own text.
4. Text doesn't animate in; only the dots move.
5. Snap is native CSS plus the reference's wheel rule, one gesture for one scene, both applied only after a hidden browser test passes. Without it, nothing snaps.
6. Case studies open in a sheet rather than on separate pages.
7. On phones, `desc` and the step notes move into the sheet.
8. Flows run top to bottom in the right seven columns at every size, which keeps `Pipeline`'s vertical rail and fits a 1366×768 laptop. The reviewer found that the first draft contradicted itself here.
9. In the no-snap mode, flows are HTML tiles and the field keeps only the stack and the dust, because dots can't stay on their labels there without following the scroll position.
10. GSAP is removed.
11. Each phase gets a recording, and nothing goes live without Shaan's yes.
12. The look-and-feel pass: the seamless load, the overlay header, the archive as an index, the hairline handoff and the grayscale portrait. Toolkit depth dots were dropped.

## Left to the builder

- Exact dot counts, sizes, alphas and timings, within the ranges above.
- The shader's structure, and how dots are matched between scenes.
- The sheet's and the ticks' styling, within the existing tokens.
- How the tests are organised.
