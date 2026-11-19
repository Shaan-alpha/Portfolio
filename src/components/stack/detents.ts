/** A detented dial: the angle rests in notches stepDeg apart, and it takes
 *  more than `hysteresis` of a notch (65% by default) to click over into the
 *  next one. A plain halfway threshold would let a finger resting near it
 *  chatter back and forth; real detents have the same overlap. The returned
 *  function takes the current angle and reports whether a notch was crossed
 *  since the previous call. A jump across several notches reports once, so a
 *  caller that plays a tick per crossing never stacks them. */
export function createDetents(stepDeg: number, hysteresis = 0.65): (angleDeg: number) => boolean {
  let notch = 0;
  return (angleDeg) => {
    const position = angleDeg / stepDeg;
    if (Math.abs(position - notch) <= hysteresis) return false;
    notch = Math.round(position);
    return true;
  };
}
