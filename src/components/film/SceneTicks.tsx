"use client";

import { useEffect, useState } from "react";
import { scenePlaces } from "./places";
import { flagship } from "@/content/projects";

const PLACES = scenePlaces(flagship);

/** The film's nine scenes as short ticks down the right edge: a list of real
 *  places on the page, not a counter. The current scene's tick is longer and
 *  drawn in ink; a tick shows its scene's name on hover and on focus, and
 *  takes you there. Hidden on phones and once the reading part holds the
 *  screen (CSS). The current scene is the one crossing the band the field
 *  and the header use. */
export default function SceneTicks() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const scenes = [...document.querySelectorAll<HTMLElement>("[data-scene]")];
    const seen = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target);
          else seen.delete(e.target);
        }
        const k = scenes.findIndex((s) => seen.has(s));
        if (k >= 0) setCurrent(k);
      },
      { rootMargin: "-38% 0px -58% 0px" },
    );
    scenes.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <nav aria-label="Scenes" data-ticks className="ticks">
      <ol>
        {PLACES.map((p, k) => (
          <li key={p.href}>
            <a href={p.href} aria-current={k === current ? "location" : undefined} className="tick">
              <span className="tick-name">{p.name}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
