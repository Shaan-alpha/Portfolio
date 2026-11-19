/** Which part of the page the field draws for: a scene's name, `null` for the
 *  reading part, or `undefined` when nothing has changed hands.
 *
 *  Two observers feed it. `inBand` holds the sections crossing the band
 *  across the middle of the screen (`order` lists them as the page does, the
 *  reading part, named "reading", last). `readingUp` is whether the reading
 *  part's top has come up past 88% of the screen's height. The reading part
 *  wins as soon as it is up, so the film's ending never flickers back to the
 *  last system mid-way; once it drops back below, the band decides again, so
 *  a scroll that turns back re-forms the last system. Pure, so it is tested
 *  without a browser; `Film.tsx` applies it. */
export function holder(order: readonly string[], inBand: ReadonlySet<string>, readingUp: boolean): string | null | undefined {
  if (readingUp || inBand.has("reading")) return null;
  const first = order.find((name) => name !== "reading" && inBand.has(name));
  return first ?? undefined;
}
