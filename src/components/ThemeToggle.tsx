"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isLight = resolvedTheme === "light";
  const next = isLight ? "dark" : "light";

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Expand the new theme from the click point as a growing circle.
    if (!doc.startViewTransition || reduced) {
      setTheme(next);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = doc.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
        },
        {
          duration: 620,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-5 sm:bottom-auto sm:top-6 sm:right-6 z-[1100]
                 mono text-[11px] leading-none tracking-[0.04em]
                 px-3 py-2.5 rounded-[var(--r)]
                 bg-surface border border-border2 text-muted2
                 transition-colors duration-200
                 hover:border-accent hover:text-accent"
      aria-label={isLight ? "Switch to dark terminal theme" : "Switch to paper terminal theme"}
      aria-pressed={isLight}
      title={isLight ? "Switch to dark" : "Switch to paper"}
    >
      {/* The label names the theme you are in, in the site's own bracket grammar. */}
      <span aria-hidden>[ {isLight ? "paper" : "dark"} ]</span>
    </button>
  );
}
