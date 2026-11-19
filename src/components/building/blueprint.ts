import type { LayerId } from "@/content/stack";

// The building, as data. Every part is a box or a cylinder with a centre and
// a size, grouped by owner, material and shape so the scene can draw each
// group as one instanced mesh. Pure and deterministic, so the design rules
// (level order, the model alone in the atrium, yellow used once, the triangle
// budgets) are unit-tested in blueprint.test.mts.
//
// Units: one storey is about 1.3 units, so a person is about half a unit.
// The plinth top is the ground, y = 0. The basement sits in a pit in the
// plinth; the building stands on it.

export type Vec3 = [number, number, number];
/** A box, or a cylinder along `axis` (default y). `size` is the extent along
 *  x, y and z before the turn `rotY` about the vertical axis. */
export type Part = { center: Vec3; size: Vec3; rotY?: number; axis?: "x" | "y" | "z" };
export type MaterialId = "card" | "aluminium" | "acrylic" | "model" | "light";
export type Owner = LayerId | "frame" | "plinth";
/** `cut` marks a cut-away façade group and points the way it slides off. */
export type PartGroup = { id: string; owner: Owner; material: MaterialId; shape: "box" | "cylinder"; parts: Part[]; cut?: Vec3 };
export type Detail = "high" | "low";
export type StoreyId = Exclude<LayerId, "model">;
export type Blueprint = {
  groups: PartGroup[];
  /** Each level's floor height (the top of its slab), bottom to top. */
  levels: { id: StoreyId; y: number }[];
  /** Each level's band, from its floor to the slab above. */
  storeys: { id: StoreyId; y0: number; y1: number }[];
  atrium: { center: Vec3; size: Vec3 };
  model: Part;
  bounds: { min: Vec3; max: Vec3 };
  /** The bounding sphere the camera frames. */
  center: Vec3;
  radius: number;
  /** The plinth's front face, where the line is engraved. */
  plinthFront: { center: Vec3; size: Vec3 };
};

export const CYLINDER_SEGMENTS = 12;

// ── Dimensions ─────────────────────────────────────────────────────────────
const X0 = -4;
const X1 = 4;
const Z0 = -2.5;
const Z1 = 2.5;
const SLAB = 0.12;
const FLOOR: Record<StoreyId, number> = { state: -1.35, interfaces: 0, guards: 1.3, orchestration: 2.9 };
const ROOF = 4.2;
const ORDER: StoreyId[] = ["state", "interfaces", "guards", "orchestration"];
const CEILING: Record<StoreyId, number> = {
  state: FLOOR.interfaces - SLAB,
  interfaces: FLOOR.guards - SLAB,
  guards: FLOOR.orchestration - SLAB,
  orchestration: ROOF - SLAB,
};

// The atrium: a void through the plant floor and the roof, over the security
// hall. The model hangs in it with no floor of its own.
const ATRIUM = { x: 1.3, z: 0.95, y0: 1.55, y1: 4.3 };
const MODEL: Part = { center: [0, 2.2, 0], size: [1.1, 1.1, 1.1] };

const PLINTH = { x: 5.5, z: 3.75, y0: -1.6, pitX: 4.2, pitZ: 2.7, floor: -1.47 };
const BOUNDS: { min: Vec3; max: Vec3 } = { min: [-PLINTH.x, PLINTH.y0, -PLINTH.z], max: [PLINTH.x, 4.8, PLINTH.z] };

const COLS_X = [-3.8, -2.28, -0.76, 0.76, 2.28, 3.8];
const COLS_Z = [-2.3, -1.15, 0, 1.15, 2.3];
const CORE = { x0: 2.4, x1: 3.7, z0: -2.2, z1: -1.3 };

// ── Helpers ────────────────────────────────────────────────────────────────
/** Deterministic PRNG (mulberry32), so the same blueprint every time. */
function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A box from its min and max corners. */
const span = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Part => ({
  center: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
  size: [x1 - x0, y1 - y0, z1 - z0],
});

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const tidy = (p: Part): Part => ({ ...p, center: p.center.map(r3) as Vec3, size: p.size.map(r3) as Vec3 });

