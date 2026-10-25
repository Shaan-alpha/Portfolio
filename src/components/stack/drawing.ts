import {
  AZIMUTH,
  CUBE,
  ELEVATION,
  MODEL_SLOT,
  PLATE_D,
  PLATE_H,
  PLATE_R,
  PLATE_W,
  VIEW_H,
  VIEW_MIN_W,
  basis,
  hull,
  project,
  roundedRect,
  slotY,
  type Vec3,
} from "./geometry";

/** SVG path data for the flat drawing of the stack, projected with the same
 *  camera as the WebGL scene. Used by the in-page drawing and the social card. */
const b = basis(AZIMUTH, ELEVATION);
const d = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x.toFixed(3)} ${(-y).toFixed(3)}`).join("L")}Z`;

function slab(slot: number) {
  const y = slotY(slot);
  const rim = roundedRect(PLATE_W, PLATE_D, PLATE_R, 4);
  const top = rim.map(([x, z]) => project([x, y + PLATE_H / 2, z], b));
  const bottom = rim.map(([x, z]) => project([x, y - PLATE_H / 2, z], b));
  const panel = roundedRect(PLATE_W - 0.26, PLATE_D - 0.26, 0.12, 4).map(([x, z]) => project([x, y + PLATE_H / 2, z], b));
  return { slot, body: d(hull([...top, ...bottom])), top: d(top), panel: d(panel) };
}

function block() {
  const c = CUBE / 2;
  const y = slotY(MODEL_SLOT);
  const face = (pts: Vec3[]) => d(pts.map((p) => project(p, b)));
  // At this azimuth the camera sees the top, the +z face and the +x face.
  return {
    top: face([
      [c, y + c, c],
      [-c, y + c, c],
      [-c, y + c, -c],
      [c, y + c, -c],
    ]),
    front: face([
      [c, y - c, c],
      [c, y + c, c],
      [-c, y + c, c],
      [-c, y - c, c],
    ]),
    side: face([
      [c, y - c, -c],
      [c, y + c, -c],
      [c, y + c, c],
      [c, y - c, c],
    ]),
  };
}

// Painter's order: the camera looks down, so lower parts are drawn first.
export const drawing = {
  viewBox: `${-VIEW_MIN_W / 2} ${-VIEW_H / 2} ${VIEW_MIN_W} ${VIEW_H}`,
  plates: [4, 2, 1, 0].map(slab),
  model: block(),
};
