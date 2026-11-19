import type { Flow, StepKind } from "@/content/projects";
import type { Blueprint, StoreyId, Vec3 } from "./blueprint";
import { shotFor, type Shot } from "./shots.ts";

// Act III, as data: a production project walked through the building. Every
// step of its real flows is a stop on the level its kind belongs to (an
// interface in the lobby, a guard at the gates, a person at the approval
// desk, a step on the plant floor, the model in the atrium), the stops are
// joined into a path, and a camera is framed for any point of the project's
// scroll. Pure, so routes.test.mts holds it to the data and keeps the camera
// out of the walls.

export type Stop = { kind: StepKind; position: Vec3; level: StoreyId | "model" };
/** `at` is each stop's place along the path, 0 to 1 by length. */
export type Route = { stops: Stop[]; path: Vec3[]; at: number[] };

/** How high the route runs above each floor: over the desk and the gate
 *  barriers, under the ducts. Mirrors the furniture in blueprint.ts. */
const H = 0.35;
const ENTRANCE: [number, number] = [0, 2.1];
const RECEPTION: [number, number] = [-1.8, 1.45];
const GATE = (i: number): [number, number] => [-3.0 + ((2 + i) % 7) * 0.85, 1.55];
const DESK: [number, number] = [2.7, 0.55];
const PLANT = (i: number): [number, number] => [-3 + (i % 5) * 0.9, 1.6];
/** The riser beside the core that carries routes between levels, and the
 *  corridor point in front of it, kept clear of the atrium. */
const RISER: [number, number] = [2.2, -1.0];
const CORRIDOR: [number, number] = [2.2, 1.2];
/** Where a route meets the atrium on the plant floor, before dropping in. */
const RIM: [number, number] = [0, 1.15];
const RIM_TURN: [number, number] = [1.6, 1.15];

/** The two cut-away sides, which the stop cameras look in through. */
const FRONT_Z = 2.5;
const RIGHT_X = 4;
/** The overview holds the first and last 12% of a project's scroll. */
const IN = 0.12;
const OUT = 0.88;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function stopsFor(flow: Flow, bp: Pick<Blueprint, "levels" | "model">): Stop[] {
  const floor = (id: StoreyId) => bp.levels.find((l) => l.id === id)!.y + H;
  let io = 0;
  let guard = 0;
  let step = 0;
  return flow.steps.map((s): Stop => {
    if (s.kind === "model") return { kind: s.kind, position: [...bp.model.center] as Vec3, level: "model" };
    if (s.kind === "io") {
      const [x, z] = io++ === 0 ? ENTRANCE : RECEPTION;
      return { kind: s.kind, position: [x, floor("interfaces"), z], level: "interfaces" };
    }
    if (s.kind === "guard") {
      const [x, z] = GATE(guard++);
      return { kind: s.kind, position: [x, floor("guards"), z], level: "guards" };
    }
    if (s.kind === "human") return { kind: s.kind, position: [DESK[0], floor("guards"), DESK[1]], level: "guards" };
    const [x, z] = PLANT(step++);
    return { kind: s.kind, position: [x, floor("orchestration"), z], level: "orchestration" };
  });
}

/** The waypoints from one stop to the next. Between levels a route rides the
 *  riser by the core; into and out of the model it drops through the atrium
 *  from the plant floor. On one level it goes straight. */
function between(a: Stop, b: Stop, y: (id: StoreyId) => number): Vec3[] {
  if (a.level === b.level) return [];
  const plant = y("orchestration");
  const out: Vec3[] = [];
  let level: StoreyId;
  if (a.level === "model") {
    out.push([0, plant, 0], [RIM[0], plant, RIM[1]], [RIM_TURN[0], plant, RIM_TURN[1]]);
    level = "orchestration";
  } else {
    level = a.level;
  }
  const target: StoreyId = b.level === "model" ? "orchestration" : b.level;
  if (level !== target) {
    out.push(
      [CORRIDOR[0], y(level), CORRIDOR[1]],
      [RISER[0], y(level), RISER[1]],
      [RISER[0], y(target), RISER[1]],
      [CORRIDOR[0], y(target), CORRIDOR[1]],
    );
  }
  if (b.level === "model") out.push([RIM_TURN[0], plant, RIM_TURN[1]], [RIM[0], plant, RIM[1]], [0, plant, 0]);
  return out;
}

