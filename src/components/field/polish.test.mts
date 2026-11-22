// Run with `npm test`. Small rules about how the field moves, each a pure
// function, so they can be checked without a browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fadeAlpha, pushPast, refade, resizeNeeds, tiltWanted } from "./polish.ts";

const close = (a: number, b: number, eps: number, what: string) => assert.ok(Math.abs(a - b) <= eps, `${what}: ${a} vs ${b}`);

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

test("the fade goes out, then in", () => {
  // Reduced motion's scene change: 100 ms out, the new scene placed, 100 ms in.
  const at = (now: number) => fadeAlpha(now, 3, 0.1);
  for (const [now, want] of [[3, 1], [3.05, 0.5], [3.1, 0], [3.15, 0.5], [3.2, 1]]) close(at(now), want, 1e-9, `at ${now}`);
  // Outside a fade the field shows in full.
  assert.equal(at(2), 1);
  assert.equal(at(5), 1);
});

test("a second change mid-fade carries on from where it is", () => {
  // A second step, or a theme change, during a fade: the field neither
  // blanks nor flashes. It heads out again from the level it shows now.
  const half = 0.1;
  // Halfway out (level 0.5), the fade simply carries on.
  close(refade(3.05, 3, half), 3, 1e-9, "halfway out");
  // Halfway back in (level 0.5), a new fade-out starts from 0.5, not from 1.
  const s = refade(3.15, 3, half);
  close(s, 3.1, 1e-9, "halfway in");
  close(fadeAlpha(3.15, s, half), 0.5, 1e-9, "the same level at the change");
  close(fadeAlpha(3.17, s, half), 0.3, 1e-9, "then heading out");
  close(fadeAlpha(3.2, s, half), 0, 1e-9, "out, where the new scene is placed");
  close(fadeAlpha(3.3, s, half), 1, 1e-9, "and fully back in");
});

test("a phone's URL bar only resizes the canvas", () => {
  // The bar hides as the reader scrolls: the window grows 56 px taller, but
  // 100svh, and with it every scene and marker, stays where it was.
  assert.equal(resizeNeeds({ w: 390, h: 788, sceneH: 788 }, { w: 390, h: 844, sceneH: 788 }), "canvas");
});

test("a new width or scene height rebuilds the field, and no change does nothing", () => {
  // Turned sideways, narrowed, or text zoomed until the scenes grow: every
  // marker moves, so every scene's targets are built again.
  assert.equal(resizeNeeds({ w: 390, h: 844, sceneH: 844 }, { w: 844, h: 390, sceneH: 390 }), "rebuild");
  assert.equal(resizeNeeds({ w: 1440, h: 900, sceneH: 900 }, { w: 1280, h: 900, sceneH: 900 }), "rebuild");
  assert.equal(resizeNeeds({ w: 1440, h: 900, sceneH: 900 }, { w: 1440, h: 900, sceneH: 1100 }), "rebuild");
  assert.equal(resizeNeeds({ w: 390, h: 844, sceneH: 844 }, { w: 390, h: 844, sceneH: 844 }), "none");
});
