/** The field's motion, as a pure function of time. The vertex shader in
 *  `shaders.ts` evaluates these same formulas line for line. The CPU uses them
 *  to find where every dot is at the moment a scene changes, so the next morph
 *  starts exactly there: nothing jumps, however often the scene changes.
 *  Only GLSL-available maths here: pow, exp, sin, cos, floor, min and max. */
import { basis } from "../stack/geometry.ts";

/** Seconds. A new shape takes `shape` in all, of which up to `stagger` is the
 *  spread between the first dot leaving and the last; a move of the same shape
 *  takes `move`. */
export const TIMING = { shape: 1.4, move: 0.5, stagger: 0.45 } as const;

/** What a dot does once it has arrived, the first of its four `loop` values.
 *  - stream: runs its edge again and again, the whole cycle long;
 *  - packet: waits, crosses its edge inside its window, then rests unseen;
 *  - hold: crosses inside its window, then rests at the end, greyed;
 *  - bounce: goes out inside its window and comes back;
 *  - pulse: a step's own dot, swinging about the step's centre after `a`;
 *  - arrive: crosses inside its window, then rests at the end, bright. */
export const MODE = { stream: 0, packet: 1, hold: 2, bounce: 3, pulse: 4, arrive: 5 } as const;

/** The pulse: a share of the dot's distance from the step's centre, decaying
 *  per second, at this many swings per second. */
export const PULSE = { amp: 0.3, decay: 2.6, hz: 1.6 } as const;

const EXPO_NORM = 1 - Math.pow(2, -10);

/** Expo out, normalised to run from exactly 0 to exactly 1, clamped outside. */
export function ease(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return (1 - Math.pow(2, -10 * c)) / EXPO_NORM;
}

/** GLSL's smoothstep. */
export function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Eased progress of one dot: it leaves at `start + delay · stagger` and
 *  arrives `duration` later. A duration of 0 means arrive at once (reduced
 *  motion). */
export function dotProgress(now: number, start: number, delay: number, duration: number, stagger: number): number {
  if (duration <= 0) return 1;
  return ease((now - start - delay * stagger) / duration);
}

/** Where a looping dot is in its cycle, 0 to 1, at loop-clock time `clock`. */
export function cycle(phase: number, rate: number, clock: number): number {
  const v = phase + clock * rate;
  return v - Math.floor(v);
}

/** How far along its edge a dot is, 0 to 1, at cycle point `c`. */
export function travel(mode: number, c: number, a: number, b: number): number {
  if (mode === MODE.stream) return c;
  if (mode === MODE.pulse) return 0;
  if (mode === MODE.bounce) {
    if (c <= a || c >= b) return 0;
    const m = (a + b) / 2;
    return c < m ? smoothstep(0, 1, (c - a) / (m - a)) : 1 - smoothstep(0, 1, (c - m) / (b - m));
  }
  if (c <= a) return 0;
  if (c >= b) return 1;
  return smoothstep(0, 1, (c - a) / (b - a));
}

/** A pulsing dot's push away from its step's centre, as a share of its
 *  distance: nothing before `a`, then a swing that dies away. */
export function pulseFactor(c: number, a: number, rate: number): number {
  if (c < a) return 0;
  const tau = (c - a) / rate;
  return PULSE.amp * Math.exp(-PULSE.decay * tau) * Math.sin(2 * Math.PI * PULSE.hz * tau);
}

/** How much of a dot shows, 0 to 1. A stream fades in and out at its ends,
 *  so its wrap from the end back to the start is never seen; a packet shows
 *  only in flight; a held or arriving dot shows from its departure until its
 *  cycle ends. `moving` is false for a dot with no edge. */
export function visibility(mode: number, c: number, u: number, a: number, b: number, moving: boolean): number {
  if (mode === MODE.stream) return moving ? smoothstep(0, 0.12, u) * (1 - smoothstep(0.88, 1, u)) : 1;
  if (mode === MODE.packet || mode === MODE.bounce) return smoothstep(a, a + 0.03, c) * (1 - smoothstep(b - 0.03, b, c));
  if (mode === MODE.hold || mode === MODE.arrive) return smoothstep(a, a + 0.03, c) * (1 - smoothstep(0.93, 1, c));
  return 1;
}

/** Target-frame units to viewport pixels: `t + s · M·p`, with M row-major. */
export type Frame = { m: number[]; t: [number, number, number]; s: number };

export const IDENTITY_FRAME: Frame = { m: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0], s: 1 };

/** The hero stack's frame: the same orthographic camera as the SVG drawing
 *  (`stack/geometry.ts`), so a local point lands where `project()` draws it,
 *  with y flipped for the screen. The third row is depth towards the camera.
 *  Tilt nudges elevation and azimuth by [dx, dy] degrees. */
