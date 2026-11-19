"use client";

/** The film: the scenes, the dot field behind them, and the one-scene-per-
 *  gesture scroll. Tasks 5 and 7 of the phase 1 plan fill this in. */
export default function Film({ children }: { children: React.ReactNode }) {
  return <div data-film-root>{children}</div>;
}
