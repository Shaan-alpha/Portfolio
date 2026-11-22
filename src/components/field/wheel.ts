/** What the film does with one wheel event. Inside the film a gesture moves
 *  exactly one scene, the way the reference does it: CSS snap alone bounces a
 *  single 100 px notch back to where it was, so the page cancels the browser's
 *  own scroll and steps instead. The reading part scrolls natively. Pure, so
 *  the rule is tested without a browser; `snap.ts` applies it. */

export type WheelEventLike = { deltaX: number; deltaY: number; ctrlKey: boolean; timeStamp: number };

/** An event the film took: when it came, and its speed in px/ms. */
export type WheelSample = { t: number; v: number };

/** `stops` is ascending: the scene tops, then the reading part's top, which is
 *  always last. `vh` is the viewport's height. `lastAt` is the timestamp of
 *  the previous event that was not passed through (`-Infinity` before the
 *  first). `since` and `peak` come from `rememberWheel`; without them a new
 *  gesture needs a pause. */
export type WheelContext = {
  y: number;
  stops: number[];
  vh: number;
  lastAt: number;
  moving: boolean;
  blocked: boolean;
  moves?: readonly WheelMove[];
  since?: readonly WheelSample[];
  peak?: number;
};

export type WheelDecision = { kind: "pass" } | { kind: "swallow" } | { kind: "step"; to: number };

/** An event more than this long after the previous one starts a new gesture.
 *  Anything closer is the rest of a fast spin or a trackpad's inertia. */
export const GESTURE_GAP_MS = 180;

const PASS: WheelDecision = { kind: "pass" };
const SWALLOW: WheelDecision = { kind: "swallow" };

/** An event's scroll, and the time it took: since the event before. */
export type WheelMove = { t: number; px: number; dt: number };

/** What the film keeps of the events it acts on: when the last one came, the
 *  moves of the last 250 ms, the speeds since its last step (as smoothed at
 *  each event, the latest 250 ms of them), and the fastest of the earlier
 *  speeds it has let go. */
export type WheelMemory = { lastAt: number; moves: WheelMove[]; since: WheelSample[]; peak: number };

export const NO_WHEEL_MEMORY: WheelMemory = { lastAt: -Infinity, moves: [], since: [], peak: 0 };

/** A new swipe can start before the last one's momentum has died away: a
 *  touchpad keeps sending ever slower events for a second or more after the
 *  fingers lift, never pausing long enough to end the gesture. It shows as a
 *  jump in speed after a fade:
 *  - the gesture peaked, then slowed to a quarter of that peak or less;
 *  - the speed is now four times what it slowed to, and at least 2.3 px/ms.
 *    Fingers resting on the pad drift at up to 2 px/ms, and a swipe runs at
 *    2.7 px/ms or more (a Windows precision touchpad, `wheel.fixtures.ts`).
 *  A mouse wheel does not slow down while it rolls, so a roll stays one
 *  gesture. */
export const SWIPE = { minSpeed: 2.3, ratio: 4, faded: 0.25 } as const;

// Speed is the scroll of the last 40 ms, each event's spread over the time
// it took. The display's frame rate, its beat against the touchpad's own
// rate, and the events Chrome merges while the page is busy all change how
// the scroll is cut into events, never how much of it falls in 40 ms.
const SMOOTH_MS = 40;
// "What it slowed to" is the fastest speed 50 to 90 ms back, and the peak is
// the fastest since the last step before that window. Leaving out the latest
// 50 ms keeps a new swipe's own first moments out of both: they would hide
// its jump, or count as the peak it falls from. And a swipe still speeding up
// after its own step (a reduced-motion step lands at once) has no peak before
// the window to have fallen from.
const SKIP_MS = 80;
const SPAN_MS = 40;
const KEEP_MS = 250;

function moveOf(e: WheelEventLike, lastAt: number): WheelMove {
  return { t: e.timeStamp, px: Math.abs(e.deltaY), dt: Math.min(GESTURE_GAP_MS, Math.max(4, e.timeStamp - lastAt)) };
}

