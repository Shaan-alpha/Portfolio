"use client";

import { useEffect, useState } from "react";

// Cycles through phrases with a type/erase effect. Reduced-motion shows phrase[0].
export default function TypedLine({ phrases, className }: { phrases: string[]; className?: string }) {
  const [out, setOut] = useState("");
  const [i, setI] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOut(phrases[0]);
      return;
    }
    const full = phrases[i % phrases.length];
    const done = out === full;
    const empty = out === "";
    const delay = del ? 40 : done ? 1600 : 70;
    const id = setTimeout(() => {
      if (!del && done) setDel(true);
      else if (del && empty) {
        setDel(false);
        setI((v) => v + 1);
      } else setOut(del ? full.slice(0, out.length - 1) : full.slice(0, out.length + 1));
    }, delay);
    return () => clearTimeout(id);
  }, [out, del, i, phrases]);

  return (
    <span className={className}>
      {out}
      <span className="caret">&nbsp;</span>
    </span>
  );
}
