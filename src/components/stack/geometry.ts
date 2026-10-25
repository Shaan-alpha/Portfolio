/** Shared by the WebGL scene and the SVG drawing that stands in for it while it
 *  loads (or if WebGL is unavailable). Both use the same orthographic camera
 *  maths, so the drawing and the rendered model line up exactly at rest. */

/** Plate footprint and thickness, in world units. */
export const PLATE_W = 3.2;
export const PLATE_D = 2.2;
export const PLATE_H = 0.16;
export const PLATE_R = 0.09;

/** The model block. It sits in slot 3 with no plate under it: the model is one
 *  component in the stack, not a layer of its own. */
export const CUBE = 0.56;
export const MODEL_SLOT = 3;
export const SLOTS = 5;
/** The block sits a little below its slot's centre line so the plate above
 *  does not hide its top face at the resting camera angle. */
export const MODEL_DROP = 0.12;

export const GAP = 0.9;
export const AZIMUTH = 40;
export const ELEVATION = 24;

/** The orthographic frame: at least VIEW_H tall and VIEW_MIN_W wide, whichever
 *  binds first for the canvas' aspect. An SVG viewBox of the same size with
 *  `xMidYMid meet` scales identically. */
export const VIEW_H = 6.1;
export const VIEW_MIN_W = 4.5;

export const slotY = (slot: number, gap = GAP) => (2 - slot) * gap - (slot === MODEL_SLOT ? MODEL_DROP : 0);

const rad = (d: number) => (d * Math.PI) / 180;

export type Vec3 = [number, number, number];

/** Screen axes for a camera orbiting the origin. Azimuth is measured from +z
 *  towards +x, elevation up from the horizon. */
export function basis(azimuthDeg: number, elevationDeg: number) {
  const a = rad(azimuthDeg);
  const e = rad(elevationDeg);
  const right: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
  const up: Vec3 = [-Math.sin(e) * Math.sin(a), Math.cos(e), -Math.sin(e) * Math.cos(a)];
  /** Unit vector from the origin towards the camera. */
  const toCamera: Vec3 = [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)];
  return { right, up, toCamera };
}

export function project(p: Vec3, b: ReturnType<typeof basis>): [number, number] {
  return [
    p[0] * b.right[0] + p[1] * b.right[1] + p[2] * b.right[2],
    p[0] * b.up[0] + p[1] * b.up[1] + p[2] * b.up[2],
  ];
}

/** Outline of a rounded rectangle in the XZ plane, `steps` points per corner. */
export function roundedRect(w: number, d: number, r: number, steps = 6): [number, number][] {
  const pts: [number, number][] = [];
  const corners: [number, number, number][] = [
    [w / 2 - r, d / 2 - r, 0],
    [-w / 2 + r, d / 2 - r, Math.PI / 2],
    [-w / 2 + r, -d / 2 + r, Math.PI],
    [w / 2 - r, -d / 2 + r, (3 * Math.PI) / 2],
  ];
  for (const [cx, cz, start] of corners) {
    for (let i = 0; i <= steps; i++) {
      const t = start + (i / steps) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(t), cz + r * Math.sin(t)]);
    }
  }
  return pts;
}

/** Andrew's monotone chain: the silhouette of a set of projected points. */
export function hull(points: [number, number][]): [number, number][] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
    lower.push(pt);
  }
  const upper: [number, number][] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const pt = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop();
    upper.push(pt);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}
