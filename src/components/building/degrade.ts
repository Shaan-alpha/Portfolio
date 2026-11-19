/** Steps the scene down on a GPU that cannot keep up. Feed it each animated
 *  frame's duration; after every full window of `windowFrames` frames whose
 *  average exceeds `thresholdMs`, it returns the next step, "post-off" and
 *  then "low-detail", each once. Every other frame returns null. A window
 *  always starts from scratch, so one slow moment cannot trip it twice. */
export function createDegrade(thresholdMs = 22, windowFrames = 90): (frameMs: number) => "post-off" | "low-detail" | null {
  const steps = ["post-off", "low-detail"] as const;
  let next = 0;
  let sum = 0;
  let count = 0;
  return (frameMs) => {
    if (next >= steps.length) return null;
    sum += frameMs;
    count++;
    if (count < windowFrames) return null;
    const slow = sum / count > thresholdMs;
    sum = 0;
    count = 0;
    return slow ? steps[next++] : null;
  };
}