export function stackFrame(
  azimuthDeg: number,
  elevationDeg: number,
  tiltDeg: [number, number],
  center: [number, number],
  scale: number,
): Frame {
  const { right, up, toCamera } = basis(azimuthDeg + tiltDeg[1], elevationDeg + tiltDeg[0]);
  return {
    m: [right[0], right[1], right[2], -up[0], -up[1], -up[2], toCamera[0], toCamera[1], toCamera[2]],
    t: [center[0], center[1], 0],
    s: scale,
  };
}

/** Ink, for the programs drawn in ink: packets, bounces and an arriving
 *  approval, each a single piece of work against the grey stream. */
export function inkOf(mode: number): number {
  return mode === MODE.packet || mode === MODE.bounce || mode === MODE.arrive ? 1 : 0;
}

/** Grey, for a held dot once it rests at the end of its edge. */
export function greyOf(mode: number, c: number, b: number): number {
  return mode === MODE.hold ? smoothstep(b, b + 0.1, c) : 0;
}

/** One morph. `from` and `mid` are viewport pixels; `to` is in the target
 *  frame. `flow` holds, per dot, an edge vector (target-frame units) and a
 *  phase; a pulsing dot's vector instead points from its step's centre to it.
 *  `loop` holds, per dot, its mode, its rate in cycles per second and its
 *  window `a`–`b` in cycle points. `wander` scales the ambient drift: 0 is
 *  rigid. */
export type MorphState = {
  n: number;
  from: Float32Array;
  mid: Float32Array;
  to: Float32Array;
  delay: Float32Array;
  seed: Float32Array;
  flow: Float32Array;
  loop: Float32Array;
  wander: Float32Array;
  /** Each dot's target kind (0 dust, 1 system, 2 model, 3 line), for its look. */
  kind?: Float32Array;
  /** Each dot's highlight group (a step's index, -1 for dust and edges). */
  group?: Float32Array;
  start: number;
  duration: number;
  stagger: number;
};

/** What the scene draws over every dot's own look: the highlighted group and
 *  how lit it is (0 to 1), and the mask rects that fade the dots inside them
 *  to 15%, four numbers each (x, y, width, height, in viewport pixels). */
export type Overlay = { group: number; amount: number; masks: ArrayLike<number> };

/** A mask rect's alpha factor at a point: 15% inside any rect, else 1. */
function maskAt(masks: ArrayLike<number>, x: number, y: number): number {
  for (let k = 0; k + 3 < masks.length; k += 4) {
    if (x >= masks[k] && x <= masks[k] + masks[k + 2] && y >= masks[k + 1] && y <= masks[k + 1] + masks[k + 3]) return 0.15;
  }
  return 1;
}

/** What a scene change carries over besides positions, each updated in place
 *  to what the dot shows at that moment: how much of it shows (`visFrom`),
 *  its look (`look`: the weights of dust, system, model and line, four per
 *  dot) and its tints (`tint`: ink, grey, highlight and mask, four per dot),
 *  with each dot's progress through its morph. With all of it carried, a dot
 *  caught mid-morph keeps its colour, size and brightness, and neither the
 *  old scene's highlight nor its masks switch off in one frame. */
export type Carry = { visFrom: Float32Array; progress: Float32Array; look?: Float32Array; tint?: Float32Array };

/** The one implementation behind `dotPosition`, `shownLook` and `snapshot`,
 *  so a scene change walks the dots once and the shader has one formula to
 *  match. With `carry`, it works out everything the dot shows: each value
 *  eased from what the dot showed when its morph began to what its program
 *  and scene give it. Into `shown` when given (nine values, see
 *  `shownLook`); otherwise into `carry` itself, the snapshot a new morph
 *  starts from. */
