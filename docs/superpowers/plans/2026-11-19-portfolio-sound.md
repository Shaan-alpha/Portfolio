# Portfolio Sound Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Interface sound on the portfolio with uisfx. Keys click when pressed, results play their own cue, the 3D model ticks like a detented dial, and a header toggle mutes it.

**Architecture:** One client module (`src/lib/sound.ts`) owns the mute preference, a self-created `AudioContext` that is unlocked inside a trusted interaction, and a lazily imported uisfx player. Components call `play(cue)`, which is a no-op until audio is unlocked. Keys are wired by one delegated listener, so server components stay untouched. The scene reports detents through a new `onDetent` option.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript, uisfx 0.4.0 (Web Audio synthesis), lucide-react, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-19-portfolio-sound-design.md`

## Global Constraints

- uisfx is pinned exactly at `0.4.0`, with no caret. Its lockfile integrity must equal `sha512-W891N75C09cvpaNeChP+7BiP0Yp5VSbrIcRgZvzpFUT3o/2DxZqROmUcX50oxeyMnY4Hqxu4jEfjndVUpmheEQ==`, the tarball that was scanned.
- The pack is `studio`, the master volume is `0.6`, and every cue keeps uisfx's own default gain unless a task says otherwise.
- Sound is on unless `localStorage.sound === "off"`. Every storage access is wrapped in try/catch.
- Never create an `AudioContext` outside a trusted activation event: no sound and no autoplay console warning on load.
- uisfx must never appear in first-load JS. It is only ever loaded through `import("uisfx")`.
- No CSP change: `public/_headers` stays as it is.
- Make no visual change beyond the toggle. The toggle reuses the theme toggle's exact classes.
- `src/content/*` copy is not touched.
- No commits or pushes until Shaan asks. Pushing `main` deploys production. Commit messages never carry a `Co-Authored-By` trailer.

## Review Focus

1. **Touch screens:** the first tap only unlocks audio (it is silent), and every later tap on a key clicks. On iOS the visitor's music keeps playing. Task 5 has a check for this.
2. **Blocked storage** (private mode, disabled site data): sound stays on, and the toggle still works for the session. Task 5 has a check for this.
3. **Keyboard:** Enter or Space on a key clicks exactly once. A button's synthesized `click` must not add a second sound. Task 5 has a check for this.
4. **Rapid input:** double-clicks and a hard fling of the model never stack sounds into a buzz. Task 5 has a check for this.
5. **Muted returning visitor:** after a reload they download no uisfx chunk and hear nothing until they unmute. Task 5 has a check for this.

---

### Task 1: Install uisfx and the detent counter

**Files:**
- Modify: `package.json`, `package-lock.json` (dependency and test script)
- Modify: `tsconfig.json` (add `"allowImportingTsExtensions": true`, which is valid because `noEmit` is already set, so `.test.mts` files can import `./x.ts` the way `worker/index.test.mts` does)
- Create: `src/components/stack/detents.ts`
- Test: `src/components/stack/detents.test.mts`

**Interfaces:**
- Produces: `createDetents(stepDeg: number): (angleDeg: number) => boolean`. Each call returns `true` when `Math.round(angleDeg / stepDeg)` differs from the previous call's notch. The first call compares against notch `0`.

- [ ] **Step 1: Install.** Run `npm install uisfx@0.4.0 --save-exact`. Expected: `package.json` lists `"uisfx": "0.4.0"`, and `npm ls uisfx` prints `uisfx@0.4.0`.
- [ ] **Step 2: Verify the bytes.** Run `node -e "console.log(require('./package-lock.json').packages['node_modules/uisfx'].integrity)"` and expect the hash from Global Constraints. Then run `npm audit signatures` and expect `verified registry signature` and `verified attestation` for uisfx, with no invalid signatures.
- [ ] **Step 3: Write the failing tests** in `detents.test.mts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createDetents } from "./detents.ts";

test("rest and half a notch either way are silent", () => {
  const d = createDetents(15);
  assert.equal(d(0), false);
  assert.equal(d(7.4), false);
  assert.equal(d(-7.4), false);
});
test("crossing into the next notch ticks once", () => {
  const d = createDetents(15);
  assert.equal(d(7.6), true);
  assert.equal(d(14), false);
  assert.equal(d(22.4), false);
  assert.equal(d(22.6), true);
});
test("turning back ticks too", () => {
  const d = createDetents(15);
  assert.equal(d(-7.6), true);
  assert.equal(d(0), true);
});
test("a jump across several notches ticks once", () => {
  const d = createDetents(15);
  assert.equal(d(100), true);
  assert.equal(d(100), false);
});
```

- [ ] **Step 4: Extend the test script** to `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test worker/index.test.mts src/components/stack/detents.test.mts`. Run `npm test` and expect the detent tests to fail with a module-not-found error.
- [ ] **Step 5: Implement `createDetents`** in `detents.ts`.
- [ ] **Step 6: Run checks.** Run `npm test` (expect 23 passing: 19 Worker tests plus 4 detent tests) and `npm run typecheck` (expect it clean).

### Task 2: The sound module

**Files:**
- Create: `src/lib/sound.ts`

**Interfaces:**
- Consumes: `createUISFX`, plus the types `CueName`, `PlayOptions` and `UISFXPlayer` from `uisfx`, imported type-only at the top. The value is only ever loaded through `import("uisfx")`.
- Produces:
  - `play(cue: CueName, options?: PlayOptions): void`
  - `isSoundOn(): boolean`
  - `setSoundOn(on: boolean): void`. It must be called from inside the click that changes it.
  - `useSoundOn(): boolean`, via `useSyncExternalStore`. The server snapshot is `true`.
  - `installSound(): () => void`. It adds the listeners and schedules the prefetch, and returns a cleanup.
  - `prefetchSound(): void`, a warm import with no side effects.

- [ ] **Step 1: Write the module** to these rules. Each rule is the spec's "How it works" made exact:
  - **`unlock()`** (internal) only runs while sound is on. On the first call it sets `navigator.audioSession.type = "ambient"` where it exists (through a narrow cast), then creates `new (window.AudioContext ?? window.webkitAudioContext)({ latencyHint: "interactive" })`. On every call it runs `void ctx.resume()` if the state is not `"running"`. If the uisfx module is already loaded and there is no player yet, it creates the player synchronously with `createUISFX({ pack: "studio", volume: 0.6, context: ctx })` and then calls `void player.preload(PRELOAD)`. Otherwise it starts the import and creates the player when that resolves.
  - **`PRELOAD`** is `["press", "copy", "error", "send", "select", "deselect", "toggle-on", "toggle-off", "open", "close", "typing"]`.
  - **`play()`** returns early unless sound is on, a player exists, and either `ctx.state === "running"` or `navigator.userActivation?.isActive !== false`. This guard stops uisfx from queuing a sound on a suspended context, where it would fire late.
  - **The activation listeners** are capture-phase on `document`, ignore events that are not `isTrusted`, and call `unlock()`:
    - `pointerdown` when `pointerType === "mouse"`;
    - `pointerup` when it is not a mouse;
    - `touchend` (passive);
    - `click`;
    - `keydown` for any key except `Escape`.
  - **The keys listener** shares those capture listeners. The key selector is `.key:not([data-sfx]):not(:disabled):not([aria-disabled="true"])`.
    - On `pointerdown` with `button === 0 && isPrimary`, where `closest(selector)` matches, call `play("press")`. Unlock runs first in the same handler.
    - On `keydown` without `repeat`, call `play("press")` for Enter on a matched key, and for Space when that key is not an `<a>`.
    - Never play from `click`. That is what keeps keyboard activation to a single sound.
  - **The prefetch** in `installSound()` runs when sound is on and `navigator.connection?.saveData` is not set. It uses `requestIdleCallback(prefetchSound, { timeout: 3000 })`, falling back to `setTimeout(prefetchSound, 1500)`, and the cleanup cancels it.
  - **`setSoundOn(true)`** writes the preference (it removes `"off"`), enables the player if it exists, and calls `unlock()`. Once the player exists it plays `toggle-on`, awaiting the import if needed. That await is the one allowed delayed play, because the context was resumed in this same click.
  - **`setSoundOn(false)`** calls `player?.stopAll()` and `player?.setEnabled(false)`, then writes `"off"`.
  - **Subscribers** are notified on every change.
- [ ] **Step 2: Run checks.** Run `npm run lint` and `npm run typecheck`, and expect both clean.

### Task 3: The toggle

**Files:**
- Create: `src/components/SoundToggle.tsx`
- Modify: `src/components/Header.tsx` (render `<SoundToggle />` immediately before `<ThemeToggle />`)

**Interfaces:**
- Consumes: `useSoundOn`, `setSoundOn`, `installSound` and `prefetchSound` from Task 2.

- [ ] **Step 1: Write `SoundToggle`** as a client component.
  - Call `useEffect(() => installSound(), [])`, and set `mounted` the same way `ThemeToggle` does.
  - The button carries the classes copied from `ThemeToggle`. Its icon is `Volume2` when sound is on and `VolumeX` when it is off, at `h-[18px] w-[18px]`, and it renders no icon before mount.
  - `aria-label` and `title` read "Turn sound off" when on and "Turn sound on" when off.
  - `onClick` calls `setSoundOn(!on)`.
  - When sound is off, `onPointerEnter` and `onFocus` call `prefetchSound()`.
- [ ] **Step 2: Run checks.** Run `npm run lint`, `npm run typecheck` and `npm run build`, and expect all clean. Then check that no first-load chunk contains uisfx: run `grep -l "uisfx" out/_next/static/chunks/*.js`, and confirm that every match is a chunk not referenced by a `<script src>` in `out/index.html`.

### Task 4: Wire the cues

**Files:**
- Modify: `src/components/CopyEmail.tsx`
  - Add `data-sfx=""` to the button.
  - Call `play("copy")` after `writeText` resolves, and `play("error")` in the catch.
- Modify: `src/components/ContactForm.tsx`
  - Call `play("send")` where the state becomes `sent`.
  - Call `play("error")` on both error paths.
  - The Send key's `press` comes from the delegated listener.
- Modify: `src/components/ThemeToggle.tsx`
  - The first line of `toggle` is `play(next === "dark" ? "toggle-off" : "toggle-on")`.
- Modify: `src/components/Header.tsx`
  - Add `data-sfx=""` to the Menu button.
  - Add an effect keyed on `open` that compares against a `useRef(open)` holding the previous value. It plays `open` or `close` only when the value actually changed. That pattern is safe under Strict Mode's double effect run.
- Modify: `src/components/stack/scene.ts`
  - Add `onDetent?: () => void` to `StackSceneOptions`.
  - Add the constant `DETENT_DEG = 15` and a `let azShown = 0`.
  - In `step()`, right after `az` is updated, run `azShown = approach(azShown, azUser)`. It uses the same filter as `az`, so scroll and the intro never move it. Then run `if (detents(azShown)) opts.onDetent?.()`, with `detents = createDetents(DETENT_DEG)`.
- Modify: `src/components/stack/StackStage.tsx`
  - Pass `onDetent: () => play("typing", { cooldownMs: 45, playbackRate: 0.97 + Math.random() * 0.06 })` to `createStackScene`.
  - Add a previous-value effect on `selected` that plays `select` when the new value is not null and `deselect` when it is null, only on an actual change.

**Interfaces:**
- Consumes: `play` (Task 2) and `createDetents` (Task 1).

- [ ] **Step 1: Make the edits above.**
- [ ] **Step 2: Run checks.** Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`, and expect all clean, with 23 tests passing.

### Task 5: Verify in a real browser, and document

**Files:**
- Modify: `README.md` (one short paragraph under "Design": sound, pack, toggle, why it is restrained)
- Create, in the session scratchpad and never committed: a static server for `out/` that sends the CSP from `public/_headers`

- [ ] **Step 1: Serve the static export** with the production CSP. Before any interaction, inject a probe that wraps `AudioBufferSourceNode.prototype.start` and records `{ t, duration }` into `window.__sfx`, and that counts `AudioContext` constructions.
- [ ] **Step 2: On load,** expect zero contexts, zero `__sfx` entries, and no console warnings or CSP violations.
- [ ] **Step 3: Click "See the work".** Expect one `__sfx` entry and a context in the `running` state.
- [ ] **Step 4: Exercise each cue,** expecting one entry per action:
  - Copy;
  - the theme toggle, both directions;
  - a layer by tag and by canvas click, then Escape;
  - Reset view;
  - a drag of about 90°, expecting about 6 tick entries and none while scrolling the hero;
  - the menu at a 390px width, by tap, Escape and a link.
- [ ] **Step 5: Run the Review Focus checks.**
  1. Touch emulation: the first tap gives 0 entries and the second tap gives 1.
  2. Throw from `localStorage` (override `Storage.prototype.getItem` and `setItem`): sound still plays, and the toggle works.
  3. Enter on "See the work" gives exactly 1 entry, and Space on Copy gives exactly 1.
  4. A double-click on a key gives at most 2 entries. A fast fling's tick timestamps are at least 45 ms apart.
  5. Mute, then reload: no uisfx chunk in the network log, and 0 entries after clicks. Unmute: 1 `toggle-on` entry.
- [ ] **Step 6: Check the 404 page.** Load `/404`, click its key, and expect 0 entries and 0 contexts.
- [ ] **Step 7: Run every check one last time.** Run lint, typecheck, test and build, and expect all clean. Then report to Shaan and offer to commit and push. Pushing `main` deploys.
