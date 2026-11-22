// Run with `npm test`. Inside the film one wheel gesture moves exactly one
// scene, the way the reference does it; the reading part scrolls natively.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decideWheel, NO_WHEEL_MEMORY, rememberWheel, type WheelContext, type WheelEventLike } from "./wheel.ts";
import { decodeWheel, FOUR_SWIPES, RESTING_FINGERS } from "./wheel.fixtures.ts";

// Three scenes, then the reading part's top, which is always the last stop.
const stops = [0, 720, 1440, 2160];
const base: Omit<WheelContext, "y"> = { stops, vh: 720, lastAt: -Infinity, moving: false, blocked: false };
const ev = (over: Partial<WheelEventLike> = {}): WheelEventLike => ({ deltaX: 0, deltaY: 100, ctrlKey: false, timeStamp: 1000, ...over });
const at = (y: number, over: Partial<Omit<WheelContext, "y">> = {}): WheelContext => ({ ...base, ...over, y });

test("passes zoom gestures, horizontal wheels, empty deltas and blocked targets", () => {
  assert.deepEqual(decideWheel(ev({ ctrlKey: true }), at(0)), { kind: "pass" });
  assert.deepEqual(decideWheel(ev({ deltaX: 50, deltaY: 10 }), at(0)), { kind: "pass" });
  assert.deepEqual(decideWheel(ev({ deltaY: 0 }), at(0)), { kind: "pass" });
  assert.deepEqual(decideWheel(ev(), at(0, { blocked: true })), { kind: "pass" });
});

test("passes inside the reading part and at its top going down", () => {
  assert.deepEqual(decideWheel(ev({ deltaY: -100 }), at(2500)), { kind: "pass" });
  assert.deepEqual(decideWheel(ev({ deltaY: 100 }), at(2160)), { kind: "pass" });
});

test("steps one scene down from a scene top", () => {
  assert.deepEqual(decideWheel(ev(), at(0)), { kind: "step", to: 720 });
});

test("steps back into the film from the reading part's top", () => {
  assert.deepEqual(decideWheel(ev({ deltaY: -100 }), at(2160)), { kind: "step", to: 1440 });
});

test("a 2,500 px delta is still one step", () => {
  assert.deepEqual(decideWheel(ev({ deltaY: 2500 }), at(0)), { kind: "step", to: 720 });
});

test("swallows the tail of a gesture", () => {
  assert.deepEqual(decideWheel(ev({ timeStamp: 1100 }), at(0, { lastAt: 1000 })), { kind: "swallow" });
  // Two hundred milliseconds after the last event is a new gesture.
  assert.deepEqual(decideWheel(ev({ timeStamp: 1100 }), at(0, { lastAt: 900 })), { kind: "step", to: 720 });
});

test("swallows while a step is still moving", () => {
  assert.deepEqual(decideWheel(ev(), at(0, { moving: true })), { kind: "swallow" });
});

test("swallows at the ends of the film", () => {
  assert.deepEqual(decideWheel(ev({ deltaY: -100 }), at(0)), { kind: "swallow" });
});

test("decides from the nearest stop when the page sits between two", () => {
  assert.deepEqual(decideWheel(ev(), at(700)), { kind: "step", to: 1440 });
});

// A scene taller than the screen (zoom, a small window, large text): the
// wheel scrolls through it, and steps only at its edges.
const tall = { stops: [0, 1200, 1920, 2640] };

test("scrolls through a scene taller than the screen, then steps at its bottom", () => {
  assert.deepEqual(decideWheel(ev(), at(0, tall)), { kind: "pass" });
  assert.deepEqual(decideWheel(ev(), at(480, tall)), { kind: "step", to: 1200 });
});

test("steps up into the bottom of a tall scene, then scrolls up through it", () => {
  assert.deepEqual(decideWheel(ev({ deltaY: -100 }), at(1200, tall)), { kind: "step", to: 480 });
  assert.deepEqual(decideWheel(ev({ deltaY: -100 }), at(480, tall)), { kind: "pass" });
});

test("never scrolls natively while a step is moving", () => {
  assert.deepEqual(decideWheel(ev({ deltaY: -100 }), at(300, { ...tall, moving: true })), { kind: "swallow" });
});

