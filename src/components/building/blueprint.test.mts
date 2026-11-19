// Run with `npm test`. The building is generated in code; these tests hold
// it to the design: the five levels in layer order, the model hanging alone
// in the atrium, yellow used once, and the triangle budgets per detail.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBlueprint, triangles, type Blueprint, type Part } from "./blueprint.ts";

type Box = { center: [number, number, number]; size: [number, number, number] };

/** The axis-aligned box a part occupies, with a turn about y widening its
 *  footprint the way a rotated box's does. */
function aabb(p: Part): { min: number[]; max: number[] } {
  const c = Math.abs(Math.cos(p.rotY ?? 0));
  const s = Math.abs(Math.sin(p.rotY ?? 0));
  const hx = (c * p.size[0] + s * p.size[2]) / 2;
  const hz = (s * p.size[0] + c * p.size[2]) / 2;
  const hy = p.size[1] / 2;
  return { min: [p.center[0] - hx, p.center[1] - hy, p.center[2] - hz], max: [p.center[0] + hx, p.center[1] + hy, p.center[2] + hz] };
}

function inside(p: Part, box: Box): boolean {
  const a = aabb(p);
  return [0, 1, 2].every((i) => a.min[i] >= box.center[i] - box.size[i] / 2 - 1e-9 && a.max[i] <= box.center[i] + box.size[i] / 2 + 1e-9);
}

function overlaps(p: Part, box: Box): boolean {
  const a = aabb(p);
  return [0, 1, 2].every((i) => a.max[i] > box.center[i] - box.size[i] / 2 + 1e-9 && a.min[i] < box.center[i] + box.size[i] / 2 - 1e-9);
}

const levelY = (bp: Blueprint) => Object.fromEntries(bp.levels.map((l) => [l.id, l.y]));

test("levels stack in layer order", () => {
  const y = levelY(buildBlueprint("high"));
  assert.ok(y.state < y.interfaces && y.interfaces < y.guards && y.guards < y.orchestration);
});

test("the model hangs in the atrium between guards and orchestration", () => {
  const bp = buildBlueprint("high");
  const y = levelY(bp);
  assert.ok(y.guards < bp.model.center[1] && bp.model.center[1] < y.orchestration);
  assert.ok(inside(bp.model, bp.atrium));
});

test("nothing but the model enters the atrium", () => {
  for (const detail of ["high", "low"] as const) {
    const bp = buildBlueprint(detail);
    for (const g of bp.groups) {
      if (g.material === "model") continue;
      g.parts.forEach((p, i) => assert.equal(overlaps(p, bp.atrium), false, `${detail} ${g.id}[${i}]`));
    }
  }
});

test("yellow is used once", () => {
  for (const detail of ["high", "low"] as const) {
    const bp = buildBlueprint(detail);
    const yellow = bp.groups.filter((g) => g.material === "model");
    assert.equal(yellow.length, 1);
    assert.equal(yellow[0].parts.length, 1);
    assert.deepEqual(yellow[0].parts[0], bp.model);
  }
});

test("every part sits inside the bounds", () => {
  for (const detail of ["high", "low"] as const) {
    const bp = buildBlueprint(detail);
    const box: Box = {
      center: bp.bounds.min.map((v, i) => (v + bp.bounds.max[i]) / 2) as Box["center"],
      size: bp.bounds.min.map((v, i) => bp.bounds.max[i] - v) as Box["size"],
    };
    for (const g of bp.groups) g.parts.forEach((p, i) => assert.ok(inside(p, box), `${detail} ${g.id}[${i}]`));
  }
});

test("detail budgets hold", () => {
  const hi = buildBlueprint("high");
  const lo = buildBlueprint("low");
  assert.ok(triangles(hi) <= 400_000, `high: ${triangles(hi)} triangles`);
  assert.ok(hi.groups.length <= 80, `high: ${hi.groups.length} groups`);
  assert.ok(triangles(lo) <= 120_000, `low: ${triangles(lo)} triangles`);
  assert.ok(lo.groups.length <= 40, `low: ${lo.groups.length} groups`);
  assert.ok(triangles(hi) > triangles(lo));
});

test("the blueprint is deterministic", () => {
  assert.deepEqual(buildBlueprint("high"), buildBlueprint("high"));
});
