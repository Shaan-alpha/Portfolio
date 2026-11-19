import { profile } from "../../content/profile.ts";

/** The thesis's brand line (as on the OG card) and the work scene's title.
 *  The scenes show them, and the ticks name those scenes with them. */
export const THESIS_TITLE = "The model is a component, not the architecture.";
export const WORK_TITLE = "Selected work";

export type Place = { href: string; name: string };

/** The film's nine scenes, top to bottom, as the scene ticks list them. */
export function scenePlaces(systems: readonly { id: string; name: string }[]): Place[] {
  return [
    { href: "#top", name: profile.name },
    { href: "#thesis", name: THESIS_TITLE },
    { href: "#work", name: WORK_TITLE },
    ...systems.map((s) => ({ href: `#${s.id}`, name: s.name })),
  ];
}

/** Which header link is current. Work covers the work scene, each system and
 *  the archive below them; every other section is its own. */
export function navCurrent(active: string | null, systemIds: readonly string[]): string | null {
  if (active === "also-shipped" || (active !== null && systemIds.includes(active))) return "work";
  return active;
}
