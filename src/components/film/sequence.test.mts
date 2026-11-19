// Run with `npm test`. The thesis lights its three parts in turn once. If the
// reader moves on mid-way, nothing may stay lit in the next scene.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSequence } from "./sequence.ts";

function clock() {
  let now = 0;
  let timers: { at: number; id: number; fn: () => void }[] = [];
  let id = 0;
  return {
    schedule: (fn: () => void, ms: number) => {
      timers.push({ at: now + ms, id: ++id, fn });
      return id;
    },
    cancel: (t: number) => {
      timers = timers.filter((x) => x.id !== t);
    },
    advance(ms: number) {
      const end = now + ms;
      for (;;) {
        const due = timers.filter((t) => t.at <= end).sort((a, b) => a.at - b.at)[0];
        if (!due) break;
        timers = timers.filter((t) => t !== due);
        now = due.at;
        due.fn();
      }
      now = end;
    },
  };
}

test("the sequence lights each part in turn and ends unlit", () => {
  const c = clock();
  const lit: number[] = [];
  const seq = createSequence({ groups: [1, 3, 4], startMs: 1500, stepMs: 500, highlight: (g) => lit.push(g), schedule: c.schedule, cancel: c.cancel });
  seq.start();
  c.advance(4000);
  assert.deepEqual(lit, [1, 3, 4, -1]);
});

test("leaving mid-sequence clears the lit part and cancels the rest", () => {
  const c = clock();
  const lit: number[] = [];
  const seq = createSequence({ groups: [1, 3, 4], startMs: 1500, stepMs: 500, highlight: (g) => lit.push(g), schedule: c.schedule, cancel: c.cancel });
  seq.start();
  c.advance(1600);
  seq.stop();
  c.advance(3000);
  assert.deepEqual(lit, [1, -1]);
});