/** px/ms over the 40 ms up to `t`. */
function speedAt(moves: readonly WheelMove[], t: number): number {
  let px = 0;
  for (const m of moves) {
    const overlap = Math.min(m.t, t) - Math.max(m.t - m.dt, t - SMOOTH_MS);
    if (overlap > 0) px += (m.px * overlap) / m.dt;
  }
  return px / SMOOTH_MS;
}

function newSwipe(e: WheelEventLike, c: WheelContext): boolean {
  const v = speedAt([...(c.moves ?? []), moveOf(e, c.lastAt)], e.timeStamp);
  if (v < SWIPE.minSpeed) return false;
  const from = e.timeStamp - SKIP_MS - SPAN_MS;
  const to = e.timeStamp - SKIP_MS;
  let peak = c.peak ?? 0;
  let slowed = -1;
  let lastBefore = -1;
  for (const s of c.since ?? []) {
    if (s.t < from) {
      peak = Math.max(peak, s.v);
      lastBefore = s.v;
    } else if (s.t <= to) slowed = Math.max(slowed, s.v);
  }
  // A sparse tail can leave the window empty: then the last speed before it.
  if (slowed < 0) slowed = lastBefore;
  return slowed >= 0 && slowed <= SWIPE.faded * peak && v >= SWIPE.ratio * slowed;
}

/** The memory after event `e`, decided `d`. A passed event leaves no trace,
 *  and a step starts the record of speeds again. */
export function rememberWheel(m: WheelMemory, e: WheelEventLike, d: WheelDecision): WheelMemory {
  if (d.kind === "pass") return m;
  const t = e.timeStamp;
  const moves = [...m.moves.filter((x) => x.t >= t - KEEP_MS), moveOf(e, m.lastAt)];
  const now = { t, v: speedAt(moves, t) };
  if (d.kind === "step") return { lastAt: t, moves, since: [now], peak: 0 };
  let peak = m.peak;
  const since: WheelSample[] = [];
  for (const s of m.since) {
    if (s.t >= t - KEEP_MS) since.push(s);
    else peak = Math.max(peak, s.v);
  }
  since.push(now);
  return { lastAt: t, moves, since, peak };
}

export function decideWheel(e: WheelEventLike, c: WheelContext): WheelDecision {
  // Zoom, sideways scrolling and anything inside a dialog or the open menu are
  // never the film's business.
  if (c.blocked || e.ctrlKey || e.deltaY === 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return PASS;

  const last = c.stops.length - 1;
  const reading = c.stops[last];
  if (c.y > reading + 1) return PASS;
  if (Math.abs(c.y - reading) <= 1 && e.deltaY > 0) return PASS;

  // A scene taller than the screen (zoom, a small window, large text) is
  // scrolled through natively; the wheel steps only at its edges.
  const tall = (k: number) => k < last && c.stops[k + 1] - c.stops[k] > c.vh + 1;
  let cur = 0;
  for (let k = 1; k <= last; k++) if (c.stops[k] <= c.y + 1) cur = k;
  if (!c.moving && tall(cur)) {
    if (e.deltaY > 0 && c.y + c.vh < c.stops[cur + 1] - 1) return PASS;
    if (e.deltaY < 0 && c.y > c.stops[cur] + 1) return PASS;
  }

  if (c.moving) return SWALLOW;
  if (e.timeStamp - c.lastAt <= GESTURE_GAP_MS && !newSwipe(e, c)) return SWALLOW;

  let i = 0;
  for (let k = 1; k <= last; k++) {
    if (Math.abs(c.stops[k] - c.y) < Math.abs(c.stops[i] - c.y)) i = k;
  }
  const j = Math.max(0, Math.min(last, i + Math.sign(e.deltaY)));
  // Stepping up into a tall scene lands on its bottom, the way back in.
  const to = e.deltaY < 0 && tall(j) ? c.stops[j + 1] - c.vh : c.stops[j];
  if (Math.abs(to - c.y) < 1) return SWALLOW;
  return { kind: "step", to };
}