function inAtrium(p: Part): boolean {
  const half = [p.size[0] / 2, p.size[1] / 2, p.size[2] / 2];
  const c = Math.abs(Math.cos(p.rotY ?? 0));
  const s = Math.abs(Math.sin(p.rotY ?? 0));
  const hx = c * half[0] + s * half[2];
  const hz = s * half[0] + c * half[2];
  return (
    p.center[0] + hx > -ATRIUM.x &&
    p.center[0] - hx < ATRIUM.x &&
    p.center[2] + hz > -ATRIUM.z &&
    p.center[2] - hz < ATRIUM.z &&
    p.center[1] + half[1] > ATRIUM.y0 &&
    p.center[1] - half[1] < ATRIUM.y1
  );
}

class Collector {
  private groups = new Map<string, PartGroup>();
  add(owner: Owner, material: MaterialId, shape: "box" | "cylinder", part: Part, cut?: Vec3) {
    // Nothing but the model may enter the atrium; parts laid out on a grid
    // are dropped here rather than special-cased at every call site.
    if (material !== "model" && inAtrium(part)) return;
    const side = cut ? (cut[0] ? "-cut-x" : "-cut-z") : "";
    const id = `${owner}-${material}-${shape}${side}`;
    let g = this.groups.get(id);
    if (!g) {
      g = { id, owner, material, shape, parts: [], ...(cut ? { cut } : {}) };
      this.groups.set(id, g);
    }
    g.parts.push(tidy(part));
  }
  list(): PartGroup[] {
    return [...this.groups.values()];
  }
}

/** A standing scale figure: a body and a head, both cylinders. */
function figure(c: Collector, owner: Owner, x: number, floor: number, z: number) {
  c.add(owner, "card", "cylinder", { center: [x, floor + 0.21, z], size: [0.13, 0.42, 0.13] });
  c.add(owner, "card", "cylinder", { center: [x, floor + 0.47, z], size: [0.09, 0.1, 0.09] });
}

/** Scatter n figures in a rectangle, keeping clear of the given boxes. */
function crowd(c: Collector, rand: () => number, owner: Owner, n: number, floor: number, area: [number, number, number, number], avoid: [number, number, number, number][] = []) {
  let placed = 0;
  for (let tries = 0; placed < n && tries < n * 40; tries++) {
    const x = area[0] + rand() * (area[2] - area[0]);
    const z = area[1] + rand() * (area[3] - area[1]);
    if (avoid.some(([ax0, az0, ax1, az1]) => x > ax0 - 0.15 && x < ax1 + 0.15 && z > az0 - 0.15 && z < az1 + 0.15)) continue;
    // Keep standing figures out of the atrium's footprint on every floor it
    // spans, with a little room so the filter in add() never trims a head.
    if (floor + 0.55 > ATRIUM.y0 && Math.abs(x) < ATRIUM.x + 0.12 && Math.abs(z) < ATRIUM.z + 0.12) continue;
    figure(c, owner, x, floor, z);
    placed++;
  }
}

