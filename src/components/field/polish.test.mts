// Run with `npm test`. Small rules about how the field moves, each a pure
// function, so they can be checked without a browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pushPast, tiltWanted } from "./polish.ts";

test("midpoints past the text column keep their spread", () => {
  // A morph's midpoints that would cross the text column move past it. They
  // must keep their spread there, not bunch into one band beside the copy.
  const push = 664;
  const spread = 240;
  const tenths = new Array(10).fill(0);
  for (let k = 0; k < 1000; k++) {
    const mx = (push * k) / 999;
    const out = pushPast(mx, push, spread);
    assert.ok(out >= push && out <= push + spread, `${mx} → ${out}`);
    tenths[Math.min(9, Math.floor(((out - push) / spread) * 10))]++;
  }
  assert.ok(Math.max(...tenths) <= 200, `per tenth: ${tenths.join(" ")}`);
  // A midpoint off the left of the screen goes no further than the band.
  assert.equal(pushPast(-500, push, spread), push + spread);
  // Midpoints already clear of the column stay where they are.
  assert.equal(pushPast(900, push, spread), 900);
});

test("the stack waits for its drawing before it tilts", () => {
  // The pointer in the top-right corner of a 1440×900 screen.
  const at = (now: number) =>
    tiltWanted({ motion: true, inside: true, stack: true, x: 1440, y: 0, w: 1440, h: 900, now, turnFrom: 2, tiltDeg: 8 });
  // While the drawing still shows beneath the stack, nothing tilts.
  assert.deepEqual(at(0), [0, 0]);
  assert.deepEqual(at(1.99), [0, 0]);
  // Once the stack starts to turn: half the tilt up, half to the right.
  assert.deepEqual(at(2), [4, 4]);
  assert.deepEqual(at(9), [4, 4]);
});
