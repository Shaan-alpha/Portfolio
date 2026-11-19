"use client";

import { useSyncExternalStore } from "react";
import type { CueName, PlayOptions, UISFXPlayer } from "uisfx";
import { keyActivates, mayUnlock, pressEvent } from "./soundEvents";

// Interface sound for the whole page. This module owns the visitor's mute
// preference, the AudioContext and the uisfx player, so any component can call
// play() without knowing whether audio has been unlocked yet.
//
// Browsers block audio until a trusted interaction. The context is created and
// resumed inside one, then handed to uisfx. Left to itself, uisfx creates its
// context lazily, and a cue played while that context is locked is queued and
// fires late, out of step with whatever caused it.
//
// uisfx synthesizes its sounds in the page (no audio files, so no CSP change)
// and never ships in the first-load bundle: it is imported on demand.

type UISFX = typeof import("uisfx");

const PACK = "studio";
// Below the library's suggested 0.7: sound is on for visitors who never asked
// for it. Each cue keeps uisfx's own tuned gain on top of this.
const VOLUME = 0.6;
// "off" when muted. Absent means on, so a first visit has sound.
const STORAGE_KEY = "sound";
// Everything the page can play, rendered ahead so the first of each is instant.
const PRELOAD: CueName[] = ["press", "copy", "error", "send", "select", "deselect", "toggle-on", "toggle-off", "open", "close", "typing"];
// Anything drawn as a key clicks when pressed. A key that plays its own result
// instead (Copy, Menu) opts out with data-sfx.
const KEY = '.key:not([data-sfx]):not(:disabled):not([aria-disabled="true"])';

let on: boolean | null = null;
let mod: UISFX | null = null;
let loading: Promise<UISFX> | null = null;
let ctx: AudioContext | null = null;
let player: UISFXPlayer | null = null;
const subscribers = new Set<() => void>();

function readPref(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    // No storage (the server, or site data blocked): sound stays on.
    return true;
  }
}

function writePref(value: boolean) {
  try {
    if (value) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, "off");
  } catch {
    // Storage is blocked: the choice still holds for this visit.
  }
}

export function isSoundOn(): boolean {
  on ??= readPref();
  return on;
}

function load(): Promise<UISFX> {
  loading ??= import("uisfx").then(
    (m) => (mod = m),
    (err: unknown) => {
      // A failed fetch (offline, a deploy mid-visit) may be retried later.
      loading = null;
      throw err;
    },
  );
  return loading;
}

/** Warm the uisfx chunk without creating any audio. */
export function prefetchSound() {
  load().catch(() => {});
}

function ensurePlayer(): UISFXPlayer | null {
  if (player || !mod || !ctx) return player;
  player = mod.createUISFX({ pack: PACK, volume: VOLUME, context: ctx });
  player.preload(PRELOAD).catch(() => {});
  return player;
}

/** Create or resume the audio, from inside a user activation only. */
function unlock() {
  // Some trusted events carry no activation (a modifier key, the touchend
  // that ends a scroll); starting audio on one warns and stays suspended.
  if (!isSoundOn() || !mayUnlock(navigator.userActivation)) return;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    // Safari: mix with the visitor's own music instead of pausing it, and
    // respect the silent switch. Other browsers do not have the API.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) {
      try {
        session.type = "ambient";
      } catch {
        // An unknown type throws in some versions; the default still mixes.
      }
    }
    try {
      ctx = new Ctor({ latencyHint: "interactive" });
    } catch {
      return;
    }
  }
  if (ctx.state !== "running") ctx.resume().catch(() => {});
  if (!ensurePlayer()) load().then(ensurePlayer).catch(() => {});
}

export function play(cue: CueName, options?: PlayOptions) {
  if (!isSoundOn() || !player || !ctx) return;
  // A context that cannot start yet would hold the sound and play it late.
  if (ctx.state !== "running" && navigator.userActivation?.isActive === false) return;
  player.play(cue, options);
}

