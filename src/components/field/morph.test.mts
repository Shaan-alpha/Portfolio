// Run with `npm test`. The field's motion is a pure function of time. The
// vertex shader evaluates these same formulas, and the CPU uses them to work
// out where every dot is when a scene changes, so a new morph starts exactly
// where the dots are.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  IDENTITY_FRAME,
  MODE,
  cycle,
  dotPosition,
  dotProgress,
  ease,
  pulseFactor,
  shownVisibility,
  snapshot,
  stackFrame,
  travel,
  visibility,
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
  const loop = new Float32Array(4 * n);
  for (let i = 0; i < n; i++) {
    // Half the dots stream along an edge, half sit still.
    if (i % 2) {
      flow[4 * i] = (random() - 0.5) * 2;
      flow[4 * i + 1] = (random() - 0.5) * 2;
      flow[4 * i + 2] = 0;
      loop.set([MODE.stream, 0.25, 0, 1], 4 * i);
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
    loop,
    wander: new Float32Array(n).fill(1),
    start,
    duration: 0.95,
    stagger: 0.45,
  };
}

/** Dots running every program in turn, each with its own window and rate. */
function programState(n: number, random: () => number, start: number, spread: number, wanders: number[]): MorphState {
  const st = randomState(n, random, start, spread);
  const modes = [MODE.stream, MODE.packet, MODE.hold, MODE.bounce, MODE.pulse, MODE.arrive];
  for (let i = 0; i < n; i++) {
    const a = 0.1 + random() * 0.4;
    st.loop.set([modes[i % modes.length], 0.2 + random() * 0.3, a, a + 0.2 + random() * 0.3], 4 * i);
    st.flow.set([(random() - 0.5) * 60, (random() - 0.5) * 60, 0, random()], 4 * i);
    st.wander[i] = wanders[i % wanders.length];
  }
  return st;
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

test("a stream runs its edge once per cycle", () => {
  assert.equal(travel(MODE.stream, 0.3, 0, 1), 0.3);
  close(cycle(0.9, 0.25, 2), 0.4, 1e-9, "cycle");
  // Before a scene's loop starts its clock is negative; the cycle still runs on.
  close(cycle(0.2, 0.5, -1), 0.7, 1e-9, "negative clock");
});

test("a packet waits at its gate, crosses in its window and rests at the end", () => {
  assert.equal(travel(MODE.packet, 0.2, 0.5, 0.8), 0);
  close(travel(MODE.packet, 0.65, 0.5, 0.8), 0.5, 1e-9, "midway");
  assert.equal(travel(MODE.packet, 0.8, 0.5, 0.8), 1);
  assert.equal(travel(MODE.packet, 0.95, 0.5, 0.8), 1);
  // Held and arriving dots travel the same way; only how they look differs.
  close(travel(MODE.hold, 0.65, 0.5, 0.8), 0.5, 1e-9, "hold");
  close(travel(MODE.arrive, 0.65, 0.5, 0.8), 0.5, 1e-9, "arrive");
});

test("a bounce goes out and comes back inside its window", () => {
  assert.equal(travel(MODE.bounce, 0.2, 0.3, 0.8), 0);
  close(travel(MODE.bounce, 0.55, 0.3, 0.8), 1, 1e-9, "the turn");
  close(travel(MODE.bounce, 0.8, 0.3, 0.8), 0, 1e-9, "back home");
  assert.equal(travel(MODE.bounce, 0.9, 0.3, 0.8), 0);
  const out = travel(MODE.bounce, 0.425, 0.3, 0.8);
  assert.ok(out > 0 && out < 1, String(out));
});

test("a pulse is still before its start, swings, then settles", () => {
  const rate = 1 / 3.6;
  assert.equal(pulseFactor(0.4, 0.62, rate), 0);
  let peak = 0;
  for (let c = 0.62; c <= 0.8; c += 0.002) peak = Math.max(peak, Math.abs(pulseFactor(c, 0.62, rate)));
  assert.ok(peak >= 0.1, `peak ${peak}`);
  assert.ok(Math.abs(pulseFactor(0.999, 0.62, rate)) < 0.02, "settled");
  assert.equal(travel(MODE.pulse, 0.7, 0.62, 0.62), 0);
});

test("a resting packet is hidden and a held dot stays visible until its cycle ends", () => {
  assert.equal(visibility(MODE.packet, 0.2, 0, 0.5, 0.8, true), 0);
  assert.equal(visibility(MODE.packet, 0.65, 0.5, 0.5, 0.8, true), 1);
  assert.equal(visibility(MODE.hold, 0.6, 1, 0, 0.35, true), 1);
  assert.ok(visibility(MODE.hold, 0.99, 1, 0, 0.35, true) < 0.1);
  assert.equal(visibility(MODE.stream, 0.5, 0.5, 0, 1, true), 1);
  assert.ok(visibility(MODE.stream, 0.01, 0.01, 0, 1, true) < 0.2);
  assert.equal(visibility(MODE.stream, 0.01, 0.01, 0, 1, false), 1);
  assert.equal(visibility(MODE.pulse, 0.3, 0, 0.6, 0.6, false), 1);
});

test("a rigid dot never drifts", () => {
  const st = randomState(1, lcg(5), 0, 10);
  st.flow.fill(0);
  st.loop.fill(0);
  st.to.set([10, 20, 0]);
  st.duration = 0;
  const at = (now: number) => {
    const out = new Float32Array(3);
    dotPosition(out, 0, st, 0, now, IDENTITY_FRAME, now, 1.2);
    return [...out];
  };
  st.wander[0] = 0;
  assert.deepEqual(at(3), at(4.1));
  assert.deepEqual(at(3), at(7.7));
  st.wander[0] = 1;
  assert.notDeepEqual(at(3), at(4.1));
});

test("retargeting mid-morph moves no dot", () => {
  const random = lcg(11);
  const frame = stackFrame(52, 24, [3, -2], [900, 400], 70);
  const a = programState(600, random, 2, 1200, [1, 3, 0]);
  const now = a.start + 0.6;
  const s = snapshot(a, now, frame, now - 1.3, 1.2);
  // The next scene: new programs, new wander, and its own loop clock.
  const b = programState(600, random, now, 1200, [0, 1, 3]);
  b.from = s;
  // A dot's seed is fixed for its whole life (an attribute that never changes).
  b.seed = a.seed;
  const out = new Float32Array(3);
  for (let i = 0; i < a.n; i++) {
    dotPosition(out, 0, b, i, now, IDENTITY_FRAME, -0.7, 1.2);
    for (let k = 0; k < 3; k++) close(out[k], s[3 * i + k], 1e-3, `dot ${i}.${k}`);
  }
});

test("visibility carries across a retarget", () => {
  const random = lcg(23);
  const a = programState(300, random, 1, 800, [1]);
  const now = a.start + 0.7;
  const visFromA = Float32Array.from({ length: a.n }, random);
  const b = programState(300, random, now, 800, [1]);
  const visFromB = Float32Array.from({ length: a.n }, (_, i) => shownVisibility(a, i, now, 2.2, visFromA));
  for (let i = 0; i < b.n; i++) close(shownVisibility(b, i, now, 0.4, visFromB), visFromB[i], 1e-9, `dot ${i}`);
  // Once it has arrived, a dot shows its own program's visibility.
  const later = now + b.stagger + b.duration + 0.01;
  for (let i = 0; i < b.n; i++) {
    const [mode, rate, lo, hi] = b.loop.subarray(4 * i, 4 * i + 4);
    const c = cycle(b.flow[4 * i + 3], rate, 0.9);
    const moving = b.flow[4 * i] !== 0 || b.flow[4 * i + 1] !== 0 || b.flow[4 * i + 2] !== 0;
    const own = visibility(mode, c, travel(mode, c, lo, hi), lo, hi, moving);
    close(shownVisibility(b, i, later, 0.9, visFromB), own, 1e-9, `arrived ${i}`);
  }
});

test("a frozen loop clock holds every dot still", () => {
  // Reduced motion: every shape is final and the loop clock stops on a still.
  const st = programState(200, lcg(31), 0, 500, [1]);
  st.duration = 0;
  const ref = snapshot(st, 3, IDENTITY_FRAME, 1.7, 0);
  for (const now of [4.2, 9.9]) {
    const s = snapshot(st, now, IDENTITY_FRAME, 1.7, 0);
    for (let k = 0; k < s.length; k++) close(s[k], ref[k], 1e-9, `${now}: ${k}`);
  }
});

test("snapshot fills the buffer it is given", () => {
  const st = randomState(10, lcg(2), 0, 10);
  const out = new Float32Array(30);
  assert.equal(snapshot(st, 1, IDENTITY_FRAME, 1, 0, out), out);
});

test("streaming dots stay on their edge", () => {
  const st = randomState(1, lcg(5), 0, 10);
  st.to.set([10, 20, 0]);
  st.flow.set([0, 100, 0, 0.3]);
  st.loop.set([MODE.stream, 0.25, 0, 1]);
  const out = new Float32Array(3);
  for (let k = 0; k < 50; k++) {
    const now = 2 + k * 0.37;
    dotPosition(out, 0, st, 0, now, IDENTITY_FRAME, now, 0);
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
