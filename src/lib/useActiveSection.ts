"use client";

import { useEffect, useState } from "react";

/** Scroll-spy: returns the id of whichever element currently crosses a thin
 *  band just above the middle of the viewport. One IntersectionObserver, no
 *  scroll listeners. */
export function useActiveSection(ids: readonly string[], fallback: string | null = null) {
  const [active, setActive] = useState<string | null>(fallback);
  const key = ids.join("|");

  useEffect(() => {
    const els = key
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // Document order decides ties, so the earliest visible section wins.
        const first = els.find((el) => visible.has(el.id));
        setActive(first ? first.id : fallback);
      },
      { rootMargin: "-38% 0px -58% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key, fallback]);

  return active;
}
