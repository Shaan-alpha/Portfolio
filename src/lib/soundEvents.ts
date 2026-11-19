// Which page events may start audio, and which one a key press sounds on.
// Pure, so they are tested with node:test (src/lib/soundEvents.test.mts).

// Keys whose keydown is not user activation: Escape (HTML spec) and the
// modifiers, which browsers leave out so that a shortcut such as the one that
// opens DevTools does not count as intent.
const NOT_ACTIVATION = new Set(["Escape", "Shift", "Control", "Alt", "AltGraph", "Meta", "CapsLock", "Fn", "FnLock", "NumLock", "ScrollLock", "OS", "Hyper", "Super", "Symbol", "SymbolLock"]);

/** Whether a keydown counts as user activation. */
export function keyActivates(key: string): boolean {
  return !NOT_ACTIVATION.has(key);
}

/** Whether audio may be created or resumed now. Outside a user activation an
 *  AudioContext stays suspended and logs a warning, so where the browser
 *  reports its activation state (navigator.userActivation) that state decides;
 *  elsewhere the caller's event filters already have. */
export function mayUnlock(activation?: { isActive: boolean } | null): boolean {
  return activation ? activation.isActive : true;
}

/** The pointer event a key's press sound plays on. A mouse sounds as the key
 *  goes down. A touch or pen sounds as it lifts, because until then it may
 *  still turn into a scroll, which ends in pointercancel and never sounds. */
export function pressEvent(pointerType: string): "pointerdown" | "pointerup" {
  return pointerType === "mouse" ? "pointerdown" : "pointerup";
}
