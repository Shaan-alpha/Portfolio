// Run with `npm test`. Inside the film one wheel gesture moves exactly one
// scene, the way the reference does it; the reading part scrolls natively.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decideWheel, type WheelContext, type WheelEventLike } from "./wheel.ts";

// Three scenes, then the reading part's top, which is always the last stop.
const stops = [0, 720, 1440, 2160];
const base: Omit<WheelContext, "y"> = { stops, lastAt: -Infinity, moving: false, blocked: false };
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
