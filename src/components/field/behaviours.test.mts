// Run with `npm test`. What each system's dots do comes from that system's
// own text, so the table may only name real systems and real steps, and its
// loops must stay quiet: 2 to 4 seconds, all inside one cycle.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BEHAVIOURS } from "./behaviours.ts";
import { flagship } from "../../content/projects.ts";

test("every behaviour names a flagship system and its real steps", () => {
  assert.deepEqual(Object.keys(BEHAVIOURS).sort(), flagship.map((p) => p.id).sort());
  for (const [id, b] of Object.entries(BEHAVIOURS)) {
    const p = flagship.find((q) => q.id === id);
    assert.ok(p, `${id} is not a flagship system`);
    const flows = p.flows ?? [];
    const labels = flows.flatMap((f) => f.steps.map((s) => s.label));
    const last = new Set(flows.map((f) => f.steps[f.steps.length - 1].label));
    for (const k of Object.keys(b.steps ?? {})) assert.ok(labels.includes(k), `${id}: no step "${k}"`);
    for (const k of Object.keys(b.edges ?? {})) {
      assert.ok(labels.includes(k), `${id}: no step "${k}"`);
      assert.ok(!last.has(k), `${id}: "${k}" ends its flow, so the edge after it is an exit`);
    }
    for (const k of Object.keys(b.exits ?? {})) assert.ok(last.has(k), `${id}: "${k}" does not end a flow`);
  }
});

test("every loop runs 2 to 4 seconds and stays inside one cycle", () => {
  for (const [id, b] of Object.entries(BEHAVIOURS)) {
    assert.ok(b.period >= 2 && b.period <= 4, `${id}: period ${b.period}`);
    assert.ok(b.still >= 0 && b.still < 1, `${id}: still ${b.still}`);
    const windows: [number, number][] = [];
    for (const s of Object.values(b.steps ?? {})) {
      if (s.arrive) windows.push(s.arrive);
      if (s.pulseAt !== undefined) assert.ok(s.pulseAt >= 0 && s.pulseAt < 1, `${id}: pulseAt ${s.pulseAt}`);
    }
    for (const list of [...Object.values(b.edges ?? {}), ...Object.values(b.exits ?? {})]) {
      let share = 0;
      for (const e of list) {
        if (e.kind === "stream") share += e.share ?? 1;
        else if (e.kind === "hold") {
          share += e.share;
          windows.push(e.window);
        } else {
          windows.push(e.window);
          const last = e.window[1] + (e.count - 1) * (e.gap ?? 0);
          assert.ok(last < 1, `${id}: the last packet ends at ${last}, past its cycle`);
        }
      }
      assert.ok(share <= 1 + 1e-9, `${id}: an edge's shares add up to ${share}`);
    }
    for (const [a, z] of windows) assert.ok(a >= 0 && a < z && z <= 1, `${id}: window ${a} to ${z}`);
  }
});
