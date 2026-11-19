// Run with `npm test`. The ticks name the film's nine scenes with strings the
// page already shows, and the header keeps Work current from the work scene
// down through the six systems and the archive below them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { THESIS_TITLE, WORK_TITLE, navCurrent, scenePlaces } from "./places.ts";
import { flagship } from "../../content/projects.ts";

test("the ticks list the nine scenes in order under their existing names", () => {
  const places = scenePlaces(flagship);
  assert.equal(places.length, 9);
  assert.deepEqual(
    places.map((p) => p.href),
    ["#top", "#thesis", "#work", ...flagship.map((p) => `#${p.id}`)],
  );
  assert.deepEqual(
    places.map((p) => p.name),
    ["Shaan Satsangi", "The model is a component, not the architecture.", "Selected work", ...flagship.map((p) => p.name)],
  );
  assert.equal(THESIS_TITLE, "The model is a component, not the architecture.");
  assert.equal(WORK_TITLE, "Selected work");
});

test("the header marks Work through the six systems and the archive", () => {
  const ids = flagship.map((p) => p.id);
  assert.equal(navCurrent("work", ids), "work");
  for (const id of ids) assert.equal(navCurrent(id, ids), "work", id);
  assert.equal(navCurrent("also-shipped", ids), "work");
  assert.equal(navCurrent("about", ids), "about");
  assert.equal(navCurrent("contact", ids), "contact");
  assert.equal(navCurrent(null, ids), null);
});
