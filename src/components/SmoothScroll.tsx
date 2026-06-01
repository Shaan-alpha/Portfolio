"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { useFrameLoader } from "./FrameLoaderProvider";

export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const { ready } = useFrameLoader();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Handle anchor link clicks for smooth scroll navigation
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href^='#']");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          const el = document.querySelector(href);
          if (el) lenis.scrollTo(el as HTMLElement, { offset: 0 });
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Lock scroll while the preloader is up, then recompute + resume cleanly.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (ready) {
      lenis.resize();
      lenis.start();
    } else {
      lenis.scrollTo(0, { immediate: true });
      lenis.stop();
    }
  }, [ready]);

  return null;
}
