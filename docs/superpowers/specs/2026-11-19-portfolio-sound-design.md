# Portfolio Sound — "keys click, the model ticks"

**Date:** 2026-11-19
**Owner:** Shaan Satsangi
**Status:** Design approved (default, pack and ticks chosen by Shaan); not yet built

## Intent

Add interface sound to the portfolio with [uisfx](https://github.com/romainsimon/uisfx), so the site's physical language (keys that sink when pressed, a model you can turn) is heard as well as seen. The goal is the same as the October renovation: the site should feel made by a design team, and must never annoy a recruiter who opens it at work.

"Effects" here means sound effects. No new visual animation is part of this work.

## Goals, non-goals, anti-goals

- **Goals:** every sound backs up feedback the page already shows; one sound per action; a persistent mute control; the sound runtime stays out of the first-paint bundle.
- **Non-goals:** music or ambience, sound on the 404 page, haptics, any change to the visual design beyond the sound toggle.
- **Anti-goals (a failure even if it works):** sound on page load; sound on hover, focus or scroll; celebration sounds for routine actions; sound as the only signal of anything; pausing the visitor's own music on a phone; console warnings or CSP violations.

## Decisions made by Shaan

| Question | Choice |
|---|---|
| Sound on or off for a first visit | **On from the first click.** Browsers block audio until the first trusted interaction anyway, so nothing plays on load. |
| Sound character | **Studio** pack ("tactile precision with warm restraint"). It is one constant, so changing it later is a one-line switch. |
| Should turning the model tick | **Yes, quiet ticks**, like a detented dial. |

## Approaches considered

1. **uisfx Web Audio runtime, lazy-loaded (chosen).** Sounds are synthesized in the page from deterministic recipes, so no audio files are fetched and the CSP needs no change. The runtime is about 12 kB compressed and is loaded after first paint, not in the initial bundle. Switching the pack is a single constant.
2. **uisfx's pre-rendered MP3/Ogg files served from `public/`.** This sounds identical everywhere and needs no synthesis, but it adds a request per sound plus hand-written playback code, for no gain on a site that already ships a strict CSP and a tight bundle.
3. **Hand-written Web Audio synthesis, no dependency.** This would be the smallest, but it throws away the library Shaan chose and its tuned, listened-to sound design. It would also be generic beeps written by someone who cannot hear them.

## Sound map

One sound per action. Keys make contact; a result replaces the contact sound when it is immediate, and follows it when it arrives later.

| Action | Cue (studio pack) | Notes |
|---|---|---|
| Pressing a key: See the work, Email me, project links, Reset view, Send message | `press` | With a mouse it plays on `pointerdown` as the key bottoms out. With touch or a pen it plays as the finger lifts over the same key, so a touch that turns into a scroll (which ends in `pointercancel`) stays silent. Enter or Space plays it for keyboard users. Handled by one delegated listener, so server components need no changes. |
| Copy email | `copy`, or `error` if the clipboard refuses | Replaces the key's `press`. |
| Contact form: the server confirms / the send fails | `send` / `error` | Follows the Send key's `press`. `send` ("a message leaves the user") matches "Message sent." without celebrating a routine action. |
| Selecting / clearing a model layer (click, tap, tag button, Escape) | `select` / `deselect` | Derived from the resulting state, so every path in sounds the same. |
| Turning the model (drag, its coast, and the wind-back after Reset view) | `typing` as a detent tick | Fires once per 15° notch of the visitor's own rotation, never from scroll or the intro animation. Like a real detent it has hysteresis: it clicks over at 65% of a notch, so a resting finger cannot make it chatter. There is at least 45 ms between ticks, so a fast spin never buzzes, and each tick's pitch varies by ±3% so a run of ticks is not a machine gun. `typing` measured the shortest, brightest and quietest studio cue (mean −30 dB, about 4 kHz). |
| Theme: to light / to dark | `toggle-on` / `toggle-off` | A light switch: lights on, lights off. |
| Turning sound on | `toggle-on` | Confirms that sound works. Turning sound off is silent. |
| Phone menu opens / closes | `open` / `close` | Replaces the Menu key's `press`. Escape and choosing a link close it too. |

**Silent everywhere:** hover, focus, scrolling, scroll-spy, nav links and text links, the load-in animation, the hero's scroll turn, typing in the form, and the 404 page (it has no toggle, so it plays no sound).

## How it works

- **One module, `src/lib/sound.ts`,** owns the preference, the `AudioContext`, the lazily imported player, and a `play(cue)` function that does nothing until sound is unlocked and enabled. Any component can import and call it.
- **The preference** is stored in `localStorage` under `sound`, holding `"off"` when muted. When it is absent, sound is on. Every read and write is wrapped in try/catch, and the page works without storage.
- **Unlock.** On the first trusted interaction that counts as user activation, the module creates its own `AudioContext` and resumes it inside that event. Where the browser reports `navigator.userActivation`, that report decides. Elsewhere the event filters do: a mouse `pointerdown`, a touch `pointerup` or `touchend`, a `click`, or a `keydown` other than Escape and the modifier keys. A context started outside an activation logs a warning and stays suspended. It then hands the context to `createUISFX({ context })`. uisfx would otherwise create its context lazily and queue sounds played while locked, which could make them fire late. Later activations re-resume the context after iOS interruptions.
- **Phones.** Before the context is created, `navigator.audioSession.type` is set to `"ambient"` where Safari supports it. Sounds then mix with the visitor's music instead of pausing it, and they respect the silent switch.
- **Loading.** When sound is on, the uisfx chunk is prefetched at idle after load, so the first key press can be heard. Under Save-Data it is fetched at the first interaction instead. When sound is off, it is not fetched at all until the visitor turns sound on. After the player is created, the cues in the map are preloaded cooperatively.
- **The keys listener** is one capture-phase listener on `document` for `pointerdown` and `keydown`. It matches `.key` elements that are not disabled and do not carry `data-sfx`, which marks a key that plays its own result. That covers Copy and Menu.
- **Ticks.** `scene.ts` gains an `onDetent` option. It smooths the visitor's own azimuth alongside the camera, with the same filter, so scroll and the intro animation never cross a detent.
- **The toggle** is `SoundToggle`, a 40×40 icon button beside the theme toggle in the header, matching the theme toggle exactly. It shows lucide's `Volume2` or `VolumeX`, labelled "Turn sound off" or "Turn sound on", and renders empty until mount, the same pattern the theme toggle uses. It also installs the module's listeners, so a page without a toggle never plays sound.
- **Muting** stops any playing sound (`stopAll`) and disables the player.

## Calls made without asking (check these)

1. Master volume is 0.6, slightly under the library's README example of 0.7, because sound is on for visitors who did not ask for it. Each cue keeps uisfx's own tuned gain.
2. The detent tick uses the `typing` cue at its default gain, with a 15° detent, a 45 ms minimum gap and ±3% pitch variation.
3. A confirmed contact-form message plays `send` rather than `success`.
4. Light theme is `toggle-on` and dark theme is `toggle-off`.
5. Escape clearing a model layer plays `deselect`. Escape closing the phone menu plays `close`.
6. On a touch screen a key clicks when the finger lifts, not when it lands. A swipe that starts on a key stays silent, and the first tap can unlock audio and click in the same moment. This changes the approved "plays on pointerdown" for touch only, because the anti-goal of no sound on scroll outranks it.
7. The typeUI fundamentals skill was installed at user level (`~/.claude/skills/typeui-fundamentals`), not in the repo. Its rules (no audio on hover, no autoplay, no celebrating routine actions) are reflected above. Its style presets were not used, because they are the generated looks rejected in June and October.

## Supply chain

Both tools were checked before use. uisfx 0.4.0 had no known advisories and no install scripts. Its tarball checksum matched the registry and its signed SLSA provenance, which points to commit `07d6541` of `romainsimon/uisfx`. Its runtime makes no network calls and uses no eval, and Windows Defender found no threats. It is pinned to the exact version. typeUI (`typeui.sh` 0.7.1) passed the same checks, except that it is published without provenance. Only its markdown skill was installed.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` must all be clean.
- **Bundle:** uisfx must be a separate chunk, absent from the first-load JavaScript.
- **In a real browser,** check each of these:
  - no `AudioContext` before the first interaction, and no autoplay warning in the console;
  - a key press plays once and the context is running;
  - Copy, the theme toggle, the menu, layer select and deselect, and the contact form's success and error paths each play their cue;
  - ticks fire while dragging, but not while scrolling or during the intro;
  - muting stops sound and persists across a reload;
  - the 404 page plays nothing;
  - there are no CSP violations under the production `_headers`.
