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
import { MODE } from "./morph.ts";
import type { Behaviour, EdgeProgram, StepBehaviour } from "./behaviours.ts";

/** 0 dust, 1 system, 2 model (the only yellow), 3 the handoff's hairline. */
export type Kind = 0 | 1 | 2 | 3;

/** `to` is in the target frame: local stack units for `frame: "stack"`,
 *  viewport pixels for `frame: "screen"`. `flow` holds an edge vector and a
 *  phase per dot (a zero vector sits still). `loop` holds each dot's program:
 *  mode, rate in cycles per second and window (`morph.ts`). `wander` scales
 *  its drift. `group` names the part a dot belongs to, for highlights; -1 is
 *  none. `still` is the loop clock, in seconds, that a reduced-motion visitor
 *  sees. */
export type Targets = {
  n: number;
  to: Float32Array;
  kind: Uint8Array;
  delay: Float32Array;
  flow: Float32Array;
  loop: Float32Array;
  wander: Float32Array;
  group: Int16Array;
  still: number;
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

type Vec4 = [number, number, number, number];

type Builder = {
  put(x: number, y: number, z: number, kind: Kind, delay: number, group: number, flow?: Vec4, loop?: Vec4, wander?: number): void;
  done(): Targets;
};

function builder(n: number, frame: Targets["frame"]): Builder {
  const t: Targets = {
    n,
    to: new Float32Array(3 * n),
    kind: new Uint8Array(n),
    delay: new Float32Array(n),
    flow: new Float32Array(4 * n),
    loop: new Float32Array(4 * n),
    wander: new Float32Array(n).fill(1),
    group: new Int16Array(n).fill(-1),
    still: 0,
    frame,
  };
  let i = 0;
  return {
    put(x, y, z, kind, delay, group, flow, loop, wander = 1) {
      if (i >= n) return;
      t.to[3 * i] = x;
      t.to[3 * i + 1] = y;
      t.to[3 * i + 2] = z;
      t.kind[i] = kind;
      t.delay[i] = delay;
      t.group[i] = group;
      if (flow) t.flow.set(flow, 4 * i);
      if (loop) t.loop.set(loop, 4 * i);
      t.wander[i] = wander;
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

/** The same index blocks in every scene: model dots in the first block,
 *  system dots in the second, dust after. A scene that needs fewer fills the
 *  rest of a block with dust, so a dot only ever trades its part for its
 *  counterpart or for dust: yellow never turns grey, grey never turns yellow. */
function blocks(n: number) {
  const modelEnd = Math.round(n * CUBE_SHARE);
  return { modelEnd, systemEnd: modelEnd + Math.round(n * PLATE_SHARE) };
}

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
  const { modelEnd, systemEnd } = blocks(n);
  const cubeN = modelEnd;
  const plateN = systemEnd - modelEnd;

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
 *  scoring, drawn as a lattice. `step` is the step's label, which a system's
 *  behaviour is keyed by. */
export type FlowNode = { x: number; y: number; kind: StepKind | "grid"; step?: string };
export type FlowInput = { nodes: FlowNode[]; radius: number };

const NODE_SHARE = 0.5;
const EDGE_SHARE = 0.22;

/** Streams move at this many pixels a second, whatever an edge's length;
 *  edges shorter than `MIN_STREAM_SPAN` move as if they were that long. */
export const STREAM_PX_PER_S = 16;
const MIN_STREAM_SPAN = 24;
/** Dots in one packet. */
export const PACKET_DOTS = 14;
/** How far an exit runs past the last step of its flow. */
export const EXIT_PX = 56;
/** The 10×10 lattice is at least this wide, so its dots stay apart. */
const GRID_MIN_PX = 36;

/** One dot on a step's shape, centred on (cx, cy) with radius r. */
function shapePoint(kind: FlowNode["kind"], cx: number, cy: number, r: number, k: number, random: () => number): [number, number] {
  switch (kind) {
    case "io":
      return ringPoint(cx, cy, r, r * 0.12, random);
    case "step":
      return discPoint(cx, cy, r * 0.75, random);
    case "human":
      return random() < 0.6 ? ringPoint(cx, cy, r, r * 0.1, random) : discPoint(cx, cy, r * 0.28, random);
    case "guard": {
      // Two posts the stream passes between.
      const side = random() < 0.5 ? -1 : 1;
      return [cx + side * r * 0.55 + (random() - 0.5) * r * 0.18, cy + (random() * 2 - 1) * r];
    }
    case "grid": {
      // A 10×10 lattice: every dot on a lattice point.
      const cell = k % 100;
      const step = Math.max(1.6 * r, GRID_MIN_PX) / 9;
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

function ringPoint(cx: number, cy: number, radius: number, width: number, random: () => number): [number, number] {
  const a = random() * Math.PI * 2;
  const rr = radius + (random() - 0.5) * width;
  return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
}

function discPoint(cx: number, cy: number, radius: number, random: () => number): [number, number] {
  const a = random() * Math.PI * 2;
  const rr = radius * Math.sqrt(random());
  return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
}

/** `count` short posts on alternating sides of the stream, spaced evenly
 *  down the step: the stream passes every one of them. */
function postPoint(cx: number, cy: number, r: number, count: number, k: number, random: () => number): [number, number] {
  const post = k % count;
  const pitch = count > 1 ? (1.8 * r) / (count - 1) : 0;
  const side = post % 2 === 0 ? -1 : 1;
  return [cx + side * r * 0.55 + (random() - 0.5) * r * 0.18, cy + (post - (count - 1) / 2) * pitch + (random() - 0.5) * r * 0.28];
}

/** A point on a rectangle's outline, a hair either side of it. */
function boxPoint(box: Rect, random: () => number): [number, number] {
  const per = 2 * (box.w + box.h);
  let d = random() * per;
  const jitter = (random() - 0.5) * 1.2;
  if (d < box.w) return [box.x + d, box.y + jitter];
  if ((d -= box.w) < box.h) return [box.x + box.w + jitter, box.y + d];
  if ((d -= box.h) < box.w) return [box.x + box.w - d, box.y + box.h + jitter];
  return [box.x + jitter, box.y + box.h - (d - box.w)];
}

/** At most this many dots on a step, so a shape still reads as dots rather
 *  than a smudge: a share of its outline or area. The rest go to the dust. */
function capFor(kind: FlowNode["kind"], r: number): number {
  const ring = 2 * Math.PI * r * 0.9;
  const cap =
    kind === "io"
      ? ring
      : kind === "human"
        ? ring + Math.PI * (0.28 * r) ** 2 * 0.5
        : kind === "step"
          ? Math.PI * (0.75 * r) ** 2 * 0.22
          : kind === "guard"
            ? 0.72 * r * r * 0.35
            : kind === "grid"
              ? 200
              : 2.598 * (1.15 * r) ** 2 * 0.18;
  return Math.max(24, Math.round(cap));
}

/** Dots per pixel along a streaming edge, and along a box's outline. */
const EDGE_DENSITY = 0.45;
const BOX_DENSITY = 0.5;

function inside(rects: Rect[], x: number, y: number): boolean {
  return rects.some((m) => x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h);
}

/** Edges reach a guard's centre, so a stream visibly passes between its
 *  posts; they stop short of every other step. */
const gapOf = (node: { kind: FlowNode["kind"]; r: number }) => (node.kind === "guard" ? 0 : node.r * 1.25);

const STREAM: EdgeProgram[] = [{ kind: "stream" }];

/** Flows drawn top to bottom: every step as a shape by its kind, dots moving
 *  down each edge by the system's behaviour (streams by default), and dust
 *  everywhere the text is not. */
export function flowTargets(
  n: number,
  flows: FlowInput[],
  viewport: { w: number; h: number },
  mask: Rect[],
  random: () => number,
  behaviour?: Behaviour,
): Targets {
  const b = builder(n, "screen");
  const loopRate = 1 / (behaviour?.period ?? 3);
  type Placed = FlowNode & { r: number; delay: number; group: number; flow: number; beh?: StepBehaviour };
  type End = { x: number; y: number; kind: FlowNode["kind"]; r: number };
  const nodes: Placed[] = [];
  const edges: { a: Placed; b: End; programs: EdgeProgram[] }[] = [];
  flows.forEach((f, fi) => {
    f.nodes.forEach((node, k) => {
      const placed: Placed = {
        ...node,
        r: f.radius,
        delay: k / Math.max(1, f.nodes.length - 1),
        group: nodes.length,
        flow: fi,
        beh: node.step ? behaviour?.steps?.[node.step] : undefined,
      };
      if (k > 0) {
        const a = nodes[nodes.length - 1];
        edges.push({ a, b: placed, programs: (a.step && behaviour?.edges?.[a.step]) || STREAM });
      }
      nodes.push(placed);
    });
    // An exit carries on past the flow's last step, the way the flow runs.
    const last = nodes[nodes.length - 1];
    const exit = f.nodes.length && last.step ? behaviour?.exits?.[last.step] : undefined;
    if (exit) {
      const prev = f.nodes.length > 1 ? nodes[nodes.length - 2] : null;
      const [dx, dy] = prev ? [last.x - prev.x, last.y - prev.y] : [0, 1];
      const len = Math.hypot(dx, dy) || 1;
      const reach = gapOf(last) + EXIT_PX;
      edges.push({ a: last, b: { x: last.x + (dx / len) * reach, y: last.y + (dy / len) * reach, kind: "io", r: 0 }, programs: exit });
    }
  });

  // The rectangle a "box" step draws: 1.5 radii outside its whole flow.
  const boxOf = (node: Placed): Rect => {
    const own = nodes.filter((m) => m.flow === node.flow);
    const pad = node.r * 1.5;
    const x0 = Math.min(...own.map((m) => m.x)) - pad;
    const y0 = Math.min(...own.map((m) => m.y)) - pad;
    return { x: x0, y: y0, w: Math.max(...own.map((m) => m.x)) + pad - x0, h: Math.max(...own.map((m) => m.y)) + pad - y0 };
  };
  const capOf = (node: Placed) => {
    const shape = node.beh?.shape;
    if (shape === "box") {
      const box = boxOf(node);
      return Math.round(2 * (box.w + box.h) * BOX_DENSITY);
    }
    return capFor(shape === "grid" ? "grid" : shape === "posts" ? "guard" : node.kind, node.r);
  };

  const nodeN = nodes.length ? Math.round(n * NODE_SHARE) : 0;
  const edgeN = edges.length ? Math.round(n * EDGE_SHARE) : 0;
  const perNode = split(nodeN, Math.max(1, nodes.length)).map((c, k) => (nodes[k] ? Math.min(c, capOf(nodes[k])) : 0));
  const jitter = (d: number) => d * 0.85 + random() * 0.15;
  type Dot = { x: number; y: number; kind: Kind; delay: number; group: number; flow?: Vec4; loop?: Vec4; wander?: number };
  const model: Dot[] = [];
  const system: Dot[] = [];

  // Steps from the top down; model steps' dots go to the model block.
  const order = nodes.map((node, k) => ({ node, count: perNode[k] })).sort((p, q) => p.node.y - q.node.y);
  for (const { node, count } of order) {
    const beh = node.beh;
    const isModel = node.kind === "model";
    const ring = Math.round(count * 0.6);
    for (let k = 0; k < count; k++) {
      let xy: [number, number];
      let flow: Vec4 | undefined;
      let loop: Vec4 | undefined;
      if (beh?.shape === "box") xy = boxPoint(boxOf(node), random);
      else if (beh?.shape === "posts") xy = postPoint(node.x, node.y, node.r, beh.posts ?? 2, k, random);
      else if (beh?.arrive && node.kind === "human") {
        if (k < ring) xy = ringPoint(node.x, node.y, node.r, node.r * 0.1, random);
        else {
          // The approval: a bright centre that travels in from the left.
          const [px, py] = discPoint(node.x, node.y, node.r * 0.28, random);
          const reach = node.r * 1.8;
          xy = [px - reach, py];
          flow = [reach, 0, 0, 0];
          loop = [MODE.arrive, loopRate, beh.arrive[0], beh.arrive[1]];
        }
      } else xy = shapePoint(beh?.shape === "grid" ? "grid" : node.kind, node.x, node.y, node.r, k, random);
      if (beh?.pulseAt !== undefined) {
        flow = [xy[0] - node.x, xy[1] - node.y, 0, 0];
        loop = [MODE.pulse, loopRate, beh.pulseAt, beh.pulseAt];
      }
      (isModel ? model : system).push({
        x: xy[0],
        y: xy[1],
        kind: isModel ? 2 : 1,
        delay: jitter(node.delay),
        group: node.group,
        flow,
        loop,
        wander: beh?.wander ?? 1,
      });
    }
  }

  // Each edge runs from just outside one step (a guard's centre) to just
  // outside the next, carrying the programs the behaviour gives it.
  const sorted = [...edges].sort((p, q) => p.a.y - q.a.y);
  split(edgeN, Math.max(1, sorted.length)).forEach((count, k) => {
    const e = sorted[k];
    if (!e) return;
    const dx = e.b.x - e.a.x;
    const dy = e.b.y - e.a.y;
    const len = Math.hypot(dx, dy) || 1;
    const [ux, uy] = [dx / len, dy / len];
    const gapA = gapOf(e.a);
    const r = e.a.r;
    const at = (along: number, side: number): [number, number] => [e.a.x + ux * (gapA + along) - uy * side, e.a.y + uy * (gapA + along) + ux * side];
    for (const prog of e.programs) {
      const gapB = prog.kind === "hold" || prog.kind === "bounce" ? prog.stopShort * e.b.r : gapOf(e.b);
      const span = Math.max(0, len - gapA - gapB);
      const vec = (phase: number): Vec4 => [ux * span, uy * span, 0, phase];
      if (prog.kind === "stream" || prog.kind === "hold") {
        const budget = Math.min(count, Math.max(4, Math.round(span * EDGE_DENSITY)));
        const take = Math.round(budget * (prog.share ?? 1));
        for (let m = 0; m < take; m++) {
          if (prog.kind === "stream") {
            const [sx, sy] = at(0, (random() - 0.5) * 1.6);
            system.push({ x: sx, y: sy, kind: 1, delay: jitter(e.a.delay), group: -1, flow: vec(random()), loop: [MODE.stream, STREAM_PX_PER_S / Math.max(span, MIN_STREAM_SPAN), 0, 1] });
          } else {
            // Held back: a trickle that stops short of the gate, side by side.
            const [sx, sy] = at(0, (random() - 0.5) * 0.9 * r);
            system.push({ x: sx, y: sy, kind: 1, delay: jitter(e.a.delay), group: -1, flow: vec(-0.2 * random()), loop: [MODE.hold, loopRate, prog.window[0], prog.window[1]] });
          }
        }
      } else {
        // Packets and bounces: small clusters, packet j leaving j·gap later.
        const spread = prog.kind === "packets" ? (prog.spread ?? 0) : 0;
        const mode = prog.kind === "packets" ? MODE.packet : MODE.bounce;
        for (let j = 0; j < prog.count; j++) {
          const offset = prog.count > 1 ? spread * r * ((2 * j) / (prog.count - 1) - 1) : 0;
          for (let m = 0; m < PACKET_DOTS; m++) {
            const [sx, sy] = at((random() - 0.5) * 4, offset + (random() - 0.5) * 3);
            system.push({ x: sx, y: sy, kind: 1, delay: jitter(e.a.delay), group: -1, flow: vec(-j * (prog.gap ?? 0)), loop: [mode, loopRate, prog.window[0], prog.window[1]] });
          }
        }
      }
    }
  });

  const dust = () => {
    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 64; tries++) {
      x = random() * viewport.w;
      y = random() * viewport.h;
      if (!inside(mask, x, y)) break;
    }
    if (inside(mask, x, y)) x = viewport.w - random() * viewport.w * 0.1;
    b.put(x, y, 0, 0, random(), -1);
  };
  const put = (d: Dot) => b.put(d.x, d.y, 0, d.kind, d.delay, d.group, d.flow, d.loop, d.wander);

  const { modelEnd, systemEnd } = blocks(n);
  let i = 0;
  for (const d of model.slice(0, modelEnd)) {
    put(d);
    i++;
  }
  for (; i < modelEnd; i++) dust();
  for (const d of system.slice(0, systemEnd - modelEnd)) {
    put(d);
    i++;
  }
  for (; i < n; i++) dust();
  const t = b.done();
  t.still = behaviour ? behaviour.still * behaviour.period : 0;
  return t;
}

// ── The handoff ──────────────────────────────────────────────────────────

/** The film's last frame: every dot on one hairline at `y`, spread evenly
 *  across `width` and drawn from left to right, with no drift. */
export function lineTargets(n: number, y: number, width: number): Targets {
  const b = builder(n, "screen");
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.5) / n) * width;
    b.put(x, y, 0, 3, x / Math.max(1, width), -1, undefined, undefined, 0);
  }
  return b.done();
}

/** The hairline's alpha per dot, so that its overlapping dots add up to one
 *  hairline: with `d` dots to a pixel, normal blending (light) needs
 *  1 − 0.1^(1/d) for 90% cover, additive blending (dark) about 0.8/d. */
export function lineAlpha(n: number, width: number, dark: boolean): number {
  const d = Math.max(1e-3, n / Math.max(1, width));
  const a = dark ? 0.8 / d : 1 - Math.pow(0.1, 1 / d);
  return Math.min(0.6, Math.max(0.02, a));
}