// ── A stream of events, as snap.ts runs them ─────────────────────────────
// The rule and its memory over a whole recording. A step scrolls for 540 ms
// (when the recording's first step reached scrollend; a reduced-motion step
// lands at once) and nothing steps again until it lands. Nine scenes, then
// the reading part. Returns when each step was taken, and where the page ends.
type Ev = { t: number; dy: number };
const film = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => k * 720);
function replay(events: Ev[], start = 0, landMs = 540): { steps: number[]; y: number } {
  let y = start;
  let memory = NO_WHEEL_MEMORY;
  let landsAt = -Infinity;
  const steps: number[] = [];
  for (const { t, dy } of events) {
    const e = { deltaX: 0, deltaY: dy, ctrlKey: false, timeStamp: t };
    const d = decideWheel(e, { y, stops: film, vh: 720, moving: t < landsAt, blocked: false, ...memory });
    memory = rememberWheel(memory, e, d);
    if (d.kind === "step") {
      steps.push(t);
      y = d.to;
      landsAt = t + landMs;
    }
  }
  return { steps, y };
}

/** One step for each swipe, each within 80 ms of the swipe's start, and the
 *  page where it should end. */
function assertSteps(r: { steps: number[]; y: number }, starts: number[], y: number) {
  assert.equal(r.steps.length, starts.length, `steps at ${r.steps.join(", ")}`);
  r.steps.forEach((t, k) => assert.ok(t >= starts[k] && t <= starts[k] + 80, `step ${k + 1} at ${t}, swipe at ${starts[k]}`));
  assert.equal(r.y, y);
}

/** A recording as a display at `hz` delivers it: Chrome sends the scroll of
 *  each frame as one event. `phase` shifts the frames. */
function framed(events: Ev[], hz: number, phase: number): Ev[] {
  const frame = 1000 / hz;
  const byFrame = new Map<number, number>();
  for (const e of events) {
    if (e.dy === 0) continue;
    const f = Math.ceil((e.t + phase) / frame);
    byFrame.set(f, (byFrame.get(f) ?? 0) + e.dy);
  }
  return [...byFrame].sort((a, b) => a[0] - b[0]).map(([f, dy]) => ({ t: f * frame - phase, dy }));
}

const fourSwipes = decodeWheel(FOUR_SWIPES);
const swipeStarts = [0, 1745, 2578, 3209];

test("a touchpad swipe and all of its momentum move one scene", () => {
  const first = fourSwipes.filter((e) => e.t < 1740);
  assert.deepEqual(replay(first), { steps: [0], y: 720 });
});

test("a new swipe during the last one's momentum moves on: four swipes, four scenes", () => {
  // Recorded: the old rule took all four as one gesture and moved once.
  assertSteps(replay(fourSwipes), swipeStarts, 2880);
});

test("fingers resting on the pad between swipes do not move the film", () => {
  // Recorded: four swipes up, with the fingers drifting at up to 2 px/ms
  // between the first two, and momentum that jumps after each lift.
  assertSteps(replay(decodeWheel(RESTING_FINGERS), 5760), [0, 1471, 2053, 2638], 2880);
});

test("with reduced motion a step lands at once, and a swipe is still one scene", () => {
  assertSteps(replay(fourSwipes, 0, 17), swipeStarts, 2880);
});

test("a 60 Hz or 120 Hz screen changes nothing: the same swipes, and resting fingers still do not count", () => {
  for (const hz of [60, 120]) {
    for (const k of [0, 1, 2, 3]) {
      const phase = (k * 1000) / hz / 4;
      assertSteps(replay(framed(fourSwipes, hz, phase)), swipeStarts, 2880);
      assertSteps(replay(framed(decodeWheel(RESTING_FINGERS), hz, phase), 5760), [0, 1471, 2053, 2638], 2880);
    }
  }
});

/** The page is busy from `from` for `ms`: Chrome holds the scroll and sends
 *  it as one event when the page is free again. */
function held(events: Ev[], from: number, ms: number): Ev[] {
  const px = events.filter((e) => e.t >= from && e.t < from + ms).reduce((sum, e) => sum + e.dy, 0);
  return [...events.filter((e) => e.t < from), { t: from + ms, dy: px }, ...events.filter((e) => e.t >= from + ms)];
}

