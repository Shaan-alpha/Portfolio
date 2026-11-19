/** What the film does with one wheel event. Inside the film a gesture moves
 *  exactly one scene, the way the reference does it: CSS snap alone bounces a
 *  single 100 px notch back to where it was, so the page cancels the browser's
 *  own scroll and steps instead. The reading part scrolls natively. Pure, so
 *  the rule is tested without a browser; `snap.ts` applies it. */

export type WheelEventLike = { deltaX: number; deltaY: number; ctrlKey: boolean; timeStamp: number };

/** `stops` is ascending: the scene tops, then the reading part's top, which is
 *  always last. `lastAt` is the timestamp of the previous event that was not
 *  passed through (`-Infinity` before the first). */
export type WheelContext = { y: number; stops: number[]; lastAt: number; moving: boolean; blocked: boolean };

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

  const reading = c.stops[c.stops.length - 1];
  if (c.y > reading + 1) return PASS;
  if (Math.abs(c.y - reading) <= 1 && e.deltaY > 0) return PASS;

  if (c.moving || e.timeStamp - c.lastAt <= GESTURE_GAP_MS) return SWALLOW;

  let i = 0;
  for (let k = 1; k < c.stops.length; k++) {
    if (Math.abs(c.stops[k] - c.y) < Math.abs(c.stops[i] - c.y)) i = k;
  }
  const j = Math.max(0, Math.min(c.stops.length - 1, i + Math.sign(e.deltaY)));
  if (Math.abs(c.stops[j] - c.y) < 1) return SWALLOW;
  return { kind: "step", to: c.stops[j] };
}
