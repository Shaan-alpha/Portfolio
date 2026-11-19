// Run with `npm test`. The field draws in the canvas's own box. With a
// classic scrollbar the window is wider than the canvas, and drawing to the
// window's width would set every dot off its HTML marker. The field reads
// each scene's layout from its markers, relative to the scene's top.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readScene, viewportOf } from "./dom.ts";

test("the field's viewport is the canvas's own box, not the window", () => {
  assert.deepEqual(viewportOf({ clientWidth: 1521, clientHeight: 720 }), { w: 1521, h: 720 });
});

test("an unlaid-out canvas still gives a usable viewport", () => {
  assert.deepEqual(viewportOf({ clientWidth: 0, clientHeight: 0 }), { w: 1, h: 1 });
});

// ── readScene, on stand-ins for the page's elements ─────────────────────

type Box = { left: number; top: number; width: number; height: number };
type Fake = { dataset: Record<string, string>; getBoundingClientRect: () => Box };

const el = (box: Box, dataset: Record<string, string> = {}): Fake => ({ dataset, getBoundingClientRect: () => box });

/** A scene whose top is 900 px down the page when it is read. */
function scene(parts: { nodes?: Fake[]; masks?: Fake[] }) {
  const masks = parts.masks ?? [];
  const section = {
    getBoundingClientRect: () => ({ left: 0, top: 900, width: 1440, height: 900 }),
    querySelectorAll: (sel: string) =>
      sel === "[data-node]" ? (parts.nodes ?? []) : sel === "[data-mask]" ? masks : sel === '[data-mask="text"]' ? masks.filter((m) => m.dataset.mask === "text") : [],
    querySelector: () => null,
  };
  const header = el({ left: 0, top: 0, width: 1440, height: 64 });
  (globalThis as { document?: unknown }).document = { querySelector: (sel: string) => (sel === "header[data-mask]" ? header : null) };
  return readScene(section as unknown as HTMLElement);
}

test("the header's band comes first and the text column sets textRight", () => {
  const layout = scene({
    masks: [el({ left: 48, top: 1000, width: 500, height: 400 }, { mask: "text" }), el({ left: 700, top: 1100, width: 120, height: 30 }, { mask: "" })],
  });
  assert.deepEqual(layout.mask, [
    { x: 0, y: 0, w: 1440, h: 64 },
    { x: 48, y: 100, w: 500, h: 400 },
    { x: 700, y: 200, w: 120, h: 30 },
  ]);
  assert.equal(layout.textRight, 548);
});

test("a step's label rides along with its node", () => {
  const layout = scene({
    nodes: [el({ left: 600, top: 1100, width: 40, height: 40 }, { node: "", kind: "guard", flow: "0", step: "Salience check" })],
  });
  assert.equal(layout.flows.length, 1);
  assert.equal(layout.flows[0].radius, 20);
  assert.deepEqual(layout.flows[0].nodes, [{ x: 620, y: 220, kind: "guard", step: "Salience check" }]);
});

test("masks with no size are left out", () => {
  // A label hidden at this width has an empty box at the origin.
  const layout = scene({ masks: [el({ left: 0, top: 0, width: 0, height: 0 }, { mask: "" })] });
  assert.deepEqual(layout.mask, [{ x: 0, y: 0, w: 1440, h: 64 }]);
  assert.equal(layout.textRight, 0);
});
