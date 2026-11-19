/** What the film does with one wheel event. Inside the film a gesture moves
 *  exactly one scene, the way the reference does it: CSS snap alone bounces a
 *  single 100 px notch back to where it was, so the page cancels the browser's
 *  own scroll and steps instead. The reading part scrolls natively. Pure, so
 *  the rule is tested without a browser; `snap.ts` applies it. */

export type WheelEventLike = { deltaX: number; deltaY: number; ctrlKey: boolean; timeStamp: number };

/** `stops` is ascending: the scene tops, then the reading part's top, which is
 *  always last. `vh` is the viewport's height. `lastAt` is the timestamp of
 *  the previous event that was not passed through (`-Infinity` before the
 *  first). */
export type WheelContext = { y: number; stops: number[]; vh: number; lastAt: number; moving: boolean; blocked: boolean };

export type WheelDecision = { kind: "pass" } | { kind: "swallow" } | { kind: "step"; to: number };

/** An event more than this long after the previous one starts a new gesture.
 *  Anything closer is the rest of a fast spin or a trackpad's inertia. */
export const GESTURE_GAP_MS = 180;

const PASS: WheelDecision = { kind: "pass" };
const SWALLOW: WheelDecision = { kind: "swallow" };

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

  if (c.moving || e.timeStamp - c.lastAt <= GESTURE_GAP_MS) return SWALLOW;

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
