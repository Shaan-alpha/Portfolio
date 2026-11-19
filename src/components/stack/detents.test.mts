// Run with `npm test`. The counter behind the model's dial ticks: one tick
// each time the visitor's own rotation clicks over into a new 15° notch. Like
// a real detent it has hysteresis: it takes 65% of a notch to click over, so
// a finger resting near the halfway point cannot make it chatter.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createDetents } from "./detents.ts";

test("rest and most of a notch either way are silent", () => {
  const d = createDetents(15);
  assert.equal(d(0), false);
  assert.equal(d(9.7), false);
  assert.equal(d(-9.7), false);
});

test("clicking over into the next notch ticks once", () => {
  const d = createDetents(15);
  assert.equal(d(9.8), true);
  assert.equal(d(14), false);
  assert.equal(d(24.7), false);
  assert.equal(d(24.8), true);
});

test("turning back ticks too", () => {
  const d = createDetents(15);
  assert.equal(d(-9.8), true);
  assert.equal(d(0), true);
});

test("a jump across several notches ticks once", () => {
  const d = createDetents(15);
  assert.equal(d(100), true);
  assert.equal(d(100), false);
});

test("jitter around the halfway point does not chatter", () => {
  const d = createDetents(15);
  const ticks = [7.4, 7.6, 7.4, 7.6, 7.4, 7.6].filter((a) => d(a)).length;
  assert.equal(ticks, 0);
});

test("jitter just past a click-over does not click back", () => {
  const d = createDetents(15);
  assert.equal(d(9.8), true);
  const ticks = [9.6, 9.9, 7.4, 9.8, 5.3].filter((a) => d(a)).length;
  assert.equal(ticks, 0);
});
