// Run with `npm test`. The field draws in the canvas's own box. With a
// classic scrollbar the window is wider than the canvas, and drawing to the
// window's width would set every dot off its HTML marker.
import { test } from "node:test";
import assert from "node:assert/strict";
import { viewportOf } from "./dom.ts";

test("the field's viewport is the canvas's own box, not the window", () => {
  assert.deepEqual(viewportOf({ clientWidth: 1521, clientHeight: 720 }), { w: 1521, h: 720 });
});

test("an unlaid-out canvas still gives a usable viewport", () => {
  assert.deepEqual(viewportOf({ clientWidth: 0, clientHeight: 0 }), { w: 1, h: 1 });
});
