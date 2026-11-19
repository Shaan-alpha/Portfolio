import type { Blueprint, Vec3 } from "./blueprint";

// The camera, as data: named shots framed for any screen shape, and the beats
// the scroll moves through in acts I and II. Pure, so the framing and the
// path (it must never pass through the building) are unit-tested.

export type Shot = { position: Vec3; target: Vec3; fov: number };
export type ShotName = "site" | "section" | "above" | "dive" | "vault";
/** Where the levels stand at a beat: `separation` pulls the levels apart and
 *  `cut` slides the cut-away façades off, both 0 to 1. */
export type Beat = { shot: ShotName; separation: number; cut: number };

/** Acts I and II over scroll progress 0 to 1. The camera climbs over the
 *  atrium before it dives, and climbs out again, because a straight line from
 *  the section shot to the model would pass through the roof. The levels close
 *  up for the dive, so the geometry the camera flies through is exactly the
 *  blueprint's. */
export const BEATS: { at: number; beat: Beat }[] = [
  { at: 0, beat: { shot: "site", separation: 0, cut: 0 } },
  { at: 0.3, beat: { shot: "section", separation: 1, cut: 1 } },
  { at: 0.46, beat: { shot: "above", separation: 0, cut: 1 } },
  { at: 0.6, beat: { shot: "dive", separation: 0, cut: 1 } },
  { at: 0.74, beat: { shot: "above", separation: 0, cut: 1 } },
  { at: 1, beat: { shot: "section", separation: 1, cut: 1 } },
];

const rad = (d: number) => (d * Math.PI) / 180;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** How far a camera must stand for a sphere of `radius` to fit its frustum,
 *  whichever of the vertical or horizontal field of view binds. */
export function fitDistance(radius: number, fovDeg: number, aspect: number, margin = 1.1): number {
  const vHalf = rad(fovDeg) / 2;
  const hHalf = Math.atan(Math.tan(vHalf) * aspect);
  return (radius * margin) / Math.sin(Math.min(vHalf, hHalf));
}

/** A camera orbiting `target`: azimuth from +z towards +x, elevation up. */
function orbit(target: Vec3, azimuthDeg: number, elevationDeg: number, distance: number): Vec3 {
  const a = rad(azimuthDeg);
  const e = rad(elevationDeg);
  return [target[0] + distance * Math.sin(a) * Math.cos(e), target[1] + distance * Math.sin(e), target[2] + distance * Math.cos(a) * Math.cos(e)];
}

type Frame = { az: number; el: number; fov: number; scale: number; offset: Vec3 };
// `scale` multiplies the sphere-fit distance: the bounding sphere is generous
// round a wide, low building, so the site shot stands well inside it.
const FRAMES: Record<"site" | "section", { landscape: Frame; portrait: Frame }> = {
  site: {
    landscape: { az: 38, el: 22, fov: 30, scale: 0.64, offset: [0, -0.2, 0] },
    portrait: { az: 32, el: 26, fov: 34, scale: 0.8, offset: [0, -0.4, 0] },
  },
  section: {
    landscape: { az: 48, el: 30, fov: 32, scale: 0.56, offset: [0.4, -0.2, 0.3] },
    portrait: { az: 40, el: 32, fov: 36, scale: 0.72, offset: [0.2, -0.3, 0.2] },
  },
};

export function shotFor(name: ShotName, aspect: number, bp: Pick<Blueprint, "center" | "radius" | "atrium" | "model">): Shot {
  // Phone stages are about square; the wide framing is tuned for 4:3.
  const portrait = aspect < 1.1;
  const m = bp.model.center;
  // Act IV: through the plinth's open side into level B, the vault.
  if (name === "vault") return { position: [9.2, -0.3, 1.4], target: [1.6, -0.85, 0.1], fov: portrait ? 44 : 36 };
  if (name === "above") return { position: [m[0], m[1] + 4.6, m[2] + 0.35], target: [...m] as Vec3, fov: portrait ? 52 : 40 };
  // Far enough above the block to frame it with the columns and railings
  // round the opening, still inside the atrium.
  if (name === "dive") return { position: [m[0], m[1] + 1.9, m[2] + 0.12], target: [...m] as Vec3, fov: portrait ? 66 : 55 };
  const f = FRAMES[name][portrait ? "portrait" : "landscape"];
  const target: Vec3 = [bp.center[0] + f.offset[0], bp.center[1] + f.offset[1], bp.center[2] + f.offset[2]];
  return { position: orbit(target, f.az, f.el, fitDistance(bp.radius, f.fov, aspect) * f.scale), target, fov: f.fov };
}

export function lerpShot(a: Shot, b: Shot, t: number): Shot {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const l = (u: Vec3, v: Vec3): Vec3 => [u[0] + (v[0] - u[0]) * t, u[1] + (v[1] - u[1]) * t, u[2] + (v[2] - u[2]) * t];
  return { position: l(a.position, b.position), target: l(a.target, b.target), fov: a.fov + (b.fov - a.fov) * t };
}

/** The two beats around scroll progress `p`, and the eased way between them. */
export function choreograph(p: number): { from: Beat; to: Beat; t: number } {
  const q = clamp01(p);
  let i = 0;
  while (i < BEATS.length - 2 && q > BEATS[i + 1].at) i++;
  const a = BEATS[i];
  const b = BEATS[i + 1];
  return { from: a.beat, to: b.beat, t: easeInOutCubic(clamp01((q - a.at) / (b.at - a.at))) };
}

/** Where a world point lands in normalised device coordinates (x right and
 *  y up, both -1 to 1) for a camera at `shot` and a viewport `aspect`. */
export function project(point: Vec3, shot: Shot, aspect: number): [number, number] {
  const sub = (u: Vec3, v: Vec3): Vec3 => [u[0] - v[0], u[1] - v[1], u[2] - v[2]];
  const dot = (u: Vec3, v: Vec3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const cross = (u: Vec3, v: Vec3): Vec3 => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const norm = (u: Vec3): Vec3 => {
    const l = Math.hypot(u[0], u[1], u[2]) || 1;
    return [u[0] / l, u[1] / l, u[2] / l];
  };
  const f = norm(sub(shot.target, shot.position));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const v = sub(point, shot.position);
  const depth = dot(v, f);
  const k = Math.tan(rad(shot.fov) / 2) * depth;
  return [dot(v, r) / (k * aspect), dot(v, u) / k];
}
