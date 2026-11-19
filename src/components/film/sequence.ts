/** A timed highlight sequence: each group lit in turn, then none. `stop()`
 *  cancels what is still pending and clears whatever is lit, so leaving the
 *  scene mid-way never carries a highlight into the next one. */
export function createSequence(o: {
  groups: number[];
  startMs: number;
  stepMs: number;
  highlight: (group: number) => void;
  schedule: (fn: () => void, ms: number) => number;
  cancel: (id: number) => void;
}) {
  let pending: number[] = [];
  let lit = false;
  const light = (g: number) => {
    o.highlight(g);
    lit = g >= 0;
  };
  return {
    start() {
      this.stop();
      [...o.groups, -1].forEach((g, k) => pending.push(o.schedule(() => light(g), o.startMs + k * o.stepMs)));
    },
    stop() {
      pending.forEach(o.cancel);
      pending = [];
      if (lit) light(-1);
    },
  };
}
