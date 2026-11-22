// Run with `npm test`. The field draws every frame while it runs, and a
// single frame for a change while it is stopped. A single frame asked for just
// before the field starts running must not leave it stopped.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createLoop, type LoopOptions } from "./loop.ts";

function frames() {
  let queue: (() => void)[] = [];
  let id = 0;
  return {
    raf: (cb: () => void) => {
      queue.push(cb);
      return ++id;
    },
    caf: () => {
      queue = [];
    },
    run(count: number) {
      for (let k = 0; k < count; k++) {
        const now = queue;
        queue = [];
        now.forEach((f) => f());
      }
    },
    pending: () => queue.length,
  };
}

function setup(over: Partial<LoopOptions> = {}) {
  const f = frames();
  let t = 0;
  let drawn = 0;
  let hidden = false;
  const loop = createLoop({
    raf: f.raf,
    caf: f.caf,
    hidden: () => hidden,
    clock: () => (t += 1 / 60),
    motion: true,
    frame: () => drawn++,
    ...over,
  });
  return { f, loop, drawn: () => drawn, hide: (h: boolean) => (hidden = h) };
}

test("a frame asked for while stopped hands over to the loop once it runs", () => {
  // The film re-entering a scene: its mask and targets ask for a frame, then
  // the scene becomes visible and the field starts running.
  const { f, loop, drawn } = setup();
  loop.wake();
  loop.setRunning(true);
  f.run(10);
  assert.equal(drawn(), 10);
  assert.equal(f.pending(), 1, "the loop keeps going");
});

test("stopped, a change draws exactly one frame", () => {
  const { f, loop, drawn } = setup();
  loop.wake();
  loop.wake();
  f.run(5);
  assert.equal(drawn(), 1);
  assert.equal(f.pending(), 0);
});

test("with reduced motion it never loops", () => {
  const { f, loop, drawn } = setup({ motion: false });
  loop.setRunning(true);
  loop.wake();
  f.run(5);
  assert.equal(drawn(), 1);
});

test("a hidden page draws nothing until it is shown again", () => {
  const { f, loop, drawn, hide } = setup();
  hide(true);
  loop.setRunning(true);
  f.run(3);
  assert.equal(drawn(), 0);
  hide(false);
  loop.wake();
  f.run(3);
  assert.equal(drawn(), 3);
});

test("a fade draws its frames, even with reduced motion", () => {
  // Reduced motion's scene change is a short fade. Every frame of it is
  // drawn, then one more at its end so it finishes fully back in, then
  // nothing until the next change.
  const f = frames();
  let t = 0;
  let drawn = 0;
  const loop = createLoop({ raf: f.raf, caf: f.caf, hidden: () => false, clock: () => t, motion: false, frame: () => drawn++ });
  loop.runFor(0.25);
  // Frames 1/64 s apart: 15 inside the fade, then the one at its end.
  for (let k = 0; k < 40; k++) {
    t += 1 / 64;
    f.run(1);
  }
  assert.equal(drawn, 16);
  assert.equal(f.pending(), 0);
});

test("stopping it lets the last frame go and nothing more", () => {
  const { f, loop, drawn } = setup();
  loop.setRunning(true);
  f.run(3);
  loop.setRunning(false);
  f.run(3);
  assert.equal(drawn(), 3);
  assert.equal(f.pending(), 0);
});
