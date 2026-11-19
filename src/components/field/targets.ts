/** Scene targets: one per dot, built from the same geometry the page draws.
 *
 *  The order inside the arrays is the dot-matching contract: model dots
 *  first, then system dots from the top down, then dust. Dot `i` keeps its
 *  index from scene to scene, so yellow dots travel to yellow parts and upper
 *  parts to upper parts, and a morph reads as one structure re-forming. */
import type { StepKind } from "../../content/projects.ts";
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
  basis,
  project,
  slotY,
} from "../stack/geometry.ts";

/** 0 dust, 1 system, 2 model (the only yellow). */
export type Kind = 0 | 1 | 2;

/** `to` is in the target frame: local stack units for `frame: "stack"`,
 *  viewport pixels for `frame: "screen"`. `flow` holds an edge vector and a
 *  phase per dot (a zero vector sits still). `group` names the part a dot
 *  belongs to, for highlights; -1 is none. */
export type Targets = {
  n: number;
  to: Float32Array;
  kind: Uint8Array;
  delay: Float32Array;
  flow: Float32Array;
  group: Int16Array;
  frame: "stack" | "screen";
};

export type Rect = { x: number; y: number; w: number; h: number };

/** mulberry32: small, fast and deterministic for a seed. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Builder = { put(x: number, y: number, z: number, kind: Kind, delay: number, group: number, flow?: [number, number, number, number]): void; done(): Targets };

function builder(n: number, frame: Targets["frame"]): Builder {
  const t: Targets = {
    n,
    to: new Float32Array(3 * n),
    kind: new Uint8Array(n),
    delay: new Float32Array(n),
    flow: new Float32Array(4 * n),
    group: new Int16Array(n).fill(-1),
    frame,
  };
  let i = 0;
  return {
    put(x, y, z, kind, delay, group, flow) {
      if (i >= n) return;
      t.to[3 * i] = x;
      t.to[3 * i + 1] = y;
      t.to[3 * i + 2] = z;
      t.kind[i] = kind;
      t.delay[i] = delay;
      t.group[i] = group;
      if (flow) t.flow.set(flow, 4 * i);
      i++;
    },
    done() {
      if (i !== n) throw new Error(`targets: filled ${i} of ${n}`);
      return t;
    },
  };
}

/** Split `total` into `parts` near-equal whole counts. */
function split(total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  return Array.from({ length: parts }, (_, k) => base + (k < total - base * parts ? 1 : 0));
}

// ── The stack ────────────────────────────────────────────────────────────

const PLATE_SLOTS = [0, 1, 2, 4];
const PLATE_SHARE = 0.62;
const CUBE_SHARE = 0.14;
const RIM_SHARE = 0.3;

function insideRoundedRect(x: number, z: number): boolean {
  const ax = Math.abs(x) - (PLATE_W / 2 - PLATE_R);
  const az = Math.abs(z) - (PLATE_D / 2 - PLATE_R);
  if (ax <= 0 || az <= 0) return true;
  return ax * ax + az * az <= PLATE_R * PLATE_R;
}

/** Delay rises with the slot, so the stack builds from the top down. */
const slotDelay = (slot: number, random: () => number) => (slot / 4) * 0.85 + random() * 0.15;

/** The hero: the October stack in dots. Four plates and, in slot 3, the cube
 *  that is the model, in the drawing's local units, with dust in a shell
 *  around it. */
