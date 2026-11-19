/** The field's motion, as a pure function of time. The vertex shader in
 *  `shaders.ts` evaluates these same formulas line for line. The CPU uses them
 *  to find where every dot is at the moment a scene changes, so the next morph
 *  starts exactly there: nothing jumps, however often the scene changes.
 *  Only GLSL-available maths here: pow, sin, cos, floor, min and max. */
import { basis } from "../stack/geometry.ts";

/** Seconds. A new shape takes `shape` in all, of which up to `stagger` is the
 *  spread between the first dot leaving and the last; a move of the same shape
 *  takes `move`. */
export const TIMING = { shape: 1.4, move: 0.5, stagger: 0.45 } as const;

const EXPO_NORM = 1 - Math.pow(2, -10);

/** Expo out, normalised to run from exactly 0 to exactly 1, clamped outside. */
export function ease(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return (1 - Math.pow(2, -10 * c)) / EXPO_NORM;
}

/** Eased progress of one dot: it leaves at `start + delay · stagger` and
 *  arrives `duration` later. A duration of 0 means arrive at once (reduced
 *  motion). */
export function dotProgress(now: number, start: number, delay: number, duration: number, stagger: number): number {
  if (duration <= 0) return 1;
  return ease((now - start - delay * stagger) / duration);
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

/** One morph. `from` and `mid` are viewport pixels; `to` is in the target
 *  frame. `flow` holds, per dot, an edge vector (target-frame units) and a
 *  phase: a dot with a non-zero vector streams along its edge forever. */
export type MorphState = {
  n: number;
  from: Float32Array;
  mid: Float32Array;
  to: Float32Array;
  delay: Float32Array;
  seed: Float32Array;
  flow: Float32Array;
  start: number;
  duration: number;
  stagger: number;
};

/** Where dot `i` is at `now`: a quadratic Bézier from its source through its
 *  scattered midpoint to its framed, streaming target, plus a small drift. */
export function dotPosition(
  out: Float32Array,
  o: number,
  st: MorphState,
  i: number,
  now: number,
  frame: Frame,
  flowSpeed: number,
  drift: number,
): void {
  const p = dotProgress(now, st.start, st.delay[i], st.duration, st.stagger);
  const f = 4 * i;
  const j = 3 * i;
  const phase = st.flow[f + 3] + now * flowSpeed;
  const u = phase - Math.floor(phase);
  const lx = st.to[j] + st.flow[f] * u;
  const ly = st.to[j + 1] + st.flow[f + 1] * u;
  const lz = st.to[j + 2] + st.flow[f + 2] * u;
  const m = frame.m;
  const s = frame.s;
  const tx = frame.t[0] + s * (m[0] * lx + m[1] * ly + m[2] * lz);
  const ty = frame.t[1] + s * (m[3] * lx + m[4] * ly + m[5] * lz);
  const tz = frame.t[2] + s * (m[6] * lx + m[7] * ly + m[8] * lz);
  const q = 1 - p;
  const a = q * q;
  const b = 2 * q * p;
  const c = p * p;
  const sd = st.seed[i];
  out[o] = a * st.from[j] + b * st.mid[j] + c * tx + drift * Math.sin(now * (0.6 + 0.5 * sd) + 6.283 * sd);
  out[o + 1] = a * st.from[j + 1] + b * st.mid[j + 1] + c * ty + drift * Math.cos(now * (0.7 + 0.4 * sd) + 6.283 * sd);
  out[o + 2] = a * st.from[j + 2] + b * st.mid[j + 2] + c * tz;
}

/** Every dot's position at `now`, without the drift. The drift is always
 *  added on top, so a morph that starts from this snapshot starts exactly
 *  where the dots are on screen. */
export function snapshot(st: MorphState, now: number, frame: Frame, flowSpeed: number): Float32Array {
  const out = new Float32Array(3 * st.n);
  for (let i = 0; i < st.n; i++) dotPosition(out, 3 * i, st, i, now, frame, flowSpeed, 0);
  return out;
}