function place(
  out: Float32Array,
  o: number,
  st: MorphState,
  i: number,
  now: number,
  frame: Frame,
  clock: number,
  drift: number,
  carry?: Carry,
  overlay?: Overlay,
  shown?: Float32Array,
): void {
  const p = dotProgress(now, st.start, st.delay[i], st.duration, st.stagger);
  const f = 4 * i;
  const j = 3 * i;
  const mode = st.loop[f];
  const rate = st.loop[f + 1];
  const lo = st.loop[f + 2];
  const hi = st.loop[f + 3];
  const c = cycle(st.flow[f + 3], rate, clock);
  const u = travel(mode, c, lo, hi);
  const k = mode === MODE.pulse ? pulseFactor(c, lo, rate) : u;
  const lx = st.to[j] + st.flow[f] * k;
  const ly = st.to[j + 1] + st.flow[f + 1] * k;
  const lz = st.to[j + 2] + st.flow[f + 2] * k;
  const m = frame.m;
  const s = frame.s;
  const tx = frame.t[0] + s * (m[0] * lx + m[1] * ly + m[2] * lz);
  const ty = frame.t[1] + s * (m[3] * lx + m[4] * ly + m[5] * lz);
  const tz = frame.t[2] + s * (m[6] * lx + m[7] * ly + m[8] * lz);
  const r = 1 - p;
  const a = r * r;
  const b = 2 * r * p;
  const cc = p * p;
  const sd = st.seed[i];
  const w = p * drift * st.wander[i];
  out[o] = a * st.from[j] + b * st.mid[j] + cc * tx + w * Math.sin(now * (0.6 + 0.5 * sd) + 6.283 * sd);
  out[o + 1] = a * st.from[j + 1] + b * st.mid[j + 1] + cc * ty + w * Math.cos(now * (0.7 + 0.4 * sd) + 6.283 * sd);
  out[o + 2] = a * st.from[j + 2] + b * st.mid[j + 2] + cc * tz;
  if (!carry) return;
  const moving = st.flow[f] !== 0 || st.flow[f + 1] !== 0 || st.flow[f + 2] !== 0;
  const vis = carry.visFrom[i] + (visibility(mode, c, u, lo, hi, moving) - carry.visFrom[i]) * p;
  if (shown) shown[4] = vis;
  else {
    carry.visFrom[i] = vis;
    carry.progress[i] = p;
  }
  if (!carry.look || !carry.tint || !st.kind) return;
  const kind = st.kind[i];
  const g = 4 * i;
  for (let q = 0; q < 4; q++) {
    const weight = carry.look[g + q] + ((q === kind ? 1 : 0) - carry.look[g + q]) * p;
    if (shown) shown[q] = weight;
    else carry.look[g + q] = weight;
  }
  // The scene's highlight and masks, as the shader tests them: a dot of the
  // lit group is lit by the amount; a dot inside a mask rect shows 15%.
  // (Written out, not looped over an array: this runs for every dot at a
  // scene change, and allocates nothing.)
  const lit = overlay && st.group && Math.abs(st.group[i] - overlay.group) < 0.5 ? overlay.amount : 0;
  const masked = overlay ? maskAt(overlay.masks, out[o], out[o + 1]) : 1;
  const t = carry.tint;
  const ink = t[g] + (inkOf(mode) - t[g]) * p;
  const grey = t[g + 1] + (greyOf(mode, c, hi) - t[g + 1]) * p;
  const hl = t[g + 2] + (lit - t[g + 2]) * p;
  const mask = t[g + 3] + (masked - t[g + 3]) * p;
  if (shown) {
    shown[5] = ink;
    shown[6] = grey;
    shown[7] = hl;
    shown[8] = mask;
  } else {
    t[g] = ink;
    t[g + 1] = grey;
    t[g + 2] = hl;
    t[g + 3] = mask;
  }
}

/** What dot `i` shows at `now`, without changing anything, written to
 *  `out`: the weights of its four kinds, then its visibility, ink, grey,
 *  highlight and mask. The shader blends the same nine numbers into a
 *  colour, alpha and size. `at` gives the frame and drift that place the dot
 *  (the masks test where it is) and the scene's overlay; without it, nothing
 *  is lit and nothing masked. */
export function shownLook(
  st: MorphState,
  i: number,
  now: number,
  clock: number,
  carry: Required<Carry>,
  out: Float32Array,
  at?: { frame: Frame; drift: number; overlay: Overlay },
): void {
  place(new Float32Array(3), 0, st, i, now, at?.frame ?? IDENTITY_FRAME, clock, at?.drift ?? 0, carry, at?.overlay, out);
}

/** Where dot `i` is at `now`: a quadratic Bézier from its source through its
 *  scattered midpoint to its framed, moving target, plus its drift, which
 *  grows in as the dot arrives. `clock` is the scene's loop clock and `drift`
 *  the ambient amplitude in pixels. */
export function dotPosition(
  out: Float32Array,
  o: number,
  st: MorphState,
  i: number,
  now: number,
  frame: Frame,
  clock: number,
  drift: number,
): void {
  place(out, o, st, i, now, frame, clock, drift);
}

/** Every dot's position at `now`, drift included, so a morph that starts from
 *  this snapshot starts exactly where the dots are on screen. Writes into
 *  `out` when given one, so a scene change allocates nothing; with `carry`,
 *  the same pass records what each dot shows (its look, under the scene's
 *  `overlay`, the one being left) and its progress. */
export function snapshot(
  st: MorphState,
  now: number,
  frame: Frame,
  clock: number,
  drift: number,
  out?: Float32Array,
  carry?: Carry,
  overlay?: Overlay,
): Float32Array {
  const dst = out ?? new Float32Array(3 * st.n);
  for (let i = 0; i < st.n; i++) place(dst, 3 * i, st, i, now, frame, clock, drift, carry, overlay);
  return dst;
}