export function stackTargets(n: number, random: () => number): Targets {
  const b = builder(n, "stack");
  const cubeN = Math.round(n * CUBE_SHARE);
  const plateN = Math.round(n * PLATE_SHARE);

  const c = CUBE / 2;
  const cy = slotY(MODEL_SLOT);
  for (let k = 0; k < cubeN; k++) {
    const face = Math.floor(random() * 6);
    const u = (random() * 2 - 1) * c;
    const v = (random() * 2 - 1) * c;
    const s = face % 2 ? c : -c;
    const axis = face >> 1;
    const p = axis === 0 ? [s, u, v] : axis === 1 ? [u, s, v] : [u, v, s];
    b.put(p[0], cy + p[1], p[2], 2, slotDelay(MODEL_SLOT, random), MODEL_SLOT);
  }

  split(plateN, PLATE_SLOTS.length).forEach((count, k) => {
    const slot = PLATE_SLOTS[k];
    const y = slotY(slot);
    const rim = Math.round(count * RIM_SHARE);
    for (let m = 0; m < count; m++) {
      if (m < rim) {
        // The slab's edge: a point on the outline, anywhere in its thickness.
        const per = 2 * (PLATE_W + PLATE_D);
        let d = random() * per;
        let x: number;
        let z: number;
        if (d < PLATE_W) [x, z] = [d - PLATE_W / 2, PLATE_D / 2];
        else if ((d -= PLATE_W) < PLATE_D) [x, z] = [PLATE_W / 2, PLATE_D / 2 - d];
        else if ((d -= PLATE_D) < PLATE_W) [x, z] = [PLATE_W / 2 - d, -PLATE_D / 2];
        else [x, z] = [-PLATE_W / 2, (d - PLATE_W) - PLATE_D / 2];
        b.put(x, y + (random() - 0.5) * PLATE_H, z, 1, slotDelay(slot, random), slot);
      } else {
        let x = 0;
        let z = 0;
        do {
          x = (random() - 0.5) * PLATE_W;
          z = (random() - 0.5) * PLATE_D;
        } while (!insideRoundedRect(x, z));
        b.put(x, y + PLATE_H / 2, z, 1, slotDelay(slot, random), slot);
      }
    }
  });

  for (let k = cubeN + plateN; k < n; k++) {
    const zz = random() * 2 - 1;
    const th = random() * Math.PI * 2;
    const r = 2.6 + random() * 1.4;
    const ring = Math.sqrt(1 - zz * zz);
    b.put(r * ring * Math.cos(th), r * zz, r * ring * Math.sin(th), 0, random(), -1);
  }
  return b.done();
}

/** Where each slot's label sits beside the drawing: the slot centre's
 *  distance from the top of the viewBox, as a percentage of its height. The
 *  stack turns about its vertical axis, which never moves a slot's centre. */
export function slotLabelTops(): number[] {
  const b = basis(AZIMUTH, ELEVATION);
  return [0, 1, 2, 3, 4].map((slot) => ((VIEW_H / 2 - project([0, slotY(slot), 0], b)[1]) / VIEW_H) * 100);
}

// ── Flows ────────────────────────────────────────────────────────────────

/** A step's centre in viewport pixels. `grid` is the thesis's deterministic
 *  scoring, drawn as a lattice. */
export type FlowNode = { x: number; y: number; kind: StepKind | "grid" };
export type FlowInput = { nodes: FlowNode[]; radius: number };

const NODE_SHARE = 0.5;
const EDGE_SHARE = 0.22;

