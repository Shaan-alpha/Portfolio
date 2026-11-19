// Run with `npm test`. Every scene is a list of targets, one per dot, built
// from the same geometry the page draws. Yellow means a model runs here, so
// only model parts may hold yellow dots.
import { test } from "node:test";
import assert from "node:assert/strict";
import { flowTargets, rng, slotLabelTops, stackTargets, type FlowInput } from "./targets.ts";
import { CUBE, slotY } from "../stack/geometry.ts";

test("stackTargets fills every dot and only the cube is yellow", () => {
  const t = stackTargets(5000, rng(1));
  assert.equal(t.n, 5000);
  assert.equal(t.to.length, 15000);
  assert.equal(t.kind.length, 5000);
  assert.equal(t.frame, "stack");
  let yellow = 0;
  const cy = slotY(3);
  for (let i = 0; i < t.n; i++) {
    if (t.kind[i] !== 2) continue;
    yellow++;
    const [x, y, z] = [t.to[3 * i], t.to[3 * i + 1], t.to[3 * i + 2]];
    const lim = CUBE / 2 + 1e-6;
    assert.ok(Math.abs(x) <= lim && Math.abs(y - cy) <= lim && Math.abs(z) <= lim, `dot ${i} at ${x}, ${y}, ${z}`);
  }
  assert.ok(Math.abs(yellow / t.n - 0.14) <= 0.01, `yellow share ${yellow / t.n}`);
});

test("stackTargets is deterministic for a seed", () => {
  const a = stackTargets(2000, rng(7));
  const b = stackTargets(2000, rng(7));
  assert.deepEqual(a.to, b.to);
  assert.deepEqual(a.kind, b.kind);
  assert.deepEqual(a.delay, b.delay);
});

const flow: FlowInput = {
  radius: 24,
  nodes: [
    { x: 600, y: 100, kind: "io" },
    { x: 600, y: 200, kind: "model" },
    { x: 600, y: 300, kind: "guard" },
  ],
};
const viewport = { w: 1440, h: 900 };

test("flowTargets puts model dots only on model nodes", () => {
  const t = flowTargets(4000, [flow], viewport, [], rng(3));
  assert.equal(t.frame, "screen");
  let yellow = 0;
  for (let i = 0; i < t.n; i++) {
    if (t.kind[i] !== 2) continue;
    yellow++;
    const d = Math.hypot(t.to[3 * i] - 600, t.to[3 * i + 1] - 200);
    assert.ok(d <= 24 * 1.6, `yellow dot ${i} is ${d} px from the model node`);
  }
  assert.ok(yellow > 0, "the model node has dots");
});

test("flowTargets keeps dust out of the mask", () => {
  const mask = { x: 0, y: 0, w: 500, h: 800 };
  const t = flowTargets(4000, [flow], viewport, [mask], rng(4));
  let dust = 0;
  for (let i = 0; i < t.n; i++) {
    if (t.kind[i] !== 0) continue;
    dust++;
    const [x, y] = [t.to[3 * i], t.to[3 * i + 1]];
    assert.ok(!(x >= mask.x && x <= mask.x + mask.w && y >= mask.y && y <= mask.y + mask.h), `dust ${i} at ${x}, ${y}`);
  }
  assert.ok(dust > 0, "there is dust");
});

test("flowTargets streams only edge dots", () => {
  const t = flowTargets(4000, [flow], viewport, [], rng(5));
  // Distance from a point to the segment x = 600, y in [100, 300].
  const off = (x: number, y: number) => Math.hypot(x - 600, Math.max(0, 100 - y, y - 300));
  let streaming = 0;
  for (let i = 0; i < t.n; i++) {
    const [vx, vy] = [t.flow[4 * i], t.flow[4 * i + 1]];
    if (vx === 0 && vy === 0) continue;
    streaming++;
    const [x, y] = [t.to[3 * i], t.to[3 * i + 1]];
    assert.ok(off(x, y) <= 2, `edge dot ${i} starts ${off(x, y)} px off the edge`);
    assert.ok(off(x + vx, y + vy) <= 2, `edge dot ${i} ends ${off(x + vx, y + vy)} px off the edge`);
  }
  assert.ok(streaming > 0, "some dots stream");
});

test("flowTargets keeps steps and edges light enough to read as dots", () => {
  // With the full desktop budget on three small steps, the extra dots must go
  // to the dust, not pile up on the shapes until they smudge.
  const t = flowTargets(16000, [flow], viewport, [], rng(6));
  const near = [100, 200, 300].map((y) => {
    let k = 0;
    for (let i = 0; i < t.n; i++) {
      if (t.kind[i] === 0) continue;
      if (t.flow[4 * i] !== 0 || t.flow[4 * i + 1] !== 0) continue;
      if (Math.hypot(t.to[3 * i] - 600, t.to[3 * i + 1] - y) <= 24 * 1.6) k++;
    }
    return k;
  });
  for (const k of near) assert.ok(k > 40 && k <= 400, `a step holds ${k} dots`);
  let streaming = 0;
  for (let i = 0; i < t.n; i++) if (t.flow[4 * i] !== 0 || t.flow[4 * i + 1] !== 0) streaming++;
  // Two edges of about 140 px each.
  assert.ok(streaming > 20 && streaming <= 200, `${streaming} streaming dots`);
});

test("slot labels line up with the drawing", () => {
  const tops = slotLabelTops();
  assert.equal(tops.length, 5);
  for (let k = 0; k < 5; k++) {
    assert.ok(tops[k] > 0 && tops[k] < 100, `slot ${k}: ${tops[k]}`);
    if (k > 0) assert.ok(tops[k] > tops[k - 1], `slot ${k} below slot ${k - 1}`);
  }
  assert.ok(Math.abs(tops[3] - (tops[2] + tops[4]) / 2) <= 2, `slot 3 at ${tops[3]}`);
});
