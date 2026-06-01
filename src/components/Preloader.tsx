"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useFrameLoader } from "./FrameLoaderProvider";

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function Preloader() {
  const { progress, ready } = useFrameLoader();
  const reduceMotion = useReducedMotion();

  // Scroll locking is handled by SmoothScroll (Lenis-native) so it never
  // fights Lenis's dimension caching — see SmoothScroll.tsx.

  const dashoffset = RING_CIRCUMFERENCE * (1 - Math.min(100, progress) / 100);

  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: "var(--background)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <div className="relative flex items-center justify-center">
            {/* Soft ambient glow behind the monogram */}
            <motion.div
              aria-hidden
              className="absolute w-[180px] h-[180px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(150,150,158,0.28), rgba(150,150,158,0.1) 45%, transparent 70%)",
                filter: "blur(26px)",
              }}
              animate={reduceMotion ? undefined : { opacity: [0.55, 1, 0.55], scale: [0.92, 1.06, 0.92] }}
              transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity }}
            />

            {/* Progress ring */}
            <svg width="148" height="148" viewBox="0 0 148 148" className="relative -rotate-90">
              <defs>
                <linearGradient id="preloaderRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-blue)" />
                  <stop offset="50%" stopColor="var(--color-purple)" />
                  <stop offset="100%" stopColor="var(--color-pink)" />
                </linearGradient>
              </defs>
              <circle
                cx="74"
                cy="74"
                r={RING_RADIUS}
                fill="none"
                stroke="var(--border)"
                strokeWidth="4"
              />
              <circle
                cx="74"
                cy="74"
                r={RING_RADIUS}
                fill="none"
                stroke="url(#preloaderRing)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashoffset}
                style={{ transition: "stroke-dashoffset 0.35s cubic-bezier(0.22,1,0.36,1)" }}
              />
            </svg>

            {/* Monogram */}
            <div className="absolute flex items-center justify-center">
              <span className="font-display text-[34px] font-black tracking-[-0.04em] bg-gradient-to-br from-color-blue via-color-purple to-color-pink bg-clip-text text-transparent">
                SS
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-1.5">
            <span className="font-mono text-[15px] font-medium tabular-nums text-foreground">
              {Math.min(100, progress)}%
            </span>
            <span className="text-[11px] tracking-[0.22em] uppercase text-muted">
              loading experience
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
