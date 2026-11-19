// Run with `npm test`. The field's motion is a pure function of time. The
// vertex shader evaluates these same formulas, and the CPU uses them to work
// out where every dot is when a scene changes, so a new morph starts exactly
// where the dots are.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  IDENTITY_FRAME,
  dotPosition,
  dotProgress,
  ease,
  snapshot,
  stackFrame,
  type MorphState,
} from "./morph.ts";
import { basis, project, type Vec3 } from "../stack/geometry.ts";

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

function randomState(n: number, random: () => number, start: number, spread: number): MorphState {
  const fill = (len: number, scale: number) => Float32Array.from({ length: len }, () => (random() - 0.5) * scale);
  const flow = new Float32Array(4 * n);
  for (let i = 0; i < n; i++) {
    // Half the dots stream along an edge, half sit still.
    if (i % 2) {
      flow[4 * i] = (random() - 0.5) * 2;
      flow[4 * i + 1] = (random() - 0.5) * 2;
      flow[4 * i + 2] = 0;
    }
    flow[4 * i + 3] = random();
  }
  return {
    n,
    from: fill(3 * n, spread),
    mid: fill(3 * n, spread),
    to: fill(3 * n, 4),
    delay: Float32Array.from({ length: n }, random),
    seed: Float32Array.from({ length: n }, random),
    flow,
    start,
    duration: 0.95,
    stagger: 0.45,
  };
}

const close = (a: number, b: number, eps: number, what: string) => assert.ok(Math.abs(a - b) <= eps, `${what}: ${a} vs ${b}`);

test("ease starts at 0, ends at 1 and never decreases", () => {
  assert.equal(ease(0), 0);
  assert.equal(ease(1), 1);
  assert.equal(ease(-1), 0);
  assert.equal(ease(2), 1);
  let last = 0;
  for (let k = 0; k <= 100; k++) {
    const v = ease(k / 100);
    assert.ok(v >= last, `step ${k}`);
    last = v;
  }
});

test("a dot waits for its delay, then arrives by the end of its window", () => {
  const start = 10;
  assert.equal(dotProgress(start + 0.2, start, 0.5, 1, 0.4), 0);
  assert.equal(dotProgress(start + 1.2, start, 0.5, 1, 0.4), 1);
  const mid = dotProgress(start + 0.7, start, 0.5, 1, 0.4);
  assert.ok(mid > 0 && mid < 1, String(mid));
});

test("a dot sits on its source at the start and on its target at the end", () => {
  const st = randomState(50, lcg(3), 5, 800);
  for (let i = 0; i < st.n; i++) st.flow.fill(0, 4 * i, 4 * i + 3);
  const out = new Float32Array(3);
  for (let i = 0; i < st.n; i++) {
    dotPosition(out, 0, st, i, st.start, IDENTITY_FRAME, 0, 0);
    for (let a = 0; a < 3; a++) close(out[a], st.from[3 * i + a], 1e-4, `from ${i}.${a}`);
    dotPosition(out, 0, st, i, st.start + st.stagger + st.duration, IDENTITY_FRAME, 0, 0);
    for (let a = 0; a < 3; a++) close(out[a], st.to[3 * i + a], 1e-4, `to ${i}.${a}`);
  }
});

test("retargeting mid-morph moves no dot", () => {
  const random = lcg(11);
  const frame = stackFrame(52, 24, [3, -2], [900, 400], 70);
  const a = randomState(400, random, 2, 1200);
  const now = a.start + 0.6;
  const s = snapshot(a, now, frame, 0.25);
  const b = randomState(400, random, now, 1200);
  b.from = s;
  // A dot's seed is fixed for its whole life (an attribute that never
  // changes), so its drift carries straight across a retarget.
  b.seed = a.seed;
  const before = new Float32Array(3);
  const after = new Float32Array(3);
  for (let i = 0; i < a.n; i++) {
    dotPosition(before, 0, a, i, now, frame, 0.25, 1.2);
    dotPosition(after, 0, b, i, now, IDENTITY_FRAME, 0.25, 1.2);
    for (let k = 0; k < 3; k++) close(after[k], before[k], 1e-3, `dot ${i}.${k}`);
  }
  // The snapshot is the drift-free base, so the new state's base starts on it.
  const again = snapshot(b, now, IDENTITY_FRAME, 0.25);
  for (let k = 0; k < s.length; k++) close(again[k], s[k], 1e-3, `base ${k}`);
});

test("streaming dots stay on their edge", () => {
  const st = randomState(1, lcg(5), 0, 10);
  st.to.set([10, 20, 0]);
  st.flow.set([0, 100, 0, 0.3]);
  const out = new Float32Array(3);
  for (let k = 0; k < 50; k++) {
    const now = 2 + k * 0.37;
    dotPosition(out, 0, st, 0, now, IDENTITY_FRAME, 0.25, 0);
    close(out[0], 10, 1e-4, "x");
    assert.ok(out[1] >= 20 - 1e-4 && out[1] <= 120 + 1e-4, `y ${out[1]}`);
  }
});

test("the stack frame matches the drawing's projection", () => {
  const random = lcg(17);
  const frame = stackFrame(40, 24, [0, 0], [0, 0], 1);
  const b = basis(40, 24);
  const st = randomState(1, random, 0, 0);
  st.flow.fill(0);
  const out = new Float32Array(3);
  for (let k = 0; k < 20; k++) {
    const p: Vec3 = [(random() - 0.5) * 4, (random() - 0.5) * 4, (random() - 0.5) * 4];
    st.to.set(p);
    dotPosition(out, 0, st, 0, 100, frame, 0, 0);
    const [x, y] = project(p, b);
    close(out[0], x, 1e-6, "x");
    close(out[1], -y, 1e-6, "y");
  }
});