// ── The building ───────────────────────────────────────────────────────────
export function buildBlueprint(detail: Detail): Blueprint {
  const high = detail === "high";
  const rand = prng(20261119);
  const c = new Collector();

  // Plinth: an aluminium block with a pit for the basement. Its right side is
  // a cut-away that slides off in act II to show the vault in section.
  const P = PLINTH;
  c.add("plinth", "aluminium", "box", span(-P.x, P.y0, -P.z, P.x, P.floor, P.z));
  c.add("plinth", "aluminium", "box", span(-P.x, P.floor, -P.z, P.x, -0.05, -P.pitZ));
  c.add("plinth", "aluminium", "box", span(-P.x, P.floor, P.pitZ, P.x, -0.05, P.z));
  c.add("plinth", "aluminium", "box", span(-P.x, P.floor, -P.pitZ, -P.pitX, -0.05, P.pitZ));
  c.add("plinth", "aluminium", "box", span(P.pitX, P.floor, -P.pitZ, P.x, -0.05, P.pitZ), [1, 0, 0]);
  // The ground: white card on the plinth's rim.
  c.add("plinth", "card", "box", span(-P.x, -0.05, -P.z, P.x, 0, -P.pitZ));
  c.add("plinth", "card", "box", span(-P.x, -0.05, P.pitZ, P.x, 0, P.z));
  c.add("plinth", "card", "box", span(-P.x, -0.05, -P.pitZ, -P.pitX, 0, P.pitZ));
  c.add("plinth", "card", "box", span(P.pitX, -0.05, -P.pitZ, P.x, 0, P.pitZ), [1, 0, 0]);

  // Slabs. The basement floor fills the pit; the ground floor leaves a light
  // well round it; the plant floor and the roof are cut for the atrium.
  c.add("state", "card", "box", span(-P.pitX, P.floor, -P.pitZ, P.pitX, FLOOR.state, P.pitZ));
  c.add("interfaces", "card", "box", span(X0, -SLAB, Z0, X1, 0, Z1));
  c.add("guards", "card", "box", span(X0, FLOOR.guards - SLAB, Z0, X1, FLOOR.guards, Z1));
  for (const [owner, top] of [["orchestration", FLOOR.orchestration], ["orchestration", ROOF]] as const) {
    const y0 = top - SLAB;
    c.add(owner, "card", "box", span(X0, y0, Z0, X1, top, -ATRIUM.z));
    c.add(owner, "card", "box", span(X0, y0, ATRIUM.z, X1, top, Z1));
    c.add(owner, "card", "box", span(X0, y0, -ATRIUM.z, -ATRIUM.x, top, ATRIUM.z));
    c.add(owner, "card", "box", span(ATRIUM.x, y0, -ATRIUM.z, X1, top, ATRIUM.z));
  }
  // Aluminium slab edges, the thin bright line a model maker glues on.
  for (const [owner, top] of [["interfaces", 0], ["guards", FLOOR.guards], ["orchestration", FLOOR.orchestration], ["orchestration", ROOF]] as const) {
    const y0 = top - SLAB;
    c.add(owner, "aluminium", "box", span(X0, y0, Z1, X1, top, Z1 + 0.02));
    c.add(owner, "aluminium", "box", span(X0, y0, Z0 - 0.02, X1, top, Z0));
    c.add(owner, "aluminium", "box", span(X1, y0, Z0, X1 + 0.02, top, Z1));
    c.add(owner, "aluminium", "box", span(X0 - 0.02, y0, Z0, X0, top, Z1));
  }

  for (const id of ORDER) {
    const floor = FLOOR[id];
    const ceil = CEILING[id];
    const h = ceil - floor;

    // Columns on the grid, and the beams between them under the slab above.
    for (const x of COLS_X) for (const z of COLS_Z) c.add(id, "aluminium", "cylinder", { center: [x, floor + h / 2, z], size: [0.12, h, 0.12] });
    const by0 = ceil - 0.08;
    for (const z of COLS_Z) for (let i = 0; i < COLS_X.length - 1; i++) c.add(id, "card", "box", span(COLS_X[i], by0, z - 0.04, COLS_X[i + 1], ceil, z + 0.04));
    for (const x of COLS_X) for (let i = 0; i < COLS_Z.length - 1; i++) c.add(id, "card", "box", span(x - 0.04, by0, COLS_Z[i], x + 0.04, ceil, COLS_Z[i + 1]));

    // The stair and lift core, one storey at a time so it separates with its
    // level: three walls and a flight of eight steps.
    c.add(id, "card", "box", span(CORE.x0, floor, CORE.z0, CORE.x0 + 0.04, ceil, CORE.z1));
    c.add(id, "card", "box", span(CORE.x1 - 0.04, floor, CORE.z0, CORE.x1, ceil, CORE.z1));
    c.add(id, "card", "box", span(CORE.x0, floor, CORE.z0, CORE.x1, ceil, CORE.z0 + 0.04));
    for (let i = 0; i < 8; i++) {
      const y = floor + ((i + 1) * h) / 8;
      c.add(id, "card", "box", span(CORE.x0 + 0.1 + i * 0.1, y - 0.04, CORE.z0 + 0.1, CORE.x0 + 0.2 + i * 0.1, y, CORE.z0 + 0.5));
    }

    if (id === "state") continue;

    // Glazed façades on the back (−z) and the left (−x): mullions, a transom
    // and acrylic panes.
    const step = high ? 0.4 : 0.8;
    for (const [axis, from, to, at] of [["x", X0, X1, Z0], ["z", Z0, Z1, X0]] as const) {
      const n = Math.round((to - from) / step);
      const d = (to - from) / n;
      for (let k = 0; k <= n; k++) {
        const u = from + k * d;
        c.add(id, "aluminium", "box", axis === "x" ? span(u - 0.015, floor, at - 0.03, u + 0.015, ceil, at + 0.03) : span(at - 0.03, floor, u - 0.015, at + 0.03, ceil, u + 0.015));
        if (k < n) {
          const a = u + 0.015;
          const b = u + d - 0.015;
          c.add(id, "acrylic", "box", axis === "x" ? span(a, floor, at - 0.01, b, ceil, at + 0.01) : span(at - 0.01, floor, a, at + 0.01, ceil, b));
        }
      }
      const ty = floor + h * 0.62;
      c.add(id, "aluminium", "box", axis === "x" ? span(from, ty - 0.015, at - 0.035, to, ty + 0.015, at + 0.035) : span(at - 0.035, ty - 0.015, from, at + 0.035, ty + 0.015, to));
    }

    // Cut-away façades on the front (+z) and the right (+x): vertical card
    // fins that slide off in act II. The ground floor leaves the entrance open.
    const fin = high ? 0.3 : 0.6;
    for (let x = X0 + fin / 2; x < X1; x += fin) {
      if (id === "interfaces" && Math.abs(x) < 0.75) continue;
      c.add(id, "card", "box", span(x - 0.025, floor, Z1, x + 0.025, ceil, Z1 + 0.24), [0, 0, 1]);
    }
    for (let z = Z0 + fin / 2; z < Z1; z += fin) c.add(id, "card", "box", span(X1, floor, z - 0.025, X1 + 0.24, ceil, z + 0.025), [1, 0, 0]);
  }

  // Level B, memory and state: a vault of racks with status lights, archive
  // cabinets along the back wall, and two people working.
  const rowZ = [-1.0, 0.0, 1.0, 1.9];
  const rackStep = high ? 0.55 : 1.1;
  for (const z of rowZ) {
    for (let x = -3.3; x <= 3.31; x += rackStep) {
      if (x > CORE.x0 - 0.3 && z < CORE.z1 + 0.3) continue;
      c.add("state", "aluminium", "box", span(x - 0.2, FLOOR.state, z - 0.15, x + 0.2, FLOOR.state + 0.85, z + 0.15));
      if (!high) continue;
      for (let k = 0; k < 4; k++) {
        if (rand() < 0.45) continue;
        const y = FLOOR.state + 0.2 + k * 0.17;
        c.add("state", "light", "box", span(x - 0.13 + (k % 2) * 0.2, y, z + 0.15, x - 0.1 + (k % 2) * 0.2, y + 0.03, z + 0.155));
      }
    }
    if (high) c.add("state", "aluminium", "box", span(-3.5, FLOOR.state + 1.02, z - 0.08, 3.5, FLOOR.state + 1.04, z + 0.08));
  }
  for (let i = 0; i < 6; i++) c.add("state", "card", "box", span(-3.9 + i * 0.5, FLOOR.state, -2.45, -3.5 + i * 0.5, FLOOR.state + 0.55, -2.15));
  if (high) crowd(c, rand, "state", 2, FLOOR.state, [-3.5, -0.6, 2.0, -0.4]);

  // Level 0, interfaces: the lobby, the street entrance with its canopy, a
  // reception desk, benches and planters, and people arriving from the street.
  c.add("interfaces", "card", "box", span(-2.4, 0, 0.7, -1.2, 0.32, 1.05));
  for (const [x, z] of [[1.6, 1.2], [2.4, 1.2], [1.6, -0.2], [2.4, -0.2]]) c.add("interfaces", "card", "box", span(x - 0.3, 0, z - 0.09, x + 0.3, 0.13, z + 0.09));
  c.add("interfaces", "aluminium", "box", span(-0.85, 1.0, Z1, 0.85, 1.04, Z1 + 0.5));
  for (const x of [-0.8, 0.8]) c.add("interfaces", "aluminium", "box", span(x - 0.025, 0, Z1, x + 0.025, 1.0, Z1 + 0.05));
  if (high) {
    for (const [x, z] of [[-3.4, 2.0], [-3.4, -1.9], [0.0, -2.0]]) c.add("interfaces", "card", "cylinder", { center: [x, 0.16, z], size: [0.3, 0.32, 0.3] });
    crowd(c, rand, "interfaces", 9, 0, [-3.6, -2.2, 2.2, 2.2], [[-2.4, 0.7, -1.2, 1.05], [1.3, -0.3, 2.7, 1.3]]);
  }

  // Level 1, guards: the security hall. Two lines of checkpoint gates, queue
  // partitions, and the approval desk where a person signs off.
  for (const z of [1.55, -1.55]) {
    for (let i = 0; i < 7; i++) {
      const x = -3.0 + i * 0.85;
      if (x > CORE.x0 - 0.2 && z < 0) continue;
      for (const dx of [-0.24, 0.24]) c.add("guards", "aluminium", "box", span(x + dx - 0.03, FLOOR.guards, z - 0.25, x + dx + 0.03, FLOOR.guards + 0.38, z + 0.25));
      c.add("guards", "acrylic", "box", span(x - 0.21, FLOOR.guards + 0.2, z - 0.02, x + 0.21, FLOOR.guards + 0.26, z + 0.02));
    }
    for (let i = 0; i < 4; i++) {
      const x = -2.6 + i * 1.7;
      c.add("guards", "card", "box", span(x - 0.015, FLOOR.guards, z + (z > 0 ? 0.35 : -0.95), x + 0.015, FLOOR.guards + 0.3, z + (z > 0 ? 0.95 : -0.35)));
    }
  }
  c.add("guards", "card", "box", span(2.25, FLOOR.guards, -0.05, 3.15, FLOOR.guards + 0.3, 0.3));
  figure(c, "guards", 2.7, FLOOR.guards, -0.35);
  if (high) crowd(c, rand, "guards", 6, FLOOR.guards, [-3.6, 1.9, 3.6, 2.35]);

  // Level 2, orchestration: the plant floor. Ducts and risers, cable trays, a
  // conveyor carrying work across, plant units, and railings at the atrium.
  const plant = FLOOR.orchestration;
  for (const z of [1.65, -1.65]) c.add("orchestration", "aluminium", "cylinder", { center: [0, plant + 0.95, z], size: [7.4, 0.24, 0.24], axis: "x" });
  for (const x of [-3.5, 3.5]) {
    if (x > 0) c.add("orchestration", "aluminium", "cylinder", { center: [x, plant + 0.95, 1.65 - 0.9], size: [0.24, 0.24, 1.8], axis: "z" });
    else c.add("orchestration", "aluminium", "cylinder", { center: [x, plant + 0.95, 0], size: [0.24, 0.24, 3.3], axis: "z" });
    for (const z of [1.65, -1.65]) c.add("orchestration", "aluminium", "cylinder", { center: [x, plant + 0.48, z], size: [0.2, 0.96, 0.2] });
  }
  for (const z of [1.25, -1.25]) {
    for (let i = 0; i < (high ? 8 : 4); i++) {
      const len = high ? 0.85 : 1.7;
      const x = -3.6 + i * (len + 0.05);
      c.add("orchestration", "aluminium", "box", span(x, plant + 1.06, z - 0.09, x + len, plant + 1.08, z + 0.09));
    }
  }
  // Two conveyors carrying work across. The front one stops short of the
  // atrium, so it never stands between the camera and the model.
  for (const [z, x1] of [[2.05, -1.6], [-2.0, 2.0]] as const) {
    c.add("orchestration", "card", "box", span(-3.3, plant + 0.3, z - 0.15, x1, plant + 0.36, z + 0.15));
    for (let x = -3.1; x <= x1 - 0.1; x += 1.0) c.add("orchestration", "card", "box", span(x - 0.03, plant, z - 0.12, x + 0.03, plant + 0.3, z + 0.12));
    if (high) for (let x = -3.2; x <= x1 - 0.05; x += 0.2) c.add("orchestration", "aluminium", "cylinder", { center: [x, plant + 0.385, z], size: [0.05, 0.05, 0.3], axis: "z" });
    const parcels = Math.max(2, Math.round((x1 + 3.3) / 0.75));
    for (let i = 0; i < parcels; i++) {
      const x = -3.0 + i * 0.7 + rand() * 0.25;
      if (x + 0.09 > x1) break;
      c.add("orchestration", "card", "box", span(x - 0.09, plant + 0.41, z - 0.09, x + 0.09, plant + 0.59, z + 0.09));
    }
  }
  for (const [x, z] of [[-2.9, 0.4], [-2.9, -0.4], [2.7, 0.45], [3.5, 0.45]]) c.add("orchestration", "card", "box", span(x - 0.3, plant, z - 0.25, x + 0.3, plant + 0.5, z + 0.25));
  if (high) {
    // Railing posts round the atrium, just outside its edge, and a top rail.
    const ox = ATRIUM.x + 0.03;
    const oz = ATRIUM.z + 0.03;
    for (let x = -ox; x <= ox + 1e-6; x += (2 * ox) / 13) for (const z of [-oz, oz]) c.add("orchestration", "aluminium", "box", span(x - 0.01, plant, z - 0.01 * Math.sign(z) - 0.01, x + 0.01, plant + 0.3, z - 0.01 * Math.sign(z) + 0.01));
    for (let z = -oz; z <= oz + 1e-6; z += (2 * oz) / 9) for (const x of [-ox, ox]) c.add("orchestration", "aluminium", "box", span(x - 0.01, plant, z - 0.01, x + 0.01, plant + 0.3, z + 0.01));
    c.add("orchestration", "aluminium", "box", span(-ox - 0.015, plant + 0.3, oz - 0.015, ox + 0.015, plant + 0.32, oz + 0.015));
    c.add("orchestration", "aluminium", "box", span(-ox - 0.015, plant + 0.3, -oz - 0.015, ox + 0.015, plant + 0.32, -oz + 0.015));
    c.add("orchestration", "aluminium", "box", span(ox - 0.015, plant + 0.3, -oz, ox + 0.015, plant + 0.32, oz));
    c.add("orchestration", "aluminium", "box", span(-ox - 0.015, plant + 0.3, -oz, -ox + 0.015, plant + 0.32, oz));
    crowd(c, rand, "orchestration", 3, plant, [-2.4, -1.0, 2.0, 1.0]);
  }
  // The roof: a parapet and four plant units.
  c.add("orchestration", "card", "box", span(X0, ROOF, Z0, X1, ROOF + 0.12, Z0 + 0.04));
  c.add("orchestration", "card", "box", span(X0, ROOF, Z1 - 0.04, X1, ROOF + 0.12, Z1));
  c.add("orchestration", "card", "box", span(X0, ROOF, Z0, X0 + 0.04, ROOF + 0.12, Z1));
  c.add("orchestration", "card", "box", span(X1 - 0.04, ROOF, Z0, X1, ROOF + 0.12, Z1));
  for (const [x, z] of [[-2.8, 1.6], [-2.8, -1.6], [2.4, 1.6], [3.2, 1.6]]) c.add("orchestration", "aluminium", "box", span(x - 0.35, ROOF, z - 0.3, x + 0.35, ROOF + 0.3, z + 0.3));

  // The site: disc trees and people on the street in front.
  if (high) {
    for (const x of [-4.7, -3.2, -1.7, 1.7, 3.2, 4.7]) {
      c.add("frame", "aluminium", "cylinder", { center: [x, 0.2, 3.3], size: [0.05, 0.4, 0.05] });
      c.add("frame", "card", "cylinder", { center: [x, 0.46, 3.3], size: [0.5, 0.12, 0.5] });
    }
    crowd(c, rand, "frame", 6, 0, [-5.1, 2.95, 5.1, 3.6], [[-4.95, 3.05, -4.45, 3.55], [-3.45, 3.05, -2.95, 3.55], [-1.95, 3.05, -1.45, 3.55], [1.45, 3.05, 1.95, 3.55], [2.95, 3.05, 3.45, 3.55], [4.45, 3.05, 4.95, 3.55]]);
  }

  // The model: one yellow block in the atrium.
  c.add("model", "model", "box", MODEL);

  const center: Vec3 = BOUNDS.min.map((v, i) => r3((v + BOUNDS.max[i]) / 2)) as Vec3;
  const radius = r3(Math.hypot(...BOUNDS.max.map((v, i) => (v - BOUNDS.min[i]) / 2)));
  return {
    groups: c.list(),
    levels: ORDER.map((id) => ({ id, y: FLOOR[id] })),
    storeys: ORDER.map((id) => ({ id, y0: FLOOR[id], y1: id === "orchestration" ? ROOF + 0.12 : CEILING[id] + SLAB })),
    atrium: { center: [0, r3((ATRIUM.y0 + ATRIUM.y1) / 2), 0], size: [2 * ATRIUM.x, r3(ATRIUM.y1 - ATRIUM.y0), 2 * ATRIUM.z] },
    model: tidy(MODEL),
    bounds: BOUNDS,
    center,
    radius,
    plinthFront: { center: [0, r3((PLINTH.y0 - 0.05) / 2), PLINTH.z], size: [2 * PLINTH.x, r3(-0.05 - PLINTH.y0), 0] },
  };
}

/** Triangles the scene will draw for a blueprint. */
export function triangles(bp: Blueprint): number {
  return bp.groups.reduce((n, g) => n + g.parts.length * (g.shape === "box" ? 12 : 4 * CYLINDER_SEGMENTS), 0);
}
