import { layers } from "@/content/stack";
import { buildBlueprint, type Vec3 } from "./blueprint";
import { project, shotFor } from "./shots";

/** The stage's shape on wide screens, which the stills are rendered at. */
export const STAGE_ASPECT = 4 / 3;

/** Where each callout sits before the model has measured itself, as a
 *  percentage of the stage height: each level's right-most corner in the site
 *  shot, the same framing as the still. Labels keep at least 13% apart, room
 *  for a two-line label (name, then level) on a 340px stage. Run on
 *  the server at build time, so the blueprint never ships in the first load. */
export function restingTops(): number[] {
  const bp = buildBlueprint("low");
  const shot = shotFor("site", STAGE_ASPECT, bp);
  const box = (c: number[], s: number[]): Vec3[] =>
    [-1, 1].flatMap((dx) => [-1, 1].flatMap((dy) => [-1, 1].map((dz) => [c[0] + (dx * s[0]) / 2, c[1] + (dy * s[1]) / 2, c[2] + (dz * s[2]) / 2] as Vec3)));
  const anchorTop = (pts: Vec3[]) => {
    const best = pts.map((p) => project(p, shot, STAGE_ASPECT)).sort((a, b) => b[0] - a[0])[0];
    return ((1 - best[1]) / 2) * 100;
  };
  const tops = layers.map((l) => {
    if (l.id === "model") return anchorTop(box(bp.model.center, bp.model.size));
    const s = bp.storeys.find((x) => x.id === l.id)!;
    return anchorTop(box([0, (s.y0 + s.y1) / 2, 0], [s.id === "state" ? 8.4 : 8.5, s.y1 - s.y0, s.id === "state" ? 5.4 : 5.5]));
  });
  const order = tops.map((t, i) => ({ t, i })).sort((a, b) => a.t - b.t);
  let floor = -Infinity;
  for (const o of order) {
    o.t = Math.max(o.t, floor + 13);
    floor = o.t;
  }
  return order.sort((a, b) => a.i - b.i).map((o) => Math.round(o.t * 100) / 100);
}
