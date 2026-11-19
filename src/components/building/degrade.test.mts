// Run with `npm test`. On a GPU that cannot keep up, the scene steps down
// once at a time: post-processing off first, then low detail. It must never
// oscillate, so each step fires once and only after a full window of frames.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createDegrade } from "./degrade.ts";

const feed = (d: (ms: number) => string | null, ms: number[]) => ms.map(d).filter((s) => s !== null);

test("a slow GPU steps down once at a time, then stays", () => {
  const d = createDegrade();
  assert.deepEqual(feed(d, Array(90).fill(30)), ["post-off"]);
  assert.deepEqual(feed(d, Array(90).fill(30)), ["low-detail"]);
  assert.deepEqual(feed(d, Array(500).fill(30)), []);
});

test("a fast GPU never steps down", () => {
  assert.deepEqual(feed(createDegrade(), Array(1000).fill(15)), []);
});

test("a step waits for a full window over the threshold", () => {
  const d = createDegrade();
  const alternating = Array.from({ length: 90 }, (_, i) => (i % 2 ? 30 : 15));
  assert.deepEqual(feed(d, alternating.slice(0, 89)), []);
  assert.deepEqual(feed(d, alternating.slice(89)), ["post-off"]);
});

test("one slow window after a fast one counts from scratch", () => {
  const d = createDegrade();
  assert.deepEqual(feed(d, [...Array(60).fill(15), ...Array(30).fill(40)]), ["post-off"]);
  assert.deepEqual(feed(d, Array(89).fill(30)), []);
});
