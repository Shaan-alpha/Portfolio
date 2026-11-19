// Run with `npm test`. The camera: shots framed for any screen shape, and the
// scroll choreography from the opening site shot through the atrium dive.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBlueprint, type Part } from "./blueprint.ts";
import { BEATS, choreograph, fitDistance, lerpShot, project, shotFor, type Shot } from "./shots.ts";

const bp = buildBlueprint("high");
const rad = (d: number) => (d * Math.PI) / 180;
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

test("a fitted sphere stays inside the frustum at any aspect", () => {
  const r = 5;
  const fov = 32;
  for (const aspect of [0.46, 0.75, 1, 1.6, 2.4]) {
    const d = fitDistance(r, fov, aspect);
    const half = Math.asin(r / d);
    const vHalf = rad(fov) / 2;
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    assert.ok(half <= vHalf + 1e-9 && half <= hHalf + 1e-9, `aspect ${aspect}`);
  }
});

test("portrait framing pulls back", () => {
  const wide = shotFor("site", 1.6, bp);
  const tall = shotFor("site", 0.46, bp);
  assert.ok(dist(tall.position, tall.target) > dist(wide.position, wide.target));
});

test("the dive ends in the atrium, looking at the model", () => {
  for (const aspect of [1.6, 0.46]) {
    const dive = shotFor("dive", aspect, bp);
    const a = bp.atrium;
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(dive.position[i] - a.center[i]) < a.size[i] / 2, `axis ${i}`);
    assert.deepEqual(dive.target, bp.model.center);
  }
});

test("lerp hits both ends and averages the lens", () => {
  const a: Shot = { position: [0, 0, 10], target: [0, 0, 0], fov: 30 };
  const b: Shot = { position: [10, 5, 0], target: [1, 1, 1], fov: 50 };
  assert.deepEqual(lerpShot(a, b, 0), a);
  assert.deepEqual(lerpShot(a, b, 1), b);
  assert.equal(lerpShot(a, b, 0.5).fov, 40);
});

test("choreography opens on the site and settles on the section", () => {
  assert.equal(choreograph(0).from.shot, "site");
  assert.equal(choreograph(0).t, 0);
  const end = choreograph(1);
  assert.equal(end.to.shot, "section");
  assert.equal(end.t, 1);
  assert.equal(choreograph(-1).from.shot, "site");
  for (let i = 1; i < BEATS.length; i++) assert.ok(BEATS[i].at > BEATS[i - 1].at);
  for (let p = 0; p <= 1; p += 0.01) {
    const { t } = choreograph(p);
    assert.ok(t >= 0 && t <= 1);
  }
});

test("the camera path never enters a solid part", () => {
  const solid = bp.groups.filter((g) => !g.cut).flatMap((g) => g.parts);
  const inside = (p: number[], q: Part) => [0, 1, 2].every((i) => Math.abs(p[i] - q.center[i]) < q.size[i] / 2);
  for (const aspect of [4 / 3, 0.46]) {
    for (let p = 0; p <= 1.0001; p += 0.0025) {
      const { from, to, t } = choreograph(p);
      const cam = lerpShot(shotFor(from.shot, aspect, bp), shotFor(to.shot, aspect, bp), t).position;
      const hit = solid.find((q) => inside(cam, q));
      assert.equal(hit, undefined, `aspect ${aspect.toFixed(2)} p ${p.toFixed(4)} at ${cam.map((v) => v.toFixed(2))}`);
    }
  }
});

test("projection puts the target at the centre and right on the right", () => {
  const shot: Shot = { position: [0, 0, 10], target: [0, 0, 0], fov: 40 };
  const [cx, cy] = project([0, 0, 0], shot, 1.5);
  assert.ok(Math.abs(cx) < 1e-9 && Math.abs(cy) < 1e-9);
  assert.ok(project([1, 0, 0], shot, 1.5)[0] > 0);
  assert.ok(project([0, 1, 0], shot, 1.5)[1] > 0);
});
