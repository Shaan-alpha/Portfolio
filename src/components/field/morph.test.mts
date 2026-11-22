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
  shownLook,
  snapshot,
  stackFrame,
  travel,
  visibility,
  type Frame,
  type MorphState,
  type Overlay,
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

/** Each dot's target kind: 0 dust, 1 system, 2 model, 3 line. */
const kinds = (n: number, random: () => number) => Float32Array.from({ length: n }, () => Math.floor(random() * 4));

/** Each dot's highlight group: a step's index, or -1 for dust and edges. */
const groups = (n: number, random: () => number) => Float32Array.from({ length: n }, () => Math.floor(random() * 7) - 1);

/** A group no dot carries: what the field lights once a scene has changed. */
const NONE = -1e4;

/** What a scene change hands a morph, as if every dot were caught mid-morph:
 *  a blend of kinds (weights summing to 1), visibility, and four tints: ink,
 *  grey, highlight and mask (15% to 100%). */
function randomCarry(n: number, random: () => number) {
  const look = new Float32Array(4 * n);
  const tint = new Float32Array(4 * n);
  for (let i = 0; i < n; i++) {
    const w = [random(), random(), random(), random()];
    const sum = w[0] + w[1] + w[2] + w[3];
    for (let q = 0; q < 4; q++) look[4 * i + q] = w[q] / sum;
    tint.set([random(), random(), random(), 0.15 + 0.85 * random()], 4 * i);
  }
  return {
    visFrom: Float32Array.from({ length: n }, random),
    progress: new Float32Array(n),
    look,
    tint,
  };
}

/** Is (x, y) inside one of the rects (x, y, width, height, four numbers each)? */
function insideAny(masks: number[], x: number, y: number) {
  for (let k = 0; k < masks.length; k += 4) {
    if (x >= masks[k] && x <= masks[k] + masks[k + 2] && y >= masks[k + 1] && y <= masks[k + 1] + masks[k + 3]) return true;
  }
  return false;
}

const copyCarry = (c: ReturnType<typeof randomCarry>) => ({
  visFrom: Float32Array.from(c.visFrom),
  progress: Float32Array.from(c.progress),
  look: Float32Array.from(c.look),
  tint: Float32Array.from(c.tint),
});

/** Every dot's nine shown values: four kind weights, visibility, ink, grey,
 *  highlight and mask, with the scene's lit group and mask rects. */
