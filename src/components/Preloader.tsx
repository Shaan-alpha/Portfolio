"use client";

import { useEffect, useState } from "react";

const LINES = ["booting…", "loading modules", "mounting ui", "ready ✓"];

export default function Preloader() {
  const [done, setDone] = useState(false);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(true);
      return;
    }
    if (n >= LINES.length) {
      const t = setTimeout(() => setDone(true), 250);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((v) => v + 1), 180);
    return () => clearTimeout(t);
  }, [n]);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-background flex items-center justify-center">
      <div className="mono text-[13px] text-muted2 space-y-1">
        {LINES.slice(0, n).map((l, i) => (
          <div key={i}>
            <span className="accent">$</span> {l}
          </div>
        ))}
        <span className="caret">&nbsp;</span>
      </div>
    </div>
  );
}
