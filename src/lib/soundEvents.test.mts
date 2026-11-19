// Run with `npm test`. Audio may only start inside a real user activation:
// outside one, creating or resuming an AudioContext logs a warning and stays
// suspended. And on touch, a press that turns into a scroll must stay silent.
import { test } from "node:test";
import assert from "node:assert/strict";
import { keyActivates, mayUnlock, pressEvent } from "./soundEvents.ts";

test("modifier keys and Escape are not user activation", () => {
  for (const key of ["Shift", "Control", "Alt", "AltGraph", "Meta", "CapsLock", "Escape"]) {
    assert.equal(keyActivates(key), false, key);
  }
});

test("ordinary keys are user activation", () => {
  for (const key of ["Enter", " ", "a", "Tab", "ArrowDown"]) {
    assert.equal(keyActivates(key), true, key);
  }
});

test("the browser's own activation state decides when it reports one", () => {
  assert.equal(mayUnlock({ isActive: false }), false);
  assert.equal(mayUnlock({ isActive: true }), true);
  // Browsers without navigator.userActivation fall back to the event filters.
  assert.equal(mayUnlock(undefined), true);
});

test("a mouse key sounds as it goes down; touch and pen as the finger lifts", () => {
  assert.equal(pressEvent("mouse"), "pointerdown");
  assert.equal(pressEvent("touch"), "pointerup");
  assert.equal(pressEvent("pen"), "pointerup");
});