function looks(st: MorphState, now: number, clock: number, carry: ReturnType<typeof randomCarry>, at: { frame: Frame; drift: number; overlay: Overlay }) {
  return Array.from({ length: st.n }, (_, i) => {
    const out = new Float32Array(9);
    shownLook(st, i, now, clock, carry, out, at);
    return out;
  });
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

test("a retarget keeps each dot's look", () => {
  // A fast reader steps again mid-morph, with a phrase's part lit and the
  // copy masking the dots behind it. At that moment every dot must show the
  // same colour, size and brightness in the new morph as in the old one: the
  // old scene's highlight and masks are carried, the new scene's are not yet
  // shown.
  const random = lcg(53);
  const frame = stackFrame(52, 24, [3, -2], [900, 400], 70);
  const a = programState(600, random, 2, 1200, [1, 3, 0]);
  a.kind = kinds(a.n, random);
  a.group = groups(a.n, random);
  const now = a.start + 0.6;
  const before = randomCarry(a.n, random);
  const left: Overlay = { group: 3, amount: 0.8, masks: [700, 250, 300, 260, -600, -600, 500, 700] };
  const shown = looks(a, now, 1.3, before, { frame, drift: 1.2, overlay: left });
  // The scene change: one snapshot pass records what each dot shows now.
  const carry = copyCarry(before);
  const s = snapshot(a, now, frame, 1.3, 1.2, undefined, carry, left);
  const b = programState(600, random, now, 1200, [0, 1, 3]);
  b.from = s;
  b.seed = a.seed;
  b.kind = kinds(b.n, random);
  b.group = groups(b.n, random);
  const entered: Overlay = { group: NONE, amount: 0, masks: [100, 100, 900, 500] };
  const out = new Float32Array(9);
  for (let i = 0; i < b.n; i++) {
    shownLook(b, i, now, -0.7, carry, out, { frame: IDENTITY_FRAME, drift: 1.2, overlay: entered });
    for (let k = 0; k < 9; k++) close(out[k], shown[i][k], 1e-6, `dot ${i}, value ${k}`);
  }
  // The old scene's highlight and masks really were showing on some dots.
  assert.ok(shown.some((v) => v[7] > 0.1), "some dots lit");
  assert.ok(shown.some((v) => v[8] < 0.9), "some dots masked");
});

test("an arrived dot shows its own kind, ink, grey, highlight and mask", () => {
  // Whatever a dot looked like when its morph began, once it has arrived it
  // looks like its own kind, program and scene, and nothing of the old look
  // is left.
  const random = lcg(59);
  const st = programState(300, random, 1, 800, [1]);
  st.kind = kinds(st.n, random);
  st.group = groups(st.n, random);
  const carry = randomCarry(st.n, random);
  const later = st.start + st.stagger + st.duration + 0.01;
  const clock = 2.6;
  const masks = [-10, -40, 50, 80];
  const overlay: Overlay = { group: 2, amount: 0.7, masks };
  // Ink by program: stream, packet, hold, bounce, pulse, arrive.
  const INK = [0, 1, 0, 1, 0, 1];
  const out = new Float32Array(9);
  const pos = new Float32Array(3);
  let masked = 0;
  for (let i = 0; i < st.n; i++) {
    shownLook(st, i, later, clock, carry, out, { frame: IDENTITY_FRAME, drift: 0, overlay });
    for (let q = 0; q < 4; q++) close(out[q], q === st.kind[i] ? 1 : 0, 1e-6, `dot ${i}, weight ${q}`);
    const [mode, rate, lo, hi] = st.loop.subarray(4 * i, 4 * i + 4);
    const v = st.flow[4 * i + 3] + clock * rate;
    const c = v - Math.floor(v);
    close(out[4], visibility(mode, c, travel(mode, c, lo, hi), lo, hi, true), 1e-6, `dot ${i}, visibility`);
    close(out[5], INK[mode], 1e-6, `dot ${i}, ink`);
    // A held dot greys over the tenth of a cycle after its window ends.
    const g = Math.min(1, Math.max(0, (c - hi) / 0.1));
    close(out[6], mode === MODE.hold ? g * g * (3 - 2 * g) : 0, 1e-6, `dot ${i}, grey`);
    // Lit as much as the scene lights its group; 15% inside a mask rect.
    close(out[7], st.group[i] === 2 ? 0.7 : 0, 1e-6, `dot ${i}, highlight`);
    dotPosition(pos, 0, st, i, later, IDENTITY_FRAME, clock, 0);
    const inside = insideAny(masks, pos[0], pos[1]);
    if (inside) masked++;
    close(out[8], inside ? 0.15 : 1, 1e-6, `dot ${i}, mask`);
  }
  assert.ok(masked > 0 && masked < st.n, `${masked} of ${st.n} dots masked`);
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

test("one pass carries each dot's look and progress with its position", () => {
  // A scene change does this for every dot, so it does it once: the same
  // nine numbers as `shownLook`, from a single walk over the dots.
  const random = lcg(41);
  const st = programState(500, random, 3, 900, [0, 1, 3]);
  st.kind = kinds(st.n, random);
  st.group = groups(st.n, random);
  const now = st.start + 0.5;
  const before = randomCarry(st.n, random);
  const overlay: Overlay = { group: 1, amount: 0.6, masks: [-200, -150, 300, 260] };
  const want = looks(st, now, 1.9, before, { frame: IDENTITY_FRAME, drift: 1.2, overlay });
  const carry = copyCarry(before);
  const s = snapshot(st, now, IDENTITY_FRAME, 1.9, 1.2, undefined, carry, overlay);
  const alone = snapshot(st, now, IDENTITY_FRAME, 1.9, 1.2);
  for (let i = 0; i < st.n; i++) {
    for (let q = 0; q < 4; q++) close(carry.look[4 * i + q], want[i][q], 1e-6, `look ${i}.${q}`);
    close(carry.visFrom[i], want[i][4], 1e-6, `visibility ${i}`);
    for (let q = 0; q < 4; q++) close(carry.tint[4 * i + q], want[i][5 + q], 1e-6, `tint ${i}.${q}`);
    close(carry.progress[i], dotProgress(now, st.start, st.delay[i], st.duration, st.stagger), 1e-6, `progress ${i}`);
  }
  for (let k = 0; k < s.length; k++) close(s[k], alone[k], 1e-9, `position ${k}`);
});
