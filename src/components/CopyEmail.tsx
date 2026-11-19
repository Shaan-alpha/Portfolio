"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { play } from "@/lib/sound";

export default function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2200);
    return () => clearTimeout(t);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setState("copied");
      play("copy");
    } catch {
      setState("failed");
      play("error");
    }
  };

  return (
    // data-sfx: this key plays its result, not the generic key press.
    <button type="button" onClick={copy} data-sfx="" className="key key-secondary key-sm">
      {state === "copied" ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Select and copy" : "Copy"}</span>
    </button>
  );
}
