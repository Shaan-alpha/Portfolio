// Run with `npm test`. Act III: each production project walked through the
// building as its case study scrolls past. Every step of its real flows is a
// stop on the level its kind belongs to, and the camera visiting them must
// never pass through the building.
import { test } from "node:test";
import assert from "node:assert/strict";
import { flagship } from "../../content/projects.ts";
import { buildBlueprint, type Part } from "./blueprint.ts";
import { routeShot, routesFor, travelAt } from "./routes.ts";
import { shotFor } from "./shots.ts";

const bp = buildBlueprint("high");
const band = Object.fromEntries(bp.storeys.map((s) => [s.id, s]));
const LEVEL = { io: "interfaces", guard: "guards", human: "guards", step: "orchestration" } as const;
const inBox = (p: number[], c: number[], s: number[]) => [0, 1, 2].every((i) => Math.abs(p[i] - c[i]) < s[i] / 2);

test("every step of every flow is a stop", () => {
  for (const p of flagship) {
    const routes = routesFor(p.flows ?? [], bp);
    assert.equal(routes.length, (p.flows ?? []).length, p.id);
    routes.forEach((r, i) => assert.equal(r.stops.length, p.flows![i].steps.length, `${p.id} flow ${i}`));
  }
});

test("each stop stands on its kind's level, and model stops at the model", () => {
  for (const p of flagship) {
    for (const r of routesFor(p.flows ?? [], bp)) {
      for (const s of r.stops) {
        if (s.kind === "model") {
          assert.deepEqual(s.position, bp.model.center, p.id);
          continue;
        }
        const level = band[LEVEL[s.kind]];
        assert.equal(s.level, LEVEL[s.kind]);
        assert.ok(s.position[1] > level.y0 && s.position[1] < level.y1, `${p.id} ${s.kind} at y ${s.position[1]}`);
      }
    }
  }
});

test("no stop but the model enters the atrium", () => {
  for (const p of flagship) {
    for (const r of routesFor(p.flows ?? [], bp)) {
      for (const s of r.stops) if (s.kind !== "model") assert.equal(inBox(s.position, bp.atrium.center, bp.atrium.size), false, `${p.id} ${s.kind}`);
    }
  }
});

test("a path runs from its first stop to its last", () => {
  for (const p of flagship) {
    for (const r of routesFor(p.flows ?? [], bp)) {
      assert.deepEqual(r.path[0], r.stops[0].position);
      assert.deepEqual(r.path[r.path.length - 1], r.stops[r.stops.length - 1].position);
      for (let i = 1; i < r.path.length; i++) assert.ok(r.path[i].some((v, k) => v !== r.path[i - 1][k]), `${p.id}: repeated waypoint`);
    }
  }
});

test("a project's scroll opens and closes on the overview", () => {
  const routes = routesFor(flagship[0].flows ?? [], bp);
  assert.deepEqual(routeShot(routes, 0, 4 / 3, bp), shotFor("section", 4 / 3, bp));
  assert.deepEqual(routeShot(routes, 1, 4 / 3, bp), shotFor("section", 4 / 3, bp));
});

test("the camera never enters a solid part on any route", () => {
  const solid: Part[] = bp.groups.filter((g) => !g.cut).flatMap((g) => g.parts);
  for (const aspect of [4 / 3, 5 / 4]) {
    for (const p of flagship) {
      const routes = routesFor(p.flows ?? [], bp);
      for (let q = 0; q <= 1.0001; q += 0.0025) {
        const cam = routeShot(routes, q, aspect, bp).position;
        const hit = solid.find((s) => inBox(cam, s.center, s.size));
        assert.equal(hit, undefined, `${p.id} p ${q.toFixed(4)} at ${cam.map((v) => v.toFixed(2))}`);
      }
    }
  }
});

test("the travelling marker walks the routes in order", () => {
  const two = flagship.find((p) => (p.flows ?? []).length > 1)!;
  const routes = routesFor(two.flows!, bp);
  let last = { route: 0, t: 0 };
  for (let q = 0; q <= 1.0001; q += 0.01) {
    const now = travelAt(routes, q);
    assert.ok(now.route > last.route || (now.route === last.route && now.t >= last.t - 1e-9), `${q.toFixed(2)} went back`);
    if (now.route > last.route) assert.ok(last.t > 0.99, "left the first route before its end");
    last = now;
  }
  assert.equal(last.route, routes.length - 1);
});

test("the vault shot stands outside the plinth, looking into level B", () => {
  const v = shotFor("vault", 4 / 3, bp);
  assert.ok(v.position[0] > bp.bounds.max[0]);
  assert.ok(v.target[1] < 0 && v.target[1] > band.state.y0);
});
