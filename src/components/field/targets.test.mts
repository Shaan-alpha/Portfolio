// Run with `npm test`. Every scene is a list of targets, one per dot, built
// from the same geometry the page draws. Yellow means a model runs here, so
// only model parts may hold yellow dots.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EXIT_PX,
  PACKET_DOTS,
  STREAM_PX_PER_S,
  flowTargets,
  lineAlpha,
  lineTargets,
  rng,
  slotLabelTops,
  stackTargets,
  type FlowInput,
  type FlowNode,
  type Targets,
} from "./targets.ts";
import { CUBE, slotY } from "../stack/geometry.ts";
import { MODE } from "./morph.ts";
import { BEHAVIOURS } from "./behaviours.ts";
import { flagship } from "../../content/projects.ts";

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

test("consecutive scenes send each part to its counterpart", () => {
  // Dot i keeps its index from scene to scene. The plates must become the
  // thesis rail and the cube its model step; a grey dot never turns yellow.
  const n = 16000;
  const wide = { w: 1536, h: 720 };
  const text = [{ x: 0, y: 0, w: 620, h: 720 }];
  const stack = stackTargets(n, rng(1));
  const rail = flowTargets(
    n,
    [{ radius: 24, nodes: (["io", "grid", "model", "guard", "human", "io"] as const).map((kind, k) => ({ x: 1000, y: 170 + k * 80, kind })) }],
    wide,
    text,
    rng(2),
  );
  const lanes = flowTargets(
    n,
    [
      ["io", "step", "step", "model", "io"],
      ["io", "model", "guard", "step", "io"],
      ["io", "model", "model", "guard", "human", "step"],
      ["io", "model", "human", "model", "guard", "model", "io"],
      ["guard", "model", "io"],
      ["io", "guard", "model", "step", "guard"],
    ].map((kinds, lane) => ({ radius: 10, nodes: kinds.map((kind, k) => ({ x: 700 + lane * 110, y: 260 + k * 34, kind: kind as "io" })) })),
    wide,
    text,
    rng(3),
  );
  let railSystem = 0;
  let fromPlates = 0;
  for (let i = 0; i < n; i++) {
    if (rail.kind[i] === 2) assert.equal(stack.kind[i], 2, `rail model dot ${i} came from a non-model dot`);
    if (rail.kind[i] === 1) {
      railSystem++;
      assert.notEqual(stack.kind[i], 2, `rail dot ${i} came from the cube`);
      if (stack.kind[i] === 1) fromPlates++;
    }
    if (lanes.kind[i] === 2) assert.notEqual(rail.kind[i], 1, `grey rail dot ${i} turned yellow`);
  }
  assert.ok(fromPlates / railSystem >= 0.9, `${fromPlates} of ${railSystem} rail dots came from the plates`);
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

// ── The six systems ──────────────────────────────────────────────────────
// Each system's flows laid out as its scene lays them out: top to bottom, a
// second flow beside the first. Each test is named after what the spec says
// that system's dots must show, taken from the system's own text.

const R = 20;

function scene(id: string) {
  const p = flagship.find((q) => q.id === id);
  if (!p?.flows) throw new Error(`no flows for ${id}`);
  const flows: FlowInput[] = p.flows.map((f, fi) => ({
    radius: R,
    nodes: f.steps.map((s, k) => ({ x: 900 + 260 * fi, y: 140 + 70 * k, kind: s.kind, step: s.label })),
  }));
  const t = flowTargets(16000, flows, { w: 1440, h: 900 }, [{ x: 0, y: 0, w: 600, h: 900 }], rng(9), BEHAVIOURS[id]);
  const nodes = flows.flatMap((f) => f.nodes);
  const node = (label: string) => {
    const n = nodes.find((m) => m.step === label);
    if (!n) throw new Error(`no step ${label}`);
    return n;
  };
  return { t, flows, node, groupOf: (label: string) => nodes.indexOf(node(label)) };
}

/** The dots of one step's shape. */
const dotsOf = (t: Targets, group: number) => [...Array(t.n).keys()].filter((i) => t.group[i] === group);

const moving = (t: Targets, i: number) => t.flow[4 * i] !== 0 || t.flow[4 * i + 1] !== 0;

/** The dots on the edge from step a to step b: they start beside a and end beside b. */
function edgeDots(t: Targets, a: FlowNode, b: FlowNode): number[] {
  const near = 1.6 * R;
  const out: number[] = [];
  for (let i = 0; i < t.n; i++) {
    if (t.group[i] !== -1 || !moving(t, i)) continue;
    const [sx, sy] = [t.to[3 * i], t.to[3 * i + 1]];
    const [ex, ey] = [sx + t.flow[4 * i], sy + t.flow[4 * i + 1]];
    if (Math.hypot(sx - a.x, sy - a.y) <= near && Math.hypot(ex - b.x, ey - b.y) <= near) out.push(i);
  }
  return out;
}

/** Edge dots that leave from a step's centre (a guard's edges start there). */
const leaving = (t: Targets, a: FlowNode) =>
  [...Array(t.n).keys()].filter((i) => t.group[i] === -1 && moving(t, i) && Math.hypot(t.to[3 * i] - a.x, t.to[3 * i + 1] - a.y) <= 4);

/** How many packets: the dots of one packet share their phase exactly. */
const packets = (t: Targets, idx: number[]) =>
  new Set(
    idx.map((i) => {
      const p = t.flow[4 * i + 3];
      return (p - Math.floor(p)).toFixed(4);
    }),
  ).size;

test("Skill Issue: the score is a rigid grid, and the narrator moves freely beside it", () => {
  const { t, node, groupOf } = scene("skill-issue");
  const score = dotsOf(t, groupOf("Score"));
  assert.ok(score.length > 0, "the score has dots");
  const xs = new Set(score.map((i) => t.to[3 * i].toFixed(3)));
  const ys = new Set(score.map((i) => t.to[3 * i + 1].toFixed(3)));
  assert.equal(xs.size, 10, "ten columns");
  assert.equal(ys.size, 10, "ten rows");
  for (const i of score) assert.equal(t.wander[i], 0, `score dot ${i} drifts`);
  const s = node("Score");
  const half = Math.max(1.6 * R, 36) / 2 + 2;
  const narrate = dotsOf(t, groupOf("Narrate"));
  assert.ok(narrate.length > 0, "the narrator has dots");
  for (const i of narrate) {
    assert.equal(t.kind[i], 2, `narrator dot ${i} is not yellow`);
    assert.ok(t.wander[i] >= 2, `narrator dot ${i} barely moves`);
    const [x, y] = [t.to[3 * i], t.to[3 * i + 1]];
    assert.ok(Math.abs(x - s.x) > half || Math.abs(y - s.y) > half, `narrator dot ${i} is inside the grid`);
  }
});

test("Atlas: the briefing passes the salience check one packet at a time", () => {
  const { t, node } = scene("atlas");
  const out = edgeDots(t, node("Salience check"), node("Briefing"));
  assert.ok(out.length >= PACKET_DOTS, `${out.length} dots past the check`);
  for (const i of out) assert.equal(t.loop[4 * i], MODE.packet);
  assert.equal(packets(t, out), 1);
  const message = ["Telegram chat", "Gemini loop", "User-scoped tools", "Market data", "Reply"];
  for (let k = 0; k + 1 < message.length; k++) {
    const e = edgeDots(t, node(message[k]), node(message[k + 1]));
    assert.ok(e.length > 0, `${message[k]} streams`);
    for (const i of e) assert.equal(t.loop[4 * i], MODE.stream, `${message[k]}: dot ${i}`);
  }
  // A reduced-motion visitor sees the moment the table names, in seconds.
  assert.ok(Math.abs(t.still - BEHAVIOURS.atlas.still * BEHAVIOURS.atlas.period) < 1e-9, `still ${t.still}`);
});

test("Syntrueno: five posts, an arriving approval, one packet, then a pulse", () => {
  const { t, node, groupOf } = scene("syntrueno");
  const g = node("Five guards");
  const bands = new Map<number, Set<number>>();
  for (const i of dotsOf(t, groupOf("Five guards"))) {
    const band = Math.round((t.to[3 * i + 1] - g.y) / (0.45 * R));
    const side = Math.sign(t.to[3 * i] - g.x);
    bands.set(band, (bands.get(band) ?? new Set<number>()).add(side));
  }
  assert.deepEqual([...bands.keys()].sort((a, b) => a - b), [-2, -1, 0, 1, 2], "five posts, top to bottom");
  const sides = [-2, -1, 0, 1, 2].map((b) => {
    const s = bands.get(b);
    assert.equal(s?.size, 1, `post ${b} sits on one side`);
    return [...(s ?? [])][0];
  });
  for (let k = 1; k < 5; k++) assert.notEqual(sides[k], sides[k - 1], "the posts alternate sides");
  assert.ok(dotsOf(t, groupOf("Human gate")).some((i) => t.loop[4 * i] === MODE.arrive), "an approval arrives");
  const out = edgeDots(t, node("Human gate"), node("Execute and verify"));
  assert.ok(out.length > 0);
  for (const i of out) assert.equal(t.loop[4 * i], MODE.packet);
  assert.equal(packets(t, out), 1, "exactly one packet goes on");
  const exec = dotsOf(t, groupOf("Execute and verify"));
  assert.ok(exec.length > 0);
  for (const i of exec) {
    assert.equal(t.loop[4 * i], MODE.pulse);
    assert.ok(Math.abs(t.loop[4 * i + 2] - 0.64) < 1e-6);
  }
});

test("AI Reel Factory: a spread of six pitches, and at most three continue", () => {
  const { t, node } = scene("ai-reel-factory");
  const rp = node("Research and pitch");
  const pitch = edgeDots(t, rp, node("Approve"));
  assert.equal(packets(t, pitch), 6, "six pitches");
  const lateral = pitch.map((i) => t.to[3 * i] - rp.x);
  assert.ok(Math.max(...lateral) - Math.min(...lateral) >= R, "spread across the edge");
  const after = ["Approve", "Script", "Fact-check", "Voice and B-roll", "Edit and publish"];
  for (let k = 0; k + 1 < after.length; k++) {
    const e = edgeDots(t, node(after[k]), node(after[k + 1]));
    assert.equal(packets(t, e), 3, `${after[k]} to ${after[k + 1]}`);
  }
  // Through the fact-check gate, never around it: its edges meet at its centre.
  const fc = node("Fact-check");
  for (const i of edgeDots(t, node("Script"), fc)) {
    const d = Math.hypot(t.to[3 * i] + t.flow[4 * i] - fc.x, t.to[3 * i + 1] + t.flow[4 * i + 1] - fc.y);
    assert.ok(d <= 4, `a packet ends ${d} px from the gate`);
  }
  for (const i of edgeDots(t, fc, node("Voice and B-roll"))) {
    const d = Math.hypot(t.to[3 * i] - fc.x, t.to[3 * i + 1] - fc.y);
    assert.ok(d <= 4, `a packet leaves ${d} px from the gate`);
  }
});

test("VouchRank: the audit runs inside its workspace, and consent filters nothing", () => {
  const { t, flows, node, groupOf } = scene("vouchrank");
  const box = dotsOf(t, groupOf("Agency workspace"));
  const xs = box.map((i) => t.to[3 * i]);
  const ys = box.map((i) => t.to[3 * i + 1]);
  for (const n of flows[0].nodes) {
    assert.ok(n.x > Math.min(...xs) && n.x < Math.max(...xs), `${n.step} is inside the box across`);
    assert.ok(n.y > Math.min(...ys) && n.y < Math.max(...ys), `${n.step} is inside the box down`);
  }
  const exit = leaving(t, node("Consent")).filter((i) => t.flow[4 * i + 1] > 0);
  assert.ok(exit.length > 0, "the stream carries on past consent");
  for (const i of exit) {
    assert.equal(t.loop[4 * i], MODE.stream);
    assert.ok(Math.abs(Math.hypot(t.flow[4 * i], t.flow[4 * i + 1]) - EXIT_PX) < 1, "an exit runs EXIT_PX");
  }
});

test("Think9 Brain: part of the stream is held back, and some answers turn back", () => {
  const { t, node } = scene("think9-brain");
  const r = node("Retrieve");
  const into = edgeDots(t, node("Question"), r);
  const held = into.filter((i) => t.loop[4 * i] === MODE.hold);
  assert.ok(held.length > 0, "some of the stream is held");
  assert.ok(into.some((i) => t.loop[4 * i] === MODE.stream), "the rest streams on");
  for (const i of held) {
    const ey = t.to[3 * i + 1] + t.flow[4 * i + 1];
    assert.ok(r.y - ey >= 0.9 * R - 2, `a held dot rests ${r.y - ey} px above the gate`);
  }
  const back = edgeDots(t, node("Cite"), node("Answer or refuse")).filter((i) => t.loop[4 * i] === MODE.bounce);
  assert.equal(packets(t, back), 2, "two packets turn back");
  assert.ok(leaving(t, node("Answer or refuse")).some((i) => t.flow[4 * i + 1] > 0), "answers carry on out");
});

test("every system keeps yellow on its models and fills its blocks", () => {
  const modelEnd = Math.round(16000 * 0.14);
  for (const p of flagship) {
    const { t, flows } = scene(p.id);
    assert.equal(t.n, 16000);
    const models = flows.flatMap((f) => f.nodes).filter((n) => n.kind === "model");
    for (let i = 0; i < t.n; i++) {
      if (t.kind[i] !== 2) continue;
      assert.ok(i < modelEnd, `${p.id}: yellow dot ${i} outside the model block`);
      const [x, y] = [t.to[3 * i], t.to[3 * i + 1]];
      assert.ok(models.some((n) => Math.hypot(x - n.x, y - n.y) <= 1.3 * R + 0.5), `${p.id}: yellow dot ${i} is off the models`);
    }
  }
});

test("streams keep a steady speed on the screen", () => {
  const { t } = scene("atlas");
  let checked = 0;
  for (let i = 0; i < t.n; i++) {
    if (t.loop[4 * i] !== MODE.stream || !moving(t, i)) continue;
    const len = Math.hypot(t.flow[4 * i], t.flow[4 * i + 1]);
    if (len < 24) continue;
    assert.ok(Math.abs(t.loop[4 * i + 1] * len - STREAM_PX_PER_S) < 1e-3, `dot ${i} runs ${t.loop[4 * i + 1] * len} px/s`);
    checked++;
  }
  assert.ok(checked > 0, "some streams were checked");
});

test("the handoff is one hairline", () => {
  const t = lineTargets(5000, 64.5, 1440);
  assert.equal(t.n, 5000);
  assert.equal(t.frame, "screen");
  for (let i = 0; i < t.n; i++) {
    assert.equal(t.to[3 * i + 1], 64.5);
    assert.ok(t.to[3 * i] >= 0 && t.to[3 * i] <= 1440, `x ${t.to[3 * i]}`);
    assert.equal(t.kind[i], 3);
    assert.equal(t.wander[i], 0);
  }
  for (const dark of [false, true]) {
    const a = lineAlpha(16000, 1440, dark);
    assert.ok(a > 0.02 && a < 0.6, `${dark ? "dark" : "light"}: ${a}`);
  }
});

test("the hairline keeps each dot's place across the screen", () => {
  // Dots drop onto the line where they already are, so nothing, the yellow
  // dots least of all, sweeps across the page on the way.
  const random = rng(5);
  const n = 3000;
  const from = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    from[3 * i] = random() * 1440;
    from[3 * i + 1] = random() * 900;
  }
  const t = lineTargets(n, 64.5, 1440, from);
  const byX = [...Array(n).keys()].sort((a, b) => from[3 * a] - from[3 * b]);
  for (let k = 1; k < n; k++) assert.ok(t.to[3 * byX[k]] > t.to[3 * byX[k - 1]], `dot ${byX[k]} is out of order on the line`);
  assert.ok(t.to[3 * byX[0]] < 1 && t.to[3 * byX[n - 1]] > 1439, "the line still spans the screen");
});