// A Mac-like swipe: momentum that fades slowly, by 1.5% a frame.
const slowFade = [
  ...Array.from({ length: 10 }, (_, k) => ({ t: 7 * k, dy: 40 })),
  ...Array.from({ length: 200 }, (_, k) => ({ t: 70 + 7 * k, dy: Math.max(1, Math.round(40 * 0.985 ** k)) })),
];

test("a busy page holding the momentum back is not a new swipe", () => {
  const first = fourSwipes.filter((e) => e.t < 1740);
  for (const from of [560, 700, 900, 1200]) assert.deepEqual(replay(held(first, from, 100)), { steps: [0], y: 720 }, `held from ${from} ms`);
  // Held for 170 ms after the momentum has faded: one event with 170 ms of
  // scroll, which is only as fast as the momentum it belongs to.
  for (const from of [800, 900, 1000]) assert.deepEqual(replay(held(slowFade, from, 170)), { steps: [0], y: 720 }, `held from ${from} ms`);
});

test("fast momentum that has faded is not a new swipe, however fast it still is", () => {
  // 12 px/ms, then momentum fading by 1% a frame: below a quarter of its peak
  // but still above 2.3 px/ms for a while. It never speeds up again.
  const fast = [
    ...Array.from({ length: 10 }, (_, k) => ({ t: 7 * k, dy: 84 })),
    ...Array.from({ length: 300 }, (_, k) => ({ t: 70 + 7 * k, dy: Math.max(1, Math.round(84 * 0.99 ** k)) })),
  ];
  assert.deepEqual(replay(fast), { steps: [0], y: 720 });
});

test("a swipe that starts gently still counts", () => {
  // Its first moments are slow, so the speed it jumps from is measured before them.
  const first = fourSwipes.filter((e) => e.t < 1740);
  const gentle = [6, 10, 14, 19, 24, 28, 30, 30, 28, 24, 22, 20].map((dy, k) => ({ t: 1760 + 7 * k, dy }));
  assertSteps(replay([...first, ...gentle]), [0, 1760], 1440);
});

test("a mouse wheel rolled without a pause still moves one scene", () => {
  const roll = Array.from({ length: 40 }, (_, k) => ({ t: 40 * k, dy: 100 }));
  assert.deepEqual(replay(roll), { steps: [0], y: 720 });
  // Notches the browser coalesced into one event, after the step has landed.
  roll[20] = { t: 800, dy: 400 };
  assert.deepEqual(replay(roll), { steps: [0], y: 720 });
});

test("the momentum after a lift is not a new swipe, even once the step has landed", () => {
  // A slow swipe that outlasts the step's scroll, a lift (Chrome's zero-delta
  // event), a tiny first momentum event, then momentum near the swipe's speed.
  const swipe = Array.from({ length: 90 }, (_, k) => ({ t: 8 * k, dy: 30 }));
  const lift = [{ t: 720, dy: 0 }, { t: 726, dy: 1 }];
  const momentum = Array.from({ length: 60 }, (_, k) => ({ t: 733 + 8 * k, dy: Math.max(1, Math.round(36 * 0.94 ** k)) }));
  assert.deepEqual(replay([...swipe, ...lift, ...momentum]), { steps: [0], y: 720 });
});

test("a momentum event bunched up by late frames is not a new swipe", () => {
  // Each event carries the scroll since the last one, so momentum that
  // arrives three frames late is three times the size (recorded: -26 then
  // -53 fourteen milliseconds later). A long, slow momentum, as on a Mac.
  const swipe = Array.from({ length: 10 }, (_, k) => ({ t: 7 * k, dy: 40 }));
  const momentum = Array.from({ length: 140 }, (_, k) => ({ t: 70 + 7 * k, dy: Math.round(40 * 0.985 ** k) }));
  // Three frames come as one, 0.8 s in, once the momentum has faded to a quarter.
  const k = 100;
  const bunched = { t: momentum[k + 2].t, dy: momentum[k].dy + momentum[k + 1].dy + momentum[k + 2].dy };
  assert.deepEqual(replay([...swipe, ...momentum.slice(0, k), bunched, ...momentum.slice(k + 3)]), { steps: [0], y: 720 });
});

test("a swipe back the other way, while the momentum fades, moves back", () => {
  const down = fourSwipes.filter((e) => e.t < 1740);
  const up = Array.from({ length: 12 }, (_, k) => ({ t: 1760 + 7 * k, dy: -40 }));
  assertSteps(replay([...down, ...up]), [0, 1760], 0);
});
