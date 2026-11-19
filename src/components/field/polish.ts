/** Small rules about how the field moves, kept pure so each can be tested
 *  without a browser. `engine.ts` and `Film.tsx` apply them. */

/** A morph's midpoint that would fall inside the text column (left of
 *  `push`, the column's right edge plus a margin) moves past it, keeping its
 *  spread: the column's width maps onto `spread` pixels beyond its edge, so
 *  the dots that cross there don't bunch into one band. */
export function pushPast(mx: number, push: number, spread: number): number {
  if (mx >= push || push <= 0) return mx;
  return push + ((push - Math.max(0, mx)) / push) * spread;
}

/** How far the pointer tilts the stack, in degrees: [elevation, azimuth].
 *  Nothing until the stack starts to turn (`turnFrom`), so it never tilts
 *  while its drawing is still showing beneath it. */
export function tiltWanted(o: {
  motion: boolean;
  inside: boolean;
  stack: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  now: number;
  turnFrom: number;
  tiltDeg: number;
}): [number, number] {
  if (!o.motion || !o.inside || !o.stack || o.now < o.turnFrom) return [0, 0];
  return [(0.5 - o.y / o.h) * o.tiltDeg, (o.x / o.w - 0.5) * o.tiltDeg];
}

/** Reduced motion's scene change: the field fades out over `half` seconds,
 *  the new scene is placed, and it fades back in over `half`. */
export function fadeAlpha(now: number, start: number, half: number): number {
  return Math.min(1, Math.max(0, Math.abs(1 - (now - start) / half)));
}

/** A new start for a fade asked for mid-fade: on the way out, at the level
 *  the field shows now, so a second change never blanks or flashes it. */
export function refade(now: number, start: number, half: number): number {
  const level = fadeAlpha(now, start, half);
  return now - (1 - level) * half;
}

/** What a resize needs. A phone's URL bar changes the window's height but
 *  not `100svh`, so the scenes keep their layout and only the canvas
 *  changes; a change of width or of the scenes' height moves every marker. */
export type Size = { w: number; h: number; sceneH: number };

export function resizeNeeds(prev: Size, next: Size): "none" | "canvas" | "rebuild" {
  if (prev.w !== next.w || Math.abs(prev.sceneH - next.sceneH) > 1) return "rebuild";
  if (prev.h !== next.h) return "canvas";
  return "none";
}
