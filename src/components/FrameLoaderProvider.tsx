"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

export const FRAME_COUNT = 240;
// The first slice of frames covers the early part of the scroll. We reveal the
// site once these have decoded; the rest keep streaming in the background.
const CRITICAL_FRAMES = 80;
// Never flash the preloader — keep it up at least this long (e.g. cached loads).
const MIN_DISPLAY_MS = 600;
// Failsafe: reveal the site even if the network is slow or frames fail.
const MAX_WAIT_MS = 6000;

type FrameLoaderValue = {
  imagesRef: RefObject<HTMLImageElement[]>;
  progress: number; // 0–100, tracks the critical set
  ready: boolean;
};

const FrameLoaderContext = createContext<FrameLoaderValue | null>(null);

export function useFrameLoader(): FrameLoaderValue {
  const ctx = useContext(FrameLoaderContext);
  if (!ctx) {
    throw new Error("useFrameLoader must be used within a FrameLoaderProvider");
  }
  return ctx;
}

export function FrameLoaderProvider({ children }: { children: ReactNode }) {
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    const criticalTarget = Math.min(CRITICAL_FRAMES, FRAME_COUNT);
    let criticalSettled = 0;
    let revealed = false;

    // Resolve the GitHub-Pages /Portfolio base path synchronously (effects only
    // run client-side), so frames load from the right path on the first try —
    // no double-fetch / 404 burst from a state update racing the preload.
    const path = window.location.pathname.toLowerCase();
    const basePath = path.startsWith("/portfolio") ? "/Portfolio" : "";

    const framePath = (index: number) =>
      `${basePath}/frames-webp/frame-${index.toString().padStart(3, "0")}.webp`;

    const reveal = () => {
      if (revealed || cancelled) return;
      revealed = true;
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
      window.setTimeout(() => {
        if (!cancelled) setReady(true);
      }, wait);
    };

    // Settled = decoded OR failed — progress should never stall on a bad frame.
    const settleCritical = () => {
      criticalSettled += 1;
      if (!cancelled) {
        setProgress(Math.min(100, Math.round((criticalSettled / criticalTarget) * 100)));
      }
      if (criticalSettled >= criticalTarget) reveal();
    };

    const loadFrame = (index: number) => {
      const img = new Image();
      img.src = framePath(index);
      return img
        .decode()
        .then(() => {
          if (!cancelled) imagesRef.current[index] = img;
        })
        .catch(() => {
          /* keep going — failsafe + interpolation cover gaps */
        })
        .finally(() => {
          if (index <= criticalTarget) settleCritical();
        });
    };

    // Hard failsafe so the site is never permanently blocked.
    const failsafe = window.setTimeout(reveal, MAX_WAIT_MS);

    const preload = async () => {
      // Frame 1 first so the canvas has something to paint immediately.
      await loadFrame(1);
      if (cancelled) return;

      const BATCH_SIZE = 30;
      for (let b = 2; b <= FRAME_COUNT; b += BATCH_SIZE) {
        if (cancelled) return;
        const batch: Promise<void>[] = [];
        for (let i = b; i < Math.min(b + BATCH_SIZE, FRAME_COUNT + 1); i++) {
          batch.push(loadFrame(i));
        }
        await Promise.all(batch);
      }
    };

    preload();

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <FrameLoaderContext.Provider value={{ imagesRef, progress, ready }}>
      {children}
    </FrameLoaderContext.Provider>
  );
}
