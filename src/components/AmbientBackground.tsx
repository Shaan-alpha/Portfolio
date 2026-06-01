"use client";

import { motion, useReducedMotion } from "framer-motion";

// Slow-drifting accent blobs that add depth behind the content sections.
// Scoped (absolute) to the content wrapper so they never touch the hero canvas.
const BLOBS = [
  {
    style: { top: "6%", left: "-10%", width: 420, height: 420, background: "var(--color-blue)", opacity: 0.08 },
    drift: { x: [0, 40, 0], y: [0, 28, 0] },
    duration: 17,
  },
  {
    style: { top: "40%", right: "-12%", left: "auto", width: 480, height: 480, background: "var(--color-purple)", opacity: 0.07 },
    drift: { x: [0, -36, 0], y: [0, 36, 0] },
    duration: 21,
  },
  {
    style: { top: "76%", left: "8%", width: 380, height: 380, background: "var(--color-pink)", opacity: 0.06 },
    drift: { x: [0, 30, 0], y: [0, -30, 0] },
    duration: 19,
  },
];

export default function AmbientBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className="ambient-blob"
          style={blob.style as React.CSSProperties}
          animate={reduceMotion ? undefined : blob.drift}
          transition={{ duration: blob.duration, ease: "easeInOut", repeat: Infinity }}
        />
      ))}
    </div>
  );
}
