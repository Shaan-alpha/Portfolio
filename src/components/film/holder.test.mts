// Run with `npm test`. Which part of the page the field draws for: a scene,
// or the reading part (null). Two observers feed it: the band across the
// middle of the screen, and a line at 88% of the screen's height that the
// reading part's top crosses as it comes up. They must never disagree, or the
// film's ending flickers back to the last system, or leaves it blank.
import { test } from "node:test";
import assert from "node:assert/strict";
import { holder } from "./holder.ts";

const ORDER = ["hero", "thesis", "work", "atlas", "think9-brain", "reading"];
const band = (...names: string[]) => new Set(names);

test("stepping down, the reading part takes the screen as soon as it comes up", () => {
  assert.equal(holder(ORDER, band("think9-brain"), true), null);
});

test("mid-way, with the last system still in the band, the reading part keeps it", () => {
  assert.equal(holder(ORDER, band("think9-brain", "reading"), true), null);
});

test("stepping back up re-forms the last system", () => {
  assert.equal(holder(ORDER, band("think9-brain"), false), "think9-brain");
});

test("a scroll that turns back before the reading part arrives re-forms the last system", () => {
  // Past the line, then back below it, with the last system in the band throughout.
  assert.equal(holder(ORDER, band("think9-brain"), true), null);
  assert.equal(holder(ORDER, band("think9-brain"), false), "think9-brain");
});

test("loading inside the reading part, or an instant step to it, goes straight there", () => {
  assert.equal(holder(ORDER, band("reading"), true), null);
});

test("the first scene in the band holds the screen", () => {
  assert.equal(holder(ORDER, band("work", "atlas"), false), "work");
});

test("with nothing in the band and the reading part below, nothing changes", () => {
  assert.equal(holder(ORDER, band(), false), undefined);
});
