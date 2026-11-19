/** When the field draws. While it runs (and motion is allowed) it draws
 *  every frame; otherwise a change asks for a single frame. Injected frame
 *  and clock functions keep it testable without a browser. */

export type LoopOptions = {
  raf: (cb: () => void) => number;
  caf: (id: number) => void;
  hidden: () => boolean;
  clock: () => number;
  motion: boolean;
  frame: (now: number, dt: number) => void;
};

export type Loop = { wake(): void; setRunning(on: boolean): void; runFor(seconds: number): void; cancel(): void };

export function createLoop(o: LoopOptions): Loop {
  let raf = 0;
  let running = false;
  let dirty = false;
  let last = 0;
  // Draw every frame until this clock time, even with reduced motion (a fade).
  let until = -Infinity;

  // One callback for both cases, deciding when it fires rather than when it
  // was asked for: a single frame queued just before the field starts running
  // becomes the loop's first frame instead of swallowing the start. Stopped,
  // it draws only when a change asked for it.
  function fire() {
    raf = 0;
    if (o.hidden()) return;
    const now = o.clock();
    const timed = now < until;
    const continuous = (running && o.motion) || timed;
    if (!continuous && !dirty) return;
    dirty = false;
    const dt = continuous ? Math.min(0.05, Math.max(0, now - last)) : 0;
    last = now;
    o.frame(now, dt);
    // A timed run ends with one more frame past its deadline, so its last
    // frame shows where it ends (a fade fully back in).
    if (timed) dirty = true;
    if (continuous) raf = o.raf(fire);
  }

  function wake() {
    dirty = true;
    if (raf || o.hidden()) return;
    raf = o.raf(fire);
  }

  return {
    wake,
    setRunning(on) {
      running = on;
      if (on) wake();
    },
    runFor(seconds) {
      until = Math.max(until, o.clock() + seconds);
      wake();
    },
    cancel() {
      if (raf) o.caf(raf);
      raf = 0;
      running = false;
    },
  };
}