/** One dot on a step's shape, centred on (cx, cy) with radius r. */
function shapePoint(kind: FlowNode["kind"], cx: number, cy: number, r: number, k: number, random: () => number): [number, number] {
  const ring = (radius: number, width: number): [number, number] => {
    const a = random() * Math.PI * 2;
    const rr = radius + (random() - 0.5) * width;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  const disc = (radius: number): [number, number] => {
    const a = random() * Math.PI * 2;
    const rr = radius * Math.sqrt(random());
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  switch (kind) {
    case "io":
      return ring(r, r * 0.12);
    case "step":
      return disc(r * 0.75);
    case "human":
      return random() < 0.6 ? ring(r, r * 0.1) : disc(r * 0.28);
    case "guard": {
      // Two posts the stream passes between.
      const side = random() < 0.5 ? -1 : 1;
      return [cx + side * r * 0.55 + (random() - 0.5) * r * 0.18, cy + (random() * 2 - 1) * r];
    }
    case "grid": {
      // A 10×10 lattice: every dot on a lattice point.
      const cell = k % 100;
      const step = (1.6 * r) / 9;
      return [cx + ((cell % 10) - 4.5) * step, cy + (Math.floor(cell / 10) - 4.5) * step];
    }
    case "model": {
      // An isometric cube: the top and the two faces towards the viewer.
      const a = r * 0.575;
      const u = (random() * 2 - 1) * a;
      const v = (random() * 2 - 1) * a;
      const face = Math.floor(random() * 3);
      const [X, Y, Z] = face === 0 ? [u, a, v] : face === 1 ? [a, u, v] : [u, v, a];
      return [cx + (X - Z) * 0.866, cy + (X + Z) * 0.5 - Y];
    }
  }
}

function inside(rects: Rect[], x: number, y: number): boolean {
  return rects.some((m) => x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h);
}

/** Flows drawn top to bottom: every step as a shape by its kind, dots
 *  streaming down each edge, and dust everywhere the text is not. */
export function flowTargets(n: number, flows: FlowInput[], viewport: { w: number; h: number }, mask: Rect[], random: () => number): Targets {
  const b = builder(n, "screen");
  type Placed = FlowNode & { r: number; delay: number; group: number };
  const nodes: Placed[] = [];
  const edges: { a: Placed; b: Placed }[] = [];
  for (const f of flows) {
    f.nodes.forEach((node, k) => {
      const placed = { ...node, r: f.radius, delay: k / Math.max(1, f.nodes.length - 1), group: nodes.length };
      if (k > 0) edges.push({ a: nodes[nodes.length - 1], b: placed });
      nodes.push(placed);
    });
  }

  const nodeN = nodes.length ? Math.round(n * NODE_SHARE) : 0;
  const edgeN = edges.length ? Math.round(n * EDGE_SHARE) : 0;
  const perNode = split(nodeN, Math.max(1, nodes.length));
  const jitter = (d: number) => d * 0.85 + random() * 0.15;

  // Model steps first, then the rest from the top down.
  const order = nodes.map((node, k) => ({ node, count: perNode[k] }));
  order.sort((p, q) => Number(q.node.kind === "model") - Number(p.node.kind === "model") || p.node.y - q.node.y);
  for (const { node, count } of order) {
    for (let k = 0; k < count; k++) {
      const [x, y] = shapePoint(node.kind, node.x, node.y, node.r, k, random);
      b.put(x, y, 0, node.kind === "model" ? 2 : 1, jitter(node.delay), node.group);
    }
  }

  // Each edge runs from just outside one step to just outside the next.
  const sorted = [...edges].sort((p, q) => p.a.y - q.a.y);
  split(edgeN, Math.max(1, sorted.length)).forEach((count, k) => {
    const e = sorted[k];
    if (!e) return;
    const dx = e.b.x - e.a.x;
    const dy = e.b.y - e.a.y;
    const len = Math.hypot(dx, dy) || 1;
    const [ux, uy] = [dx / len, dy / len];
    const gapA = e.a.r * 1.25;
    const gapB = e.b.r * 1.25;
    const span = Math.max(0, len - gapA - gapB);
    for (let m = 0; m < count; m++) {
      const side = (random() - 0.5) * 1.6;
      const sx = e.a.x + ux * gapA - uy * side;
      const sy = e.a.y + uy * gapA + ux * side;
      b.put(sx, sy, 0, 1, jitter(e.a.delay), -1, [ux * span, uy * span, 0, random()]);
    }
  });

  for (let k = nodeN + edgeN; k < n; k++) {
    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 64; tries++) {
      x = random() * viewport.w;
      y = random() * viewport.h;
      if (!inside(mask, x, y)) break;
    }
    if (inside(mask, x, y)) x = viewport.w - random() * viewport.w * 0.1;
    b.put(x, y, 0, 0, random(), -1);
  }
  return b.done();
}