export function setSoundOn(value: boolean) {
  if (value === isSoundOn()) return;
  if (!value) {
    player?.stopAll();
    player?.setEnabled(false);
  }
  on = value;
  writePref(value);
  subscribers.forEach((notify) => notify());
  if (!value) return;
  player?.setEnabled(true);
  unlock();
  // The one sound allowed to wait for the import: this same click resumed the
  // context, so it is still the visitor's own interaction being answered.
  (player ? Promise.resolve(player) : load().then(ensurePlayer)).then(() => play("toggle-on")).catch(() => {});
}

function subscribe(notify: () => void) {
  subscribers.add(notify);
  return () => {
    subscribers.delete(notify);
  };
}

export function useSoundOn(): boolean {
  return useSyncExternalStore(subscribe, isSoundOn, () => true);
}

// ── Page listeners ──────────────────────────────────────────────────────────
// Capture phase on document, so audio is unlocked before any component's own
// handler runs and wants to play.

function keyAt(target: EventTarget | null): Element | null {
  return target instanceof Element ? target.closest(KEY) : null;
}

// A mouse key clicks as it goes down, which is also when a mouse press counts
// as user activation. A touch or pen clicks as it lifts, still over the same
// key: until then it may turn into a scroll, which ends in pointercancel and
// stays silent. Lifting is also when a touch counts as activation, so the
// first tap on a phone can unlock audio and click in the same moment.
function onPointerDown(e: PointerEvent) {
  if (!e.isTrusted || pressEvent(e.pointerType) !== "pointerdown") return;
  unlock();
  if (e.button === 0 && e.isPrimary && keyAt(e.target)) play("press");
}

function onPointerUp(e: PointerEvent) {
  if (!e.isTrusted || pressEvent(e.pointerType) !== "pointerup") return;
  unlock();
  const key = keyAt(e.target);
  if (e.isPrimary && key && key === keyAt(document.elementFromPoint(e.clientX, e.clientY))) play("press");
}

function onActivate(e: Event) {
  if (e.isTrusted) unlock();
}

function onKeyDown(e: KeyboardEvent) {
  if (!e.isTrusted) return;
  // Escape and the modifier keys do not count as user activation.
  if (keyActivates(e.key)) unlock();
  if (e.repeat || (e.key !== "Enter" && e.key !== " ")) return;
  const key = keyAt(e.target);
  // Space presses buttons but not links. The click a key press synthesizes
  // plays nothing, so a keyboard press sounds exactly once.
  if (key && !(e.key === " " && key.tagName === "A")) play("press");
}

/** Wire the page's sound: unlock on interaction, click keys, and prefetch
 *  uisfx while idle when sound is on. Returns the cleanup. */
export function installSound(): () => void {
  const capture = { capture: true };
  document.addEventListener("pointerdown", onPointerDown, capture);
  document.addEventListener("pointerup", onPointerUp, capture);
  document.addEventListener("touchend", onActivate, { capture: true, passive: true });
  document.addEventListener("click", onActivate, capture);
  document.addEventListener("keydown", onKeyDown, capture);

  // Fetched at idle so the first key press can be heard. Save-Data waits for
  // the first interaction instead, and a muted visitor fetches nothing.
  let idle = 0;
  let timer = 0;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (isSoundOn() && !saveData) {
    if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(prefetchSound, { timeout: 3000 });
    else timer = window.setTimeout(prefetchSound, 1500);
  }

  return () => {
    document.removeEventListener("pointerdown", onPointerDown, capture);
    document.removeEventListener("pointerup", onPointerUp, capture);
    document.removeEventListener("touchend", onActivate, capture);
    document.removeEventListener("click", onActivate, capture);
    document.removeEventListener("keydown", onKeyDown, capture);
    if (idle) window.cancelIdleCallback(idle);
    if (timer) window.clearTimeout(timer);
  };
}
