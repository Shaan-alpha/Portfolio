"use client";

import { useEffect } from "react";
import { installFilm, probeCoveringSnap } from "@/components/field/snap";

/** The film: the scenes, the dot field behind them (Task 7), and the
 *  one-scene-per-gesture scroll. Without JavaScript, or in a browser that
 *  fails the snap test, the scenes are simply sections of an ordinary page. */
export default function Film({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const reading = document.getElementById("reading");
    if (!reading) return;
    let cancelled = false;
    let teardown: (() => void) | null = null;

    // `data-film` is on while the film holds the screen, that is until the
    // reading part reaches the top of the viewport (a 1% band at the top).
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) delete root.dataset.film;
        else if (entry.boundingClientRect.top > 0) root.dataset.film = "";
      },
      { rootMargin: "0px 0px -99% 0px" },
    );
    io.observe(reading);

    probeCoveringSnap().then((ok) => {
      if (cancelled || !ok) return;
      teardown = installFilm({
        scenes: () => [...document.querySelectorAll<HTMLElement>("[data-scene]")],
        reading: () => reading,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    });

    return () => {
      cancelled = true;
      teardown?.();
      io.disconnect();
      delete root.dataset.film;
    };
  }, []);

  return <div data-film-root>{children}</div>;
}