export function routesFor(flows: Flow[], bp: Pick<Blueprint, "levels" | "model">): Route[] {
  const y = (id: StoreyId) => bp.levels.find((l) => l.id === id)!.y + H;
  return flows.map((flow) => {
    const stops = stopsFor(flow, bp);
    const path: Vec3[] = [];
    const index: number[] = [];
    const push = (p: Vec3) => {
      const last = path[path.length - 1];
      if (!last || last.some((v, k) => Math.abs(v - p[k]) > 1e-9)) path.push([...p] as Vec3);
    };
    stops.forEach((s, i) => {
      if (i > 0) between(stops[i - 1], s, y).forEach(push);
      push(s.position);
      index.push(path.length - 1);
    });
    const lengths = [0];
    for (let i = 1; i < path.length; i++) lengths.push(lengths[i - 1] + Math.hypot(...path[i].map((v, k) => v - path[i - 1][k])));
    const total = lengths[lengths.length - 1] || 1;
    return { stops, path, at: index.map((i) => lengths[i] / total) };
  });
}

/** A stop seen from outside the cut-away side nearest it, from a little
 *  above, so the floor plan and the route on it read as a path rather than
 *  a forest of columns. */
function stopShot(s: Stop, aspect: number): Shot {
  const [x, y, z] = s.position;
  const front = FRONT_Z - z <= RIGHT_X - x;
  const position: Vec3 = front ? [x + 1.6, y + 1.6, Math.max(z + 5.6, FRONT_Z + 3.4)] : [Math.max(x + 5.6, RIGHT_X + 3.4), y + 1.6, z + 1.6];
  return { position, target: [x, y, z], fov: aspect < 1.1 ? 48 : 40 };
}

/** Between two shots the camera swings round the building's vertical axis
 *  instead of cutting across it: angle, radius and height ease separately,
 *  so a camera that starts and ends outside the walls stays outside them. */
function orbitLerp(a: Shot, b: Shot, t: number): Shot {
  const polar = (p: Vec3) => ({ angle: Math.atan2(p[0], p[2]), radius: Math.hypot(p[0], p[2]), y: p[1] });
  const pa = polar(a.position);
  const pb = polar(b.position);
  let d = pb.angle - pa.angle;
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  const angle = pa.angle + d * t;
  const radius = lerp(pa.radius, pb.radius, t);
  const target = a.target.map((v, k) => lerp(v, b.target[k], t)) as Vec3;
  return { position: [Math.sin(angle) * radius, lerp(pa.y, pb.y, t), Math.cos(angle) * radius], target, fov: lerp(a.fov, b.fov, t) };
}

/** The camera at point `p` (0 to 1) of a project's scroll: the overview, then
 *  every stop of every route in order with an equal share each, then the
 *  overview again. */
export function routeShot(routes: Route[], p: number, aspect: number, bp: Pick<Blueprint, "center" | "radius" | "atrium" | "model">): Shot {
  const overview = shotFor("section", aspect, bp);
  const stops = routes.flatMap((r) => r.stops);
  const q = clamp01(p);
  if (!stops.length || q <= IN || q >= OUT) return overview;
  const keys: { at: number; shot: Shot }[] = [{ at: IN, shot: overview }];
  stops.forEach((s, k) => keys.push({ at: IN + ((OUT - IN) * (k + 0.5)) / stops.length, shot: stopShot(s, aspect) }));
  keys.push({ at: OUT, shot: overview });
  let i = 0;
  while (i < keys.length - 2 && q > keys[i + 1].at) i++;
  const a = keys[i];
  const b = keys[i + 1];
  return orbitLerp(a.shot, b.shot, ease(clamp01((q - a.at) / (b.at - a.at))));
}

/** Where the travelling marker is at point `p`: which route, and how far
 *  along its path (0 to 1). It reaches each stop as the camera does, and a
 *  project with two flows finishes the first before starting the second. */
export function travelAt(routes: Route[], p: number): { route: number; t: number } {
  const stops = routes.flatMap((r, ri) => r.stops.map((_, si) => ({ ri, si })));
  const n = stops.length;
  if (!n) return { route: 0, t: 0 };
  const x = clamp01((p - IN) / (OUT - IN)) * n - 0.5;
  const at = (s: { ri: number; si: number }) => routes[s.ri].at[s.si];
  if (x <= 0) return { route: stops[0].ri, t: at(stops[0]) };
  if (x >= n - 1) return { route: stops[n - 1].ri, t: at(stops[n - 1]) };
  const k = Math.floor(x);
  const f = ease(x - k);
  const a = stops[k];
  const b = stops[k + 1];
  if (a.ri === b.ri) return { route: a.ri, t: lerp(at(a), at(b), f) };
  return f < 0.5 ? { route: a.ri, t: lerp(at(a), 1, f * 2) } : { route: b.ri, t: lerp(0, at(b), (f - 0.5) * 2) };
}
